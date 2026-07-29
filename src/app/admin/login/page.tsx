'use client';

import React, { Suspense } from 'react';
import { UnifiedAuthPage } from '@/app/auth/page';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3e8ff] flex items-center justify-center">Loading admin portal...</div>}>
      <UnifiedAuthPage defaultRole="admin" />
    </Suspense>
  );
}
