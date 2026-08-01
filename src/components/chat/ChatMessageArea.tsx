import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { Send, Smile, Paperclip, Loader2, Check, CheckCheck, Mic, ArrowLeft } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';

interface ChatMessageAreaProps {
  roomId: string | null;
  recipientName: string;
  recipientStatus?: string; // 'Online' | 'Offline' | 'Last seen...'
  onBack?: () => void;
}

export const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({ roomId, recipientName, recipientStatus, onBack }) => {
  const { currentUser } = useAuth();
  const { messages, loading, sending, sendMessage } = useChat(roomId);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    try {
      await sendMessage('text', text.trim());
      setText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendVoice = async (audioUrl: string, duration: string) => {
    try {
      await sendMessage('voice', audioUrl, duration);
      setIsRecording(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!roomId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0f1c] text-gray-500 p-4 text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-indigo-900/20 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-medium">Select a conversation to start messaging</p>
        <p className="text-xs text-gray-600 mt-2">End-to-end secure communication</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0f1c] h-full overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-gray-800 flex items-center px-4 md:px-6 bg-[#0f172a]/80 backdrop-blur-md shrink-0">
        {onBack && (
          <button 
            type="button"
            onClick={onBack}
            className="md:hidden mr-3 p-2 rounded-xl bg-gray-800/80 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-md shadow-indigo-500/20 shrink-0">
          {recipientName.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <h3 className="text-sm font-bold text-white truncate">{recipientName}</h3>
          <p className={`text-xs ${recipientStatus === 'Online' ? 'text-emerald-400' : 'text-gray-400'}`}>
            {recipientStatus || 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed" style={{ backgroundBlendMode: 'overlay', backgroundColor: 'rgba(10, 15, 28, 0.95)' }}>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-xs">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.id;
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Show date separator if day changed
            const msgDate = new Date(msg.timestamp).toLocaleDateString();
            const prevMsgDate = idx > 0 ? new Date(messages[idx-1].timestamp).toLocaleDateString() : null;
            const showDate = msgDate !== prevMsgDate;

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-800/80 text-gray-400 px-3 py-1 rounded-full border border-gray-700/50 shadow-sm">
                      {msgDate === new Date().toLocaleDateString() ? 'Today' : msgDate}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm relative group ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50'
                  }`}>
                    {msg.messageType === 'text' ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="flex flex-col gap-1 min-w-[200px]">
                        <div className="flex items-center gap-2 text-xs mb-1 opacity-80">
                          <span>🎤 Voice Message</span>
                          {msg.audioDuration && <span className="ml-auto font-mono">{msg.audioDuration}</span>}
                        </div>
                        <audio src={msg.audioUrl} controls className="h-8 w-full max-w-full outline-none" />
                      </div>
                    )}
                    
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                      <span className="text-[10px]">{time}</span>
                      {isMe && (
                        msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-blue-300" /> : <Check className="w-3.5 h-3.5 opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0f172a] border-t border-gray-800">
        {isRecording ? (
          <VoiceRecorder onSend={handleSendVoice} onCancel={() => setIsRecording(false)} />
        ) : (
          <form onSubmit={handleSendText} className="flex items-end gap-2">
            <button type="button" className="p-3 rounded-full text-gray-400 hover:text-indigo-400 hover:bg-gray-800 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <button type="button" className="p-3 rounded-full text-gray-400 hover:text-indigo-400 hover:bg-gray-800 transition-colors hidden sm:block">
              <Paperclip className="w-5 h-5" />
            </button>
            
            <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden focus-within:border-indigo-500 transition-colors">
              <textarea 
                rows={1}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  // Auto-resize logic
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; // Max height 8rem (32 in tailwind)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText(e);
                    // Reset height
                    e.currentTarget.style.height = 'auto';
                  }
                }}
                placeholder="Type a message..."
                className="w-full max-h-32 bg-transparent text-sm text-white px-4 py-3 focus:outline-none resize-none"
                style={{ minHeight: '44px' }}
              />
            </div>
            
            {text.trim() ? (
              <button 
                type="submit" 
                disabled={sending}
                className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setIsRecording(true)}
                className="p-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
