// Firebase Messaging Service Worker
// This file MUST live at /public/firebase-messaging-sw.js
// It handles background push notifications when the app tab is not focused.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase inside the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyDM1CTp6FVGQYSVtlpalRURUiCpLawGGlI',
  authDomain: 'sardar-vallabhbhai.firebaseapp.com',
  projectId: 'sardar-vallabhbhai',
  storageBucket: 'sardar-vallabhbhai.firebasestorage.app',
  messagingSenderId: '1066044087657',
  appId: '1:1066044087657:web:d26535c6d10e1a48a531f8',
});

const messaging = firebase.messaging();

// Handle background messages (app is in background / tab not focused)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'SVPUAT Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',   // Place your app icon here
    badge: '/icon-72.png',
    tag: payload.data?.issueId || 'svpuat-notif',
    data: payload.data || {},
    actions: [
      { action: 'view', title: '👁 View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open/focus the app tab and navigate
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const issueId = data.issueId;
  const role = data.role || 'admin';

  let url = '/';
  if (issueId) {
    url = role === 'warden'
      ? `/warden/dashboard?issueId=${issueId}`
      : `/admin/dashboard?issueId=${issueId}`;
  } else if (role === 'warden') {
    url = '/warden/dashboard';
  } else {
    url = '/admin/dashboard';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
