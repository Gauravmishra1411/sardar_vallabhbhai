import React, { useState, useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageArea } from './ChatMessageArea';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types/auth';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatRoom } from '@/hooks/useChat';
import { usePresence } from '@/hooks/usePresence';

export const ChatLayout: React.FC = () => {
  const { currentUser, users } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [liveRecipient, setLiveRecipient] = useState<User | null>(null);
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);

  // Initialize online presence for this tab
  usePresence();

  // Helper for deterministic room ID
  const getRoomId = (id1: string, id2: string) => [id1, id2].sort().join('_');

  // Listen to chat rooms where the current user is a participant
  useEffect(() => {
    if (!currentUser) return;
    
    const roomsRef = collection(db, 'chatRooms');
    const q = query(
      roomsRef, 
      where('participants', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRooms = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as ChatRoom[];
      
      // Sort by lastMessageTime descending
      fetchedRooms.sort((a, b) => {
        const getTime = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          if (typeof val === 'string') return new Date(val).getTime();
          if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
          if (val.seconds) return val.seconds * 1000;
          return 0;
        };
        return getTime(b.lastMessageTime) - getTime(a.lastMessageTime);
      });
      
      setRooms(fetchedRooms);
    }, (error) => {
      console.error('Error fetching chat rooms:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Auto-select first contact on desktop
  useEffect(() => {
    if (!selectedRoomId && currentUser && users.length > 0) {
      const availableContacts = users.filter(u => {
        if (u.id === currentUser.id) return false;
        if (currentUser.role === 'admin') return u.role === 'warden' && (u.status === 'active' || u.approved === true);
        return u.role === 'admin';
      });

      if (availableContacts.length > 0) {
        const target = availableContacts[0];
        const rId = getRoomId(currentUser.id, target.id);
        setSelectedRoomId(rId);
        setSelectedUser(target);
      }
    }
  }, [currentUser, users, selectedRoomId]);

  // Listen live to selected recipient user document for real-time presence
  useEffect(() => {
    if (!selectedUser) {
      setLiveRecipient(null);
      return;
    }

    setLiveRecipient(selectedUser);
    const userDocRef = doc(db, 'users', selectedUser.id);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setLiveRecipient({
          ...selectedUser,
          ...docSnap.data(),
        } as User);
      }
    }, (err) => {
      console.warn('Error watching recipient status:', err);
    });

    return () => unsubscribe();
  }, [selectedUser]);

  // Determine recipient status
  const getRecipientStatus = (user: User | null) => {
    if (!user) return undefined;
    if (user.isOnline) return 'Online';
    if (user.lastSeen) {
      let date: Date | null = null;
      const val = user.lastSeen;
      if (typeof val === 'string') date = new Date(val);
      else if (typeof val === 'number') date = new Date(val);
      else if (val.toDate && typeof val.toDate === 'function') date = val.toDate();
      else if (val.seconds) date = new Date(val.seconds * 1000);

      if (date && !isNaN(date.getTime())) {
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Last seen at ${timeStr}`;
      }
    }
    return 'Offline';
  };

  return (
    <div className="flex h-[calc(100vh-100px)] md:h-[calc(100vh-80px)] w-full bg-[#0a0f1c] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl relative">
      <div className={`w-full md:w-80 h-full ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatSidebar 
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={(roomId, user) => {
            setSelectedRoomId(roomId);
            setSelectedUser(user);
            setShowMobileChat(true);
          }}
        />
      </div>
      <div className={`flex-1 h-full ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatMessageArea 
          roomId={selectedRoomId}
          recipientName={liveRecipient?.name || selectedUser?.name || ''}
          recipientStatus={getRecipientStatus(liveRecipient || selectedUser)}
          onBack={() => setShowMobileChat(false)}
        />
      </div>
    </div>
  );
};
