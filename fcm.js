/* ─────────────────────────────────────────────
   MIS REMEDIOS — Firebase Cloud Messaging
   Módulo de notificaciones push v2.0
   © 2025 Angelo Campos Rivera
───────────────────────────────────────────── */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js';

const VAPID_KEY = 'BFKtVqE-fCj8nshSPcVYNMUX1v55xeFxx7ISGHcJIKx4axezDlVUEXqg276Y_rfEbYAn0BohX6WBuP3cY9Zzm7E';

const firebaseConfig = {
  apiKey: "AIzaSyDWXhkBh7VJHnQrolpPZt6VPYZzlE4iOSc",
  authDomain: "mis-remedios-app.firebaseapp.com",
  projectId: "mis-remedios-app",
  storageBucket: "mis-remedios-app.firebasestorage.app",
  messagingSenderId: "397370003949",
  appId: "1:397370003949:web:6860dd226833ba9d25d7e4"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/* ── Solicitar permiso y obtener token FCM ── */
export async function iniciarNotificaciones() {
  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      console.warn('Permiso de notificaciones denegado');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('Token FCM obtenido:', token);
      localStorage.setItem('fcm_token', token);
      return token;
    }
  } catch (err) {
    console.error('Error al obtener token FCM:', err);
  }
  return null;
}

/* ── Escuchar mensajes cuando la app está abierta ── */
onMessage(messaging, payload => {
  const { title, body } = payload.notification || {};
  if (Notification.permission === 'granted') {
    new Notification(title || 'Mis Remedios', {
      body: body || 'Es hora de tomar tu medicamento',
      icon: '/mis-remedios/icon-192.png',
      badge: '/mis-remedios/icon-72.png',
      vibrate: [300, 100, 300]
    });
  }
});
