'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, ArrowLeft, AlertCircle, Sparkles, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = loginAdmin(email.trim(), password);

    if (result.success) {
      router.push('/admin/dashboard');
    } else {
      setErrorMsg(result.error || 'Admin login failed');
      setIsSubmitting(false);
    }
  };

  const autofillDemoAdmin = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-white flex flex-col justify-center items-center p-6 relative">
      {/* High-tech purple glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[550px] h-[550px] bg-purple-600/20 rounded-full blur-[160px] pointer-events-none" />

      {/* Back Link */}
      <Link
        href="/"
        className="absolute top-8 left-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <KeyRound className="w-7 h-7" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-[10px] uppercase font-bold tracking-widest mb-2">
            Restricted Admin Area
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Admin Control Portal</h2>
          <p className="text-gray-400 text-sm mt-2">Sign in with administrator credentials</p>
        </div>

        {/* Card Form */}
        <div className="glass-panel p-8 rounded-2xl border border-purple-500/20 shadow-2xl relative z-10">
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Fill Button */}
          <button
            type="button"
            onClick={autofillDemoAdmin}
            className="w-full mb-6 py-2.5 px-4 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Autofill Demo Admin (admin@example.com)
          </button>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-purple-200 mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm focus:border-purple-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-purple-200 mb-2">Admin Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm focus:border-purple-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Authenticate Admin
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-gray-400">
            Looking for regular user login?{' '}
            <Link href="/login" className="text-indigo-400 font-semibold hover:underline">
              User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
