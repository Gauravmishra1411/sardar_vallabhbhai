'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export const UniversityHeader: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header
      className="w-full sticky top-0 z-50 shadow-sm"
      style={{
        backgroundColor: '#1b802a',
        borderBottom: isDark ? '2px solid #14532d' : '2px solid #15803d',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* University logo + name */}
        <div className="flex items-center gap-3">
          <div className="h-10 sm:h-12 md:h-14 w-auto flex items-center justify-center shrink-0">
            <img
              src="https://www.svpuat.edu.in/images/logo_neww.png"
              alt="Sardar Vallabhbhai Patel University of Agriculture & Technology Logo"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-tight">
              सरदार वल्लभभाई पटेल कृषि एवं प्रौद्योगिक विश्वविद्यालय, मेरठ
            </p>
            <p className="text-green-200 text-xs font-medium">
              Sardar Vallabhbhai Patel University of Agriculture &amp; Technology, Meerut
            </p>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
