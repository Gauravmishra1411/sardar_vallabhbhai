import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export function usePresence() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.id);

    // Set online status when component mounts
    const setOnline = async () => {
      try {
        await setDoc(
          userRef,
          {
            isOnline: true,
            lastSeen: serverTimestamp(),
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Presence update failed:', err);
      }
    };

    setOnline();

    // Update lastSeen periodically while active
    const interval = setInterval(() => {
      setOnline();
    }, 60000); // Every minute

    // Set offline status on unmount or tab close
    const setOffline = () => {
      setDoc(
        userRef,
        {
          isOnline: false,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      ).catch(console.warn);
    };

    window.addEventListener('beforeunload', setOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [currentUser]);
}
