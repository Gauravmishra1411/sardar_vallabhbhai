'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, UserCheck, ArrowRight, Sparkles, LayoutDashboard, KeyRound, UserPlus, Lock, CheckCircle } from 'lucide-react';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col relative overflow-hidden">
      {/* Background Animated Glowing Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-float-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none animate-float-glow" style={{ animationDelay: '2s' }} />

      {/* Top Header Navigation */}
      <header className="border-b border-white/10 backdrop-blur-md bg-[#0b0f19]/70 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-indigo-300 bg-clip-text text-transparent">
                SVP Portal
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">Dual-Panel System</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <Link
                href={currentUser.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to {currentUser.role === 'admin' ? 'Admin Panel' : 'User Panel'}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  User Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all"
                >
                  Register User
                </Link>
                <Link
                  href="/admin/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 rounded-xl transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Admin Login
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next.js Dual-Panel Architecture & Full Authentication</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6">
          Seamless Dual-Panel Management for <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">Users & Administrators</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          A full-featured web portal with separate User and Admin panels, real-time registration, role assignment, request tracking, and live audit logs.
        </p>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left mb-16">
          {/* User Panel Card */}
          <div className="glass-card p-8 rounded-2xl relative overflow-hidden group border border-indigo-500/20 hover:border-indigo-500/50">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>

            <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">User Panel</span>
            <h3 className="text-2xl font-bold text-white mt-1 mb-3">User Registration & Portal</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Register new user accounts, submit service requests, track approval status, and manage profile settings.
            </p>

            <ul className="space-y-2.5 mb-8 text-xs text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                User Registration with input validation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                User Login & Session persistence
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                Submit and monitor service request tickets
              </li>
            </ul>

            <div className="flex gap-3">
              <Link
                href="/register"
                className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Register User
              </Link>
              <Link
                href="/login"
                className="inline-flex justify-center items-center px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold border border-white/10 transition-all"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Admin Panel Card */}
          <div className="glass-card p-8 rounded-2xl relative overflow-hidden group border border-purple-500/20 hover:border-purple-500/50">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <KeyRound className="w-6 h-6" />
            </div>

            <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">Admin Panel</span>
            <h3 className="text-2xl font-bold text-white mt-1 mb-3">Admin Control Portal</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Full control dashboard to review user activity, manage roles (User/Admin), suspend/activate accounts, and process user requests.
            </p>

            <ul className="space-y-2.5 mb-8 text-xs text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
                Admin Secure Login portal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
                User Management (Promote role, Suspend account)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
                System Analytics, KPIs, and Audit Logs
              </li>
            </ul>

            <Link
              href="/admin/login"
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all"
            >
              <Lock className="w-4 h-4" />
              Access Admin Portal
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Quick Demo Login Helpers Banner */}
        <div className="w-full max-w-4xl glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
          <div>
            <h4 className="font-bold text-white text-base">Quick Demo Credentials</h4>
            <p className="text-xs text-gray-400">Pre-seeded accounts for immediate evaluation:</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-mono">
            <div className="bg-white/5 px-3.5 py-2 rounded-lg border border-white/10">
              <span className="text-indigo-400 font-bold">User:</span> user@example.com / user123
            </div>
            <div className="bg-purple-950/40 px-3.5 py-2 rounded-lg border border-purple-500/20">
              <span className="text-purple-400 font-bold">Admin:</span> admin@example.com / admin123
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-gray-500">
        Next.js Dual-Panel Architecture &copy; {new Date().getFullYear()} — Built for SVP Demo
      </footer>
    </div>
  );
}
