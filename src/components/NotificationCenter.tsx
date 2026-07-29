'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppNotification, NotificationEvent } from '@/types/auth';
import { Bell, ChevronRight, CheckCheck, X } from 'lucide-react';

// ─── Resolve notification URL ─────────────────────────────────────────────────

function resolveNotifUrl(n: AppNotification, userRole?: string): string {
  if (n.issueId) {
    if (userRole === 'admin') return `/admin/dashboard?issueId=${n.issueId}`;
    if (userRole === 'warden') return `/warden/dashboard?issueId=${n.issueId}`;
    if (userRole === 'staff') return `/staff/dashboard`;
  }
  if (userRole === 'admin') return '/admin/dashboard';
  if (userRole === 'warden') return '/warden/dashboard';
  if (userRole === 'staff') return '/staff/dashboard';
  return '/';
}

// ─── Icon based on event type ─────────────────────────────────────────────────

function NotifIcon({ event, title }: { event?: NotificationEvent; title: string }) {
  const t = title.toLowerCase();

  if (event === 'new_complaint' || t.includes('new grievance') || t.includes('submitted'))
    return <span className="text-base">🆕</span>;
  if (event === 'staff_assigned' || t.includes('assigned'))
    return <span className="text-base">📋</span>;
  if (event === 'work_started' || t.includes('started') || t.includes('progress'))
    return <span className="text-base">🔧</span>;
  if (event === 'complaint_resolved' || t.includes('resolved'))
    return <span className="text-base">✅</span>;
  if (event === 'complaint_closed' || t.includes('closed'))
    return <span className="text-base">🔒</span>;
  if (event === 'complaint_reopened' || t.includes('reopen'))
    return <span className="text-base">🔄</span>;
  if (t.includes('alert') || t.includes('urgent'))
    return <span className="text-base">🚨</span>;
  return <span className="text-base">🔔</span>;
}

// ─── Time ago ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const NotificationCenter: React.FC = () => {
  const router = useRouter();
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  // Show notifications for this specific user OR for their role (broadcast)
  const userNotifs = notifications
    .filter((n) => n.userId === currentUser.id || n.role === currentUser.role)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifs.filter((n) => !n.read).length;

  const handleNotifClick = (n: AppNotification) => {
    markNotificationRead(n.id);
    setIsOpen(false);
    router.push(resolveNotifUrl(n, currentUser.role));
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllNotificationsRead();
  };

  return (
    <div className="relative z-50">
      {/* ─── Bell Button ──────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/10 flex items-center justify-center"
        title="Notifications"
        id="notification-bell"
      >
        <Bell className="w-5 h-5 text-indigo-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0b0f19] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* ─── Panel ────────────────────────────────────────────────── */}
          <div
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0f172a] border border-indigo-500/30 shadow-2xl shadow-indigo-950/80 z-50 overflow-hidden"
            style={{ animation: 'fadeSlideDown 0.18s ease' }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-indigo-300 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-800/60" style={{ scrollbarWidth: 'thin' }}>
              {userNotifs.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-xs font-medium">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No notifications yet.
                </div>
              ) : (
                userNotifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all group hover:bg-indigo-950/30 ${
                      !n.read ? 'bg-indigo-950/20' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5 relative">
                      <NotifIcon event={n.event} title={n.title} />
                      {!n.read && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-bold truncate ${n.read ? 'text-gray-400' : 'text-indigo-300'}`}>
                          {n.title}
                        </span>
                        <span className="text-[9px] text-gray-600 shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-300 leading-relaxed line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {n.issueId && (
                          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                            #{n.issueId}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-600">
                          {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        {!n.read && (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-950/40 border border-rose-500/20 px-1.5 py-0.5 rounded">
                            UNREAD
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 shrink-0 mt-1 transition-colors" />
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {userNotifs.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-600">{userNotifs.length} total notifications</span>
                <button
                  onClick={() => { setIsOpen(false); router.push(resolveNotifUrl({ id: '', userId: '', title: '', message: '', read: false, createdAt: '' }, currentUser.role)); }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  View Dashboard →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
