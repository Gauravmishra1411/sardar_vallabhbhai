import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types/auth';
import { Search } from 'lucide-react';
import { ChatRoom } from '@/hooks/useChat';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string, recipient: User) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ rooms, selectedRoomId, onSelectRoom }) => {
  const { currentUser, users } = useAuth();
  const [search, setSearch] = React.useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Helper for deterministic room ID between any 2 users
  const getRoomId = (id1: string, id2: string) => [id1, id2].sort().join('_');

  // For Admin: List all active wardens
  // For Warden: List only admins
  const contacts = users.filter((u) => {
    if (u.id === currentUser.id) return false;
    if (isAdmin) {
      return u.role === 'warden' && (u.status === 'active' || u.approved === true);
    } else {
      return u.role === 'admin';
    }
  });

  const filteredContacts = contacts
    .filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const roomA = rooms.find(r => r.id === getRoomId(currentUser.id, a.id));
      const roomB = rooms.find(r => r.id === getRoomId(currentUser.id, b.id));
      
      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return new Date(val).getTime();
        if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
        if (val.seconds) return val.seconds * 1000;
        return 0;
      };
      
      const timeA = roomA ? getTime(roomA.lastMessageTime) : 0;
      const timeB = roomB ? getTime(roomB.lastMessageTime) : 0;
      return timeB - timeA;
    });

  return (
    <div className="w-full md:w-80 border-r border-gray-800 bg-[#0f172a] flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-800 bg-[#0f172a]">
        <h2 className="text-lg font-bold text-white mb-4">Messages</h2>
        {isAdmin && (
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search wardens..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-xs">
            No contacts found.
          </div>
        ) : (
          filteredContacts.map(contact => {
            const roomId = getRoomId(currentUser.id, contact.id);
            const roomData = rooms.find(r => r.id === roomId);
            const isSelected = selectedRoomId === roomId;
            
            // Extract unread count
            const unreadCount = roomData 
              ? (isAdmin ? (roomData.unreadCount_admin || 0) : (roomData.unreadCount_warden || 0)) 
              : 0;

            const lastMessage = roomData?.lastMessage || 'Start a conversation';
            let lastTime = '';
            if (roomData?.lastMessageTime) {
              const val: any = roomData.lastMessageTime;
              let date: Date | null = null;
              if (typeof val === 'number') date = new Date(val);
              else if (typeof val === 'string') date = new Date(val);
              else if (val.toDate && typeof val.toDate === 'function') date = val.toDate();
              else if (val.seconds) date = new Date(val.seconds * 1000);
              
              if (date && !isNaN(date.getTime())) {
                lastTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            }

            return (
              <button 
                key={contact.id}
                onClick={() => onSelectRoom(roomId, contact)}
                className={`w-full text-left p-4 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors flex items-start gap-3 ${isSelected ? 'bg-gray-800/80 border-l-2 border-l-indigo-500' : ''}`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                    {contact.name.charAt(0)}
                  </div>
                  {contact.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f172a]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-bold text-white truncate">{contact.name}</h4>
                    {lastTime && <span className="text-[10px] text-gray-500 shrink-0 ml-2">{lastTime}</span>}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate ${unreadCount > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                      {lastMessage}
                    </p>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 ml-2">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
