'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Building2, ShieldCheck, LogOut, LayoutDashboard, ArrowRight, User, Menu, X } from 'lucide-react';
import { useFCM } from '@/hooks/useFCM';

export default function WardenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, isLoading, showToast } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen bg-[#070a12] text-white p-4 md:p-8">
        {children}
      </div>
    );
  }

  if (isLoading || !currentUser || (currentUser.role !== 'warden' && currentUser.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Verifying Warden Privileges...</p>
        </div>
      </div>
    );
  }

  const wardenHostel = currentUser.hostelName || 'Raman Hostel';

  return (
    <div className="min-h-screen bg-[#070a12] text-white flex flex-col md:flex-row relative">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#070a12] border-b border-purple-500/20 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/logo_neww.png" alt="SVPUAT Logo" className="w-10 h-10 object-contain" />
          <h1 className="font-bold text-sm text-white">Warden Portal</h1>
        </div>
        <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-purple-900/40 rounded-lg text-purple-300">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Warden Sidebar */}
      <aside className={`fixed inset-y-0 z-50 w-72 md:w-64 glass-panel border-r border-purple-500/20 flex flex-col shrink-0 transition-all duration-300 ease-in-out bg-[#0a0f1c] ${isMobileMenuOpen ? 'left-0' : '-left-full'} md:relative md:left-0`}>
        <div className="p-6 border-b border-purple-500/20 flex flex-col gap-4 relative">
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <img src="/logo_neww.png" alt="SVPUAT Logo" className="w-32 h-auto object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Warden Portal</h1>
            <span className="text-[10px] text-emerald-400 uppercase font-semibold tracking-widest">{wardenHostel}</span>
          </div>
        </div>

        {/* Warden Profile Card */}
        <div className="p-4 mx-4 my-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              (currentUser.name ?? '?').charAt(0)
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-semibold text-white truncate">{currentUser.name}</h2>
            <span className="inline-block text-[9px] uppercase font-bold text-purple-300 bg-purple-900/80 px-2 py-0.5 rounded border border-purple-500/30">
              Hostel Warden
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-3 mb-2">Hostel Management</div>
          <Link
            href="/warden/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
              pathname === '/warden/dashboard'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Hostel Grievances &amp; Approvals
          </Link>

          <Link
            href="/warden/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
              pathname === '/warden/profile'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4 text-purple-400" />
            Edit Profile
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-purple-500/20">
          {currentUser.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center justify-between mb-2 transition-all"
            >
              <span>Back to Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={logout}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
