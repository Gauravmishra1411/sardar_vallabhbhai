'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, clearToast } = useAuth();

  if (!toastMessage) return null;

  const bgStyles = {
    success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-900/20',
    error: 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-900/20',
    info: 'bg-blue-950/90 border-blue-500/50 text-blue-200 shadow-blue-900/20',
  }[toastMessage.type];

  const IconComponent = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[toastMessage.type];

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-md">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl ${bgStyles}`}>
        <IconComponent className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium pr-2">{toastMessage.text}</p>
        <button
          onClick={clearToast}
          className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0 text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
