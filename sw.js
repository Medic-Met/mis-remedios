/* ─────────────────────────────────────────────
   MIS REMEDIOS — Service Worker v2.0
   © 2025 Angelo Campos Rivera
   Todos los derechos reservados
───────────────────────────────────────────── */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

/* ── FIREBASE CONFIG ── */
firebase.initializeApp({
  apiKey: "AIzaSyDWXhkBh7VJHnQrolpPZt6VPYZzlE4iOSc",
  authDomain: "mis-remedios-app.firebaseapp.com",
  projectId: "mis-remedios-app",
  storageBucket: "mis-remedios-app.firebasestorage.app",
  messagingSenderId: "397370003949",
  appId: "1:397370003949:web:6860dd226833ba9d25d7e4"
});

const messaging = firebase.messaging();

const CACHE_NAME = 'mis-remedios-v2';
const ASSETS = ['/mis-remedios/', '/mis-remedios/index.html'];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ── ACTIVATE ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── FETCH ── */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

/* ── PUSH NOTIFICATIONS (FCM) ── */
messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  return self.registration.showNotification(title || 'Mis Remedios', {
    body: body || 'Es hora de tomar tu medicamento',
    icon: icon || '/mis-remedios/icon-192.png',
    badge: '/mis-remedios/icon-72.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: 'medicamento',
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      { action: 'tomado', title: '✓ Tomado' },
      { action: 'snooze', title: '⏰ 10 min más' }
    ]
  });
});

/* ── NOTIFICATION CLICK ── */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'snooze') {
    event.waitUntil(
      new Promise(resolve => {
        setTimeout(() => {
          self.registration.showNotification('Mis Remedios — Recordatorio', {
            body: event.notification.body,
            icon: '/mis-remedios/icon-192.png',
            badge: '/mis-remedios/icon-72.png',
            vibrate: [200, 100, 200],
            tag: 'medicamento-snooze',
            requireInteraction: true
          });
          resolve();
        }, 10 * 60 * 1000);
      })
    );
  } else {
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

/* ── BACKGROUND SYNC ── */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-alarms') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(list =>
        list.forEach(c => c.postMessage({ type: 'CHECK_ALARMS' }))
      )
    );
  }
});
