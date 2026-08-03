'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Building2, LogOut, ArrowRight, User, Menu, X, Sun, Moon } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { useFCM } from '@/hooks/useFCM';

export default function WardenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, isLoading, showToast } = useAuth();
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDark = theme === 'dark';

  // Initialize FCM Web Push for this warden
  useFCM({
    userId: currentUser?.id || null,
    userRole: currentUser?.role || null,
    onForegroundNotif: (title, body) => showToast?.(`🔔 ${title}: ${body}`, 'info'),
  });

  const isRegisterRoute = pathname === '/warden/register';

  useEffect(() => {
    if (!isLoading && !isRegisterRoute) {
      if (!currentUser) {
        router.push('/auth');
      } else if (currentUser.role !== 'warden' && currentUser.role !== 'admin') {
        router.push('/auth');
      }
    }
  }, [currentUser, isLoading, router, isRegisterRoute]);

  if (isRegisterRoute) {
    return (
      <div
        className="min-h-screen p-4 md:p-8"
        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-normal)' }}
      >
        {children}
      </div>
    );
  }

  if (isLoading || !currentUser || (currentUser.role !== 'warden' && currentUser.role !== 'admin')) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-main)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-description)' }}>
            Verifying Warden Privileges...
          </p>
        </div>
      </div>
    );
  }

  const wardenHostel = currentUser.hostelName || 'Raman Hostel';

  const sidebarBg    = isDark ? '#0a0f1c' : '#FFFFFF';
  const sidebarBorder= isDark ? 'rgba(168,85,247,0.2)' : '#E5E7EB';
  const mobileBg     = isDark ? '#0a0f1c' : '#FFFFFF';
  const navInactive  = isDark ? 'rgba(255,255,255,0.05)' : 'transparent';
  const navText      = isDark ? '#9CA3AF' : '#6B7280';
  const navHoverBg   = isDark ? 'rgba(255,255,255,0.08)' : '#EEF2FF';
  const navHoverText = isDark ? '#FFFFFF' : '#111827';

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row relative"
      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-normal)' }}
    >
      {/* ── Mobile Header ── */}
      <div
        className="md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-40"
        style={{ backgroundColor: mobileBg, borderColor: sidebarBorder }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo_neww.png" alt="SVPUAT Logo" className="w-10 h-10 object-contain" />
          <h1 className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>
            Warden Portal
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg"
            style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary)' }}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ── Mobile Backdrop ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 z-50 w-72 md:w-64 flex flex-col shrink-0 overflow-y-auto max-h-screen transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'left-0' : '-left-full'
        } md:relative md:left-0`}
        style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
      >
        {/* Brand */}
        <div
          className="p-5 flex flex-col gap-3 relative"
          style={{ borderBottom: `1px solid ${sidebarBorder}` }}
        >
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-3 right-3 p-1.5 rounded-lg md:hidden"
            style={{ color: 'var(--text-description)' }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo_neww.png" alt="SVPUAT Logo" className="w-28 h-auto object-contain" />
          </div>

          {/* Title */}
          <div>
            <h1 className="font-bold text-base" style={{ color: 'var(--text-heading)' }}>
              Warden Portal
            </h1>
            <span className="text-[10px] uppercase font-semibold tracking-widest text-emerald-500">
              {wardenHostel}
            </span>
          </div>

          {/* ── Theme Toggle (Desktop) ── */}
          <div className="mt-1">
            <ThemeToggle />
          </div>
        </div>

        {/* Profile Card */}
        <div
          className="mx-4 my-4 p-3 rounded-xl flex items-center gap-3"
          style={{
            backgroundColor: isDark ? 'rgba(139,92,246,0.12)' : '#F3E8FF',
            border: `1px solid ${isDark ? 'rgba(139,92,246,0.25)' : '#DDD6FE'}`,
          }}
        >
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              (currentUser.name ?? '?').charAt(0).toUpperCase()
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>
              {currentUser.name}
            </h2>
            <span
              className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded"
              style={{
                backgroundColor: isDark ? 'rgba(139,92,246,0.3)' : '#EDE9FE',
                color: isDark ? '#C084FC' : '#7C3AED',
              }}
            >
              Hostel Warden
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-1 py-2">
          <div
            className="text-[10px] font-bold uppercase tracking-wider px-3 mb-2"
            style={{ color: 'var(--primary)' }}
          >
            Hostel Management
          </div>

          {[
            { href: '/warden/dashboard', label: 'Hostel Grievances & Approvals', icon: Building2 },
            { href: '/warden/profile',   label: 'Edit Profile',                   icon: User },
          ].map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all"
                style={{
                  backgroundColor: isActive
                    ? 'var(--primary)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : navText,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = navHoverBg;
                    (e.currentTarget as HTMLElement).style.color = navHoverText;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = navText;
                  }
                }}
              >
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: isActive ? '#ffffff' : 'var(--primary)' }}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Buttons */}
        <div className="p-4" style={{ borderTop: `1px solid ${sidebarBorder}` }}>
          {currentUser.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between mb-2 transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#FFF7ED',
                border: '1px solid rgba(245,158,11,0.35)',
                color: isDark ? '#FBBF24' : '#B45309',
              }}
            >
              <span>Back to Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={logout}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
              border: '1px solid rgba(239,68,68,0.3)',
              color: isDark ? '#F87171' : '#DC2626',
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main
        className="flex-1 overflow-y-auto max-w-full"
        style={{ backgroundColor: 'var(--bg-main)' }}
      >
        {children}
      </main>
    </div>
  );
}
