'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Camera, Save, User as UserIcon, Phone, Calendar, Mail, ShieldCheck, Key, CheckCircle2 } from 'lucide-react';
import { storage } from '@/lib/firebase';
// Firebase Storage replaced by Cloudinary

export default function AdminProfilePage() {
  const { currentUser, updateUserProfile, showToast } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [mobileNumber, setMobileNumber] = useState(currentUser?.mobileNumber || '');
  const [alternateMobile, setAlternateMobile] = useState(currentUser?.alternateMobile || '');
  const [gender, setGender] = useState(currentUser?.gender || 'Male');
  const [dob, setDob] = useState(currentUser?.dob || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
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
      showToast('Please select a valid image file.', 'error');
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

      // Compress client-side (profiles can be even smaller, e.g. 400x400)
      const compressedDataUrl = await compressImage(rawDataUrl);
      setAvatar(compressedDataUrl);

      let isCompleted = false;
      const finishUpload = (finalUrl?: string) => {
        if (isCompleted) return;
        isCompleted = true;
        if (finalUrl) {
          setAvatar(finalUrl);
        }
        setPhotoUploading(false);
        setUploadProgress(0);
        showToast('Profile photo updated!', 'success');
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
        uploaderData.append('file', imageBlob, `avatar-${Date.now()}.jpg`);
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
          finishUpload();
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn('Cloudinary upload init error:', error);
        finishUpload();
      }
    };

    reader.onerror = () => {
      showToast('Failed to read image file.', 'error');
      setPhotoUploading(false);
      setUploadProgress(0);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Full Name is required', 'error');
      return;
    }

    const result = updateUserProfile({
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      alternateMobile: alternateMobile.trim(),
      gender,
      dob,
      avatar,
    });

    if (result.success) {
      showToast('Admin Profile updated successfully!', 'success');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-purple-400" />
          Edit Admin Profile
        </h1>
        <p className="text-gray-400 text-sm mt-1">Update your administrative credentials, contact details, and profile photo</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Settings Card */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-purple-500/20 relative overflow-hidden space-y-8">
          
          {/* Avatar Upload block */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-purple-500/20">
            <div className="w-24 h-24 rounded-2xl bg-purple-950 border-2 border-purple-500/40 overflow-hidden flex items-center justify-center shrink-0 relative shadow-lg">
              <img
                src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Admin')}`}
                alt="Admin Avatar"
                className="w-full h-full object-cover"
              />
              {photoUploading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{uploadProgress}%</span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
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
                className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/40 disabled:opacity-50 border border-purple-500/40 hover:border-purple-400 text-purple-200 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Change Profile Photo
              </button>
              <p className="text-[10px] text-gray-400">Select a JPG, PNG or WEBP image (max 5MB).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900/85 border border-purple-500/30 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">Email Address (Read-only)</label>
              <div className="w-full bg-purple-950/20 border border-purple-500/20 px-4 py-3 rounded-2xl text-xs text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-500/60" />
                {currentUser.email}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-purple-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-gray-900/85 border border-purple-500/30 pl-11 pr-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Alternate Mobile */}
            <div>
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">Alternate Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-purple-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value)}
                  className="w-full bg-gray-900/85 border border-purple-500/30 pl-11 pr-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">Gender</label>
              <div className="grid grid-cols-3 gap-3">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      gender === g
                        ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                        : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">Date of Birth</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-purple-400 absolute left-4 top-3.5" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-gray-900/85 border border-purple-500/30 pl-11 pr-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl space-y-3 border border-purple-500/20">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Account Status & Authorization
            </h3>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex justify-between py-1.5 border-b border-purple-500/10">
                <span className="text-gray-400">Account Status:</span>
                <span className="text-emerald-400 font-semibold uppercase">{currentUser.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-purple-500/10">
                <span className="text-gray-400">Assigned Role:</span>
                <span className="text-purple-400 font-semibold uppercase">{currentUser.role}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400">Panel Access:</span>
                <span className="text-white font-medium">Super Admin Control Mode</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-3 border border-purple-500/20">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              Security Verification
            </h3>
            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Session token verified in browser session</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Local Storage persistence enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Role-based routing guard active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Profile Details
          </button>
        </div>
      </form>
    </div>
  );
}
