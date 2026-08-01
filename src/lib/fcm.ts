'use client';

// FCM Web Push helper for Next.js
// Handles: permission request, token retrieval, foreground messages

import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { app } from '@/lib/firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

let messagingInstance: Messaging | null = null;

/** Get (or lazily initialize) the Firebase Messaging instance */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Firebase Messaging not supported in this browser.');
      return null;
    }
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.error('[FCM] Failed to get messaging instance:', err);
    return null;
  }
}

/**
 * Request notification permission and return the FCM registration token.
 * Returns null if permission is denied or the browser doesn't support it.
 */
export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  if (!VAPID_KEY || VAPID_KEY.trim() === '') {
    console.warn('[FCM] Skipping token request because NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied.');
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    // Register the service worker first
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('[FCM] Token obtained:', token);
      return token;
    } else {
      console.warn('[FCM] No registration token available.');
      return null;
    }
  } catch (err) {
    console.warn('[FCM] Error getting token (ignored in dev):', err);
    return null;
  }
}

/**
 * Listen for foreground messages (app tab is focused).
 * Calls the provided callback with { title, body, data }.
 */
export async function onForegroundMessage(
  callback: (payload: { title: string; body: string; data: Record<string, string> }) => void
): Promise<(() => void) | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging, (payload) => {
    const title = payload.notification?.title || 'SVPUAT Notification';
    const body = payload.notification?.body || '';
    const data = (payload.data || {}) as Record<string, string>;
    callback({ title, body, data });
  });

  return unsubscribe;
}
