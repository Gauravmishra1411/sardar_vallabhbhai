'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Wrench, LogOut, LayoutDashboard, User, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        router.push('/auth');
      } else if (currentUser.role !== 'staff') {
        router.push('/auth');
      }
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser || currentUser.role !== 'staff') {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Verifying Staff Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-white flex flex-col md:flex-row relative">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#070a12] border-b border-purple-500/20 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/logo_neww.png" alt="SVPUAT Logo" className="w-10 h-10 object-contain" />
          <h1 className="font-bold text-sm text-white">Staff Portal</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-emerald-900/40 rounded-lg text-emerald-300">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Staff Sidebar */}
      <aside className={`fixed inset-y-0 z-50 w-72 md:w-64 glass-panel border-r border-purple-500/20 flex flex-col shrink-0 overflow-y-auto max-h-screen transition-all duration-300 ease-in-out bg-[#0a0f1c] ${isMobileMenuOpen ? 'left-0' : '-left-full'} md:relative md:left-0`}>
        <div className="p-6 border-b border-purple-500/20 flex flex-col gap-4 relative">
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <img src="/logo_neww.png" alt="SVPUAT Logo" className="w-32 h-auto object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Staff Portal</h1>
            <span className="text-[10px] text-emerald-400 uppercase font-semibold tracking-widest">Maintenance Staff</span>
          </div>
        </div>

        {/* Staff Profile Card */}
        <div className="p-4 mx-4 my-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              (currentUser.name ?? '?').charAt(0)
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-semibold text-white truncate">{currentUser.name}</h2>
            <span className="inline-block text-[9px] uppercase font-bold text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-500/30">
              {currentUser.department || 'Maintenance Staff'}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-3 mb-2">Staff Menu</div>
          <Link
            href="/staff/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
              pathname === '/staff/dashboard'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            My Assigned Complaints
          </Link>
          <Link
            href="/staff/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
              pathname === '/staff/profile'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            My Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-purple-500/20">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto max-w-full">{children}</main>
    </div>
  );
}
