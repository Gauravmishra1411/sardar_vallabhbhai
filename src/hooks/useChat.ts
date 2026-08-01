import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: string;
  messageType: 'text' | 'voice';
  text?: string;
  audioUrl?: string;
  audioDuration?: string;
  timestamp: string; // ISO string
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  unreadCount_admin?: number;
  unreadCount_warden?: number;
  [key: string]: any;
}

export function useChat(roomId: string | null) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  const markAsRead = useCallback(async (currentRoomId: string) => {
    if (!currentUser) return;
    try {
      const roomRef = doc(db, 'chatRooms', currentRoomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const fieldToUpdate = currentUser.role === 'admin' ? 'unreadCount_admin' : 'unreadCount_warden';
        if ((roomSnap.data()[fieldToUpdate] || 0) > 0) {
          await updateDoc(roomRef, { [fieldToUpdate]: 0 });
        }
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!roomId || !currentUser) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
    // Listen to messages ordered by timestamp
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const newMessages = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let tsString = new Date().toISOString();

          if (data.timestamp) {
            if (typeof data.timestamp.toDate === 'function') {
              tsString = data.timestamp.toDate().toISOString();
            } else if (typeof data.timestamp === 'string') {
              tsString = data.timestamp;
            } else if (typeof data.timestamp === 'number') {
              tsString = new Date(data.timestamp).toISOString();
            } else if (data.timestamp.seconds) {
              tsString = new Date(data.timestamp.seconds * 1000).toISOString();
            }
          }

          return {
            id: docSnap.id,
            senderId: data.senderId,
            senderRole: data.senderRole,
            messageType: data.messageType || 'text',
            text: data.text,
            audioUrl: data.audioUrl,
            audioDuration: data.audioDuration,
            timestamp: tsString,
            isRead: !!data.isRead,
          } as ChatMessage;
        });
        
        setMessages(newMessages);
        setLoading(false);
        markAsRead(roomId);
      }, 
      (error) => {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId, currentUser, markAsRead]);

  const sendMessage = async (
    type: 'text' | 'voice', 
    content: string,
    audioDuration?: string
  ) => {
    if (!roomId || !currentUser) return;
    setSending(true);

    try {
      const roomRef = doc(db, 'chatRooms', roomId);
      const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
      const now = serverTimestamp();

      const messageData = {
        senderId: currentUser.id,
        senderRole: currentUser.role,
        messageType: type,
        timestamp: now,
        isRead: false,
        ...(type === 'text' ? { text: content } : { audioUrl: content, audioDuration })
      };

      const roomSnap = await getDoc(roomRef);
      const otherRole = currentUser.role === 'admin' ? 'warden' : 'admin';
      const unreadField = `unreadCount_${otherRole}`;

      if (!roomSnap.exists()) {
        const participantIds = roomId.split('_');
        await setDoc(roomRef, {
          participants: participantIds,
          lastMessage: type === 'text' ? content : '🎤 Voice message',
          lastMessageTime: now,
          unreadCount_admin: currentUser.role === 'warden' ? 1 : 0,
          unreadCount_warden: currentUser.role === 'admin' ? 1 : 0,
        }, { merge: true });
      } else {
        await setDoc(roomRef, {
          lastMessage: type === 'text' ? content : '🎤 Voice message',
          lastMessageTime: now,
          [unreadField]: (roomSnap.data()[unreadField] || 0) + 1
        }, { merge: true });
      }

      await addDoc(messagesRef, messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, sendMessage };
}
