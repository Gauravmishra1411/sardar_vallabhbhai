'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1E293B 0%, #273549 100%)'
          : 'linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%)',
        border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
        color: isDark ? '#C084FC' : '#7C3AED',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer z-50 shrink-0 active:scale-95 shadow-sm hover:shadow-md"
    >
      {isDark ? (
        <>
          <Sun
            className="w-4 h-4"
            style={{ color: '#FBBF24', animation: 'spinSlow 3s linear infinite' }}
          />
          <span
            className="text-xs font-semibold hidden sm:inline"
            style={{ color: '#E2E8F0' }}
          >
            Light Mode
          </span>
        </>
      ) : (
        <>
          <Moon
            className="w-4 h-4"
            style={{ color: '#7C3AED', animation: 'pulseZoom 2.5s ease-in-out infinite' }}
          />
          <span
            className="text-xs font-semibold hidden sm:inline"
            style={{ color: '#374151' }}
          >
            Dark Mode
          </span>
        </>
      )}
    </button>
  );
};
