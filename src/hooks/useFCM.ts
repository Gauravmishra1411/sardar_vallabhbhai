'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { requestFCMToken, onForegroundMessage } from '@/lib/fcm';

interface UseFCMOptions {
  userId: string | null;
  userRole: string | null;
  onForegroundNotif?: (title: string, body: string, data: Record<string, string>) => void;
}

/**
 * Hook that:
 * 1. Requests browser notification permission
 * 2. Gets the FCM token and saves it to Firestore (users/{userId}.fcmToken)
 * 3. Listens for foreground messages and calls the callback (or shows a browser notification)
 */
export function useFCM({ userId, userRole, onForegroundNotif }: UseFCMOptions) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    let unsubscribe: (() => void) | null = null;

    async function init() {
      // 1. Get permission + token
      const token = await requestFCMToken();

      if (token && userId) {
        // 2. Save token to Firestore so server can send targeted pushes
        try {
          await setDoc(
            doc(db, 'users', userId),
            {
              fcmToken: token,
              fcmTokenUpdatedAt: serverTimestamp(),
              role: userRole,
            },
            { merge: true }
          );
          console.log('[FCM] Token saved to Firestore for user:', userId);
        } catch (err) {
          console.warn('[FCM] Could not save token to Firestore:', err);
        }
      }

      // 3. Listen for foreground messages (tab is visible)
      unsubscribe = await onForegroundMessage(({ title, body, data }) => {
        console.log('[FCM] Foreground message:', title, body, data);

        if (onForegroundNotif) {
          // Let the parent component handle the notification (e.g. show a toast)
          onForegroundNotif(title, body, data);
        } else {
          // Default: show a native browser notification
          if (Notification.permission === 'granted') {
            const notif = new Notification(title, {
              body,
              icon: '/icon-192.png',
            });

            // Click navigates based on issueId / role
            notif.onclick = () => {
              window.focus();
              const issueId = data.issueId;
              if (issueId) {
                router.push(
                  userRole === 'warden'
                    ? `/warden/dashboard?issueId=${issueId}`
                    : `/admin/dashboard?issueId=${issueId}`
                );
              }
            };
          }
        }
      });
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, userRole, router, onForegroundNotif]);
}
