/* ─────────────────────────────────────────────
   MIS REMEDIOS — Service Worker v1.0
   © 2025 Angelo Campos Rivera
   Todos los derechos reservados
───────────────────────────────────────────── */

const CACHE_NAME = 'mis-remedios-v1';
const ASSETS = ['/mis-remedios/', '/mis-remedios/index.html'];

/* ── INSTALL: cache the app shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ── ACTIVATE: clean old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── FETCH: serve from cache, fallback to network ── */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

/* ── PUSH NOTIFICATIONS ── */
self.addEventListener('push', event => {
  let data = { title: 'Mis Remedios', body: 'Es hora de tomar tu medicamento', icon: '/mis-remedios/icon-192.png' };
  try { data = event.data.json(); } catch(e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/mis-remedios/icon-72.png',
      vibrate: [200, 100, 200],
      tag: 'medicamento',
      requireInteraction: true,
      actions: [
        { action: 'tomado', title: 'Marcar como tomado' },
        { action: 'snooze', title: 'Recordar en 10 min' }
      ]
    })
  );
});

/* ── NOTIFICATION CLICK ── */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'snooze') {
    // Re-notify in 10 minutes
    event.waitUntil(
      new Promise(resolve => {
        setTimeout(() => {
          self.registration.showNotification('Mis Remedios — Recordatorio', {
            body: event.notification.body,
            icon: '/mis-remedios/icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'medicamento-snooze',
            requireInteraction: true
          });
          resolve();
        }, 10 * 60 * 1000);
      })
    );
  } else {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('/mis-remedios/');
      })
    );
  }
});

/* ── BACKGROUND SYNC: check alarms every minute ── */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-alarms') {
    event.waitUntil(checkScheduledAlarms());
  }
});

async function checkScheduledAlarms() {
  // Get all clients and ask them to check alarms
  const clientList = await clients.matchAll({ type: 'window' });
  clientList.forEach(client => client.postMessage({ type: 'CHECK_ALARMS' }));
}

/* ── MESSAGE from main app ── */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_ALARM') {
    const { nombre, dosis, hora, delay } = event.data;
    // Schedule notification after delay (ms)
    setTimeout(() => {
      self.registration.showNotification('Mis Remedios — Hora de tu medicamento', {
        body: `${nombre}${dosis ? ' · ' + dosis : ''} — ${hora}`,
        icon: '/mis-remedios/icon-192.png',
        badge: '/mis-remedios/icon-72.png',
        vibrate: [300, 100, 300, 100, 300],
        tag: `alarm-${nombre}-${hora}`,
        requireInteraction: true,
        actions: [
          { action: 'tomado', title: '✓ Tomado' },
          { action: 'snooze', title: '⏰ 10 min más' }
        ]
      });
    }, delay);
  }
});
