'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      className="p-2 sm:px-3 py-1.5 rounded-full bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 text-amber-400 backdrop-blur-md transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer z-50 shrink-0"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="text-xs font-bold text-amber-300 hidden sm:inline">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-700 hidden sm:inline">Dark Mode</span>
        </>
      )}
    </button>
  );
};
