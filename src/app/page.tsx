'use client';

import React, { Suspense } from 'react';
import { UniversityHeader } from '@/components/UniversityHeader';
import UnifiedAuthPage from '@/app/auth/page';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col relative" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-normal)' }}>
      {/* Official SVPUAT University Header Banner */}
      <UniversityHeader />

      {/* Direct 1-Click 3D Auth Portal */}
      <main className="flex-1 flex flex-col justify-center items-center relative">
        <Suspense fallback={<div className="p-12 text-center font-bold" style={{ color: 'var(--primary)' }}>Loading Auth Portal...</div>}>
          <UnifiedAuthPage />
        </Suspense>
      </main>
    </div>
  );
}
