'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { ISSUE_CATEGORIES, CategoryName, IssuePriority } from '@/types/auth';
import { SVPUAT_HOSTELS } from '@/constants/hostels';
import { LayoutDashboard, Users, FileCheck, ShieldCheck, LogOut, Lock, Sparkles, UserCheck, Building2, PlusCircle, X, Camera, User, AlertTriangle, BarChart3, Bell, Menu } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { useFCM } from '@/hooks/useFCM';
// Firebase Storage replaced by Cloudinary

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, isLoading, createIssue, showToast } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Initialize FCM Web Push for this admin
  useFCM({
    userId: currentUser?.id || null,
    userRole: currentUser?.role || null,
    onForegroundNotif: (title, body) => showToast(`🔔 ${title}: ${body}`, 'info'),
  });

  // Add Issue Modal State
  const [isAddIssueOpen, setIsAddIssueOpen] = useState(false);
  const [category, setCategory] = useState<CategoryName>('Electricity');
  const [subCategory, setSubCategory] = useState<string>('Fan Not Working');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [hostelName, setHostelName] = useState(SVPUAT_HOSTELS[0]);
  const [roomNumber, setRoomNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sidebar active nav
  const [activeNavId, setActiveNavId] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_nav_active');
    if (saved) setActiveNavId(saved);
  }, []);

  const handleNavClick = (id: string) => {
    setActiveNavId(id);
    if (typeof window !== 'undefined') sessionStorage.setItem('admin_nav_active', id);
    setIsMobileMenuOpen(false); // Close menu on mobile after click
  };

  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const base64ToBlob = (base64: string, mimeType = 'image/jpeg'): Blob => {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    setPhotoUploading(true);
    setUploadProgress(15);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setPhotoUploading(false);
        return;
      }

      // Compress client-side
      const compressedDataUrl = await compressImage(rawDataUrl);
      setPhotoUrl(compressedDataUrl);

      let isCompleted = false;
      const finishUpload = (finalUrl?: string) => {
        if (isCompleted) return;
        isCompleted = true;
        if (finalUrl) {
          setPhotoUrl(finalUrl);
        }
        setPhotoUploading(false);
        setUploadProgress(0);
      };

      const timeoutId = setTimeout(() => {
        finishUpload();
      }, 8000);

      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddthlutz4';
        const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'univercity';

        // Convert base64 to Blob — Cloudinary requires a real binary file
        const base64Data = compressedDataUrl.split(',')[1];
        const mimeType = compressedDataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
        const byteChars = atob(base64Data);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        const imageBlob = new Blob([new Uint8Array(byteNums)], { type: mimeType });

        const uploaderData = new FormData();
        uploaderData.append('file', imageBlob, `issue-${Date.now()}.jpg`);
        uploaderData.append('upload_preset', preset);

        setUploadProgress(40);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: uploaderData,
        });

        clearTimeout(timeoutId);
        setUploadProgress(80);

        if (response.ok) {
          const resJson = await response.json();
          finishUpload(resJson.secure_url);
        } else {
          const errText = await response.text();
          console.warn('Cloudinary upload failed:', response.status, errText);
          finishUpload(compressedDataUrl);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn('Cloudinary upload init error:', error);
        finishUpload(compressedDataUrl);
      }
    };

    reader.onerror = () => {
      alert('Failed to read image file.');
      setPhotoUploading(false);
      setUploadProgress(0);
    };

    reader.readAsDataURL(file);
  };

  const selectedCatObj = ISSUE_CATEGORIES.find((c) => c.name === category);

  const handleCategoryChange = (newCat: CategoryName) => {
    setCategory(newCat);
    const cat = ISSUE_CATEGORIES.find((c) => c.name === newCat);
    if (cat && cat.subcategories.length > 0) {
      setSubCategory(cat.subcategories[0]);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const res = createIssue({
      category,
      subCategory,
      description,
      priority,
      hostelName,
      roomNumber,
      mobileNumber,
      photoUrl: photoUrl.trim() || undefined,
    });

    if (res.success) {
      setIsAddIssueOpen(false);
      setDescription('');
      setPhotoUrl('');
      setRoomNumber('');
      setMobileNumber('');
    }
  };

  useEffect(() => {
    if (!isLoading && pathname !== '/admin/login') {
      if (!currentUser) {
        router.push('/admin/login');
      } else if (currentUser.role !== 'admin') {
        router.push('/auth');
      }
    }
  }, [currentUser, isLoading, router, pathname]);

  // Bypass layout entirely for the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading || !currentUser || currentUser.role !== 'admin') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-main)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-description)' }}>Verifying Administrator Privileges...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard',        label: 'Dashboard',            href: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'users',            label: 'User Management',      href: '/admin/users',     icon: Users },
    { id: 'wardens',          label: 'Warden Management',    href: '/admin/warden-registration', icon: ShieldCheck },
    { id: 'issues',           label: 'Issue Management',     href: '/admin/dashboard', icon: AlertTriangle },
    { id: 'complaints',       label: 'Complaint Management', href: '/admin/requests',  icon: FileCheck },
    { id: 'reports',          label: 'Reports & Analytics',  href: '/admin/dashboard', icon: BarChart3 },
    { id: 'notifications',    label: 'Notifications',        href: '/admin/dashboard', icon: Bell },
    { id: 'admin-mgmt',       label: 'Admin Management',     href: '/admin/users',     icon: User },
    { id: 'roles',            label: 'Roles & Permissions',  href: '/admin/users',     icon: Lock },
    { id: 'profile',          label: 'Edit Profile',         href: '/admin/profile',   icon: User },
  ];

  const sidebarBg     = isDark ? '#0a0f1c' : '#FFFFFF';
  const sidebarBorder = isDark ? 'rgba(168,85,247,0.2)' : '#E5E7EB';
  const navText       = isDark ? '#9CA3AF' : '#6B7280';
  const navHoverBg    = isDark ? 'rgba(255,255,255,0.08)' : '#EEF2FF';
  const navHoverText  = isDark ? '#FFFFFF' : '#111827';

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row relative"
      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-normal)' }}
    >

      {/* Mobile Header */}
      <div
        className="md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-40"
        style={{ backgroundColor: sidebarBg, borderColor: sidebarBorder }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo_neww.png" alt="SVPUAT Logo" className="w-10 h-10 object-contain" />
          <h1 className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>Admin Control</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button type="button" onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg"
            style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary)' }}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 z-50 w-72 md:w-64 flex flex-col shrink-0 overflow-y-auto max-h-screen transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'left-0' : '-left-full'
        } md:relative md:left-0`}
        style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
      >
        {/* Brand */}
        <div
          className="p-5 flex flex-col gap-3 relative"
          style={{ borderBottom: `1px solid ${sidebarBorder}` }}
        >
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-3 right-3 p-1.5 rounded-lg md:hidden"
            style={{ color: 'var(--text-description)' }}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <img src="/logo_neww.png" alt="SVPUAT Logo" className="w-28 h-auto object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-base" style={{ color: 'var(--text-heading)' }}>Admin Control</h1>
            <span className="text-[10px] text-emerald-500 uppercase font-semibold tracking-widest">Restricted Portal</span>
          </div>
          {/* Theme Toggle in sidebar */}
          <div className="mt-1">
            <ThemeToggle />
          </div>
        </div>

        {/* Admin Card */}
        <div
          className="p-4 mx-4 my-4 rounded-xl flex items-center gap-3"
          style={{
            backgroundColor: isDark ? 'rgba(139,92,246,0.12)' : '#F3E8FF',
            border: `1px solid ${isDark ? 'rgba(139,92,246,0.25)' : '#DDD6FE'}`,
          }}
        >
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              (currentUser.name ?? '?').charAt(0).toUpperCase()
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>{currentUser.name}</h2>
            <span
              className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded"
              style={{
                backgroundColor: isDark ? 'rgba(139,92,246,0.3)' : '#EDE9FE',
                color: isDark ? '#C084FC' : '#7C3AED',
              }}
            >
              Super Admin
            </span>
          </div>
        </div>

        {/* Add Issue Button */}
        <div className="px-4">
          <button
            onClick={() => setIsAddIssueOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add Issue
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 py-2 mt-2">
          <div className="text-[10px] font-bold uppercase tracking-wider px-3 mb-2" style={{ color: 'var(--primary)' }}>Admin Management</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavId === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#ffffff' : navText,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = navHoverBg;
                    (e.currentTarget as HTMLElement).style.color = navHoverText;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = navText;
                  }
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? '#ffffff' : 'var(--primary)' }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Quick Switch & Logout */}
        <div className="p-4" style={{ borderTop: `1px solid ${sidebarBorder}` }}>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
              border: '1px solid rgba(239,68,68,0.3)',
              color: isDark ? '#F87171' : '#DC2626',
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out Admin
          </button>
        </div>
      </aside>

      {/* Viewport */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header
          className="h-16 border-b px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30"
          style={{
            backgroundColor: isDark ? 'rgba(10,15,28,0.85)' : 'rgba(255,255,255,0.95)',
            borderColor: sidebarBorder,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-base md:text-lg font-bold" style={{ color: 'var(--text-heading)' }}> </span>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-description)' }}>
              <span className="font-semibold" style={{ color: 'var(--primary)' }}>Admin Panel</span>
              <span>/</span>
              <span className="capitalize font-semibold" style={{ color: 'var(--text-heading)' }}>
                {pathname.split('/').pop() || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#EDE9FE',
                border: `1px solid ${isDark ? 'rgba(139,92,246,0.35)' : '#DDD6FE'}`,
                color: isDark ? '#C084FC' : '#7C3AED',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrative Mode
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto max-w-full">{children}</main>
      </div>

      {/* ========== ADD ISSUE MODAL ========== */}
      {isAddIssueOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add New Issue</h3>
                  <p className="text-[11px] text-gray-400">Create a hostel grievance on behalf of a student</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddIssueOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">1. Issue Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {ISSUE_CATEGORIES.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleCategoryChange(c.name)}
                      className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                        category === c.name
                          ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300 shadow-md'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{c.icon}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">2. Sub-Category</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 px-3 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {selectedCatObj?.subcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">3. Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IssuePriority)}
                    className="w-full bg-gray-900 border border-gray-700 px-3 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                  </select>
                </div>
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">Hostel Name</label>
                  <select
                    required
                    value={hostelName}
                    onChange={(e) => setHostelName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SVPUAT_HOSTELS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">Room No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-204"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">Mobile</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765..."
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the problem clearly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                  Attachment / Photo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-950/40 hover:bg-emerald-900/40 disabled:opacity-50 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    {photoUploading ? `Uploading... ${uploadProgress}%` : photoUrl ? 'Change Photo' : 'Upload Image'}
                  </button>
                  {photoUrl && (
                    <div className="relative w-10 h-10 rounded-xl bg-gray-900 border border-emerald-500/30 overflow-hidden shrink-0">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddIssueOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Submit Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
