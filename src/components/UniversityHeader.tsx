'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export const UniversityHeader: React.FC = () => {
  return (
    <header className="w-full bg-[#1b802a] text-white shadow-md border-b-2 border-green-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Official SVPUAT University Logo */}
        <div className="h-10 sm:h-14 md:h-16 w-auto flex items-center justify-center shrink-0">
          <img
            src="https://www.svpuat.edu.in/images/logo_neww.png"
            alt="Sardar Vallabhbhai Patel University of Agriculture & Technology Logo"
            className="h-10 sm:h-14 md:h-16 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Top Right Light / Dark Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
