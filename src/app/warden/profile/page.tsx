'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Camera, Save, User as UserIcon, Phone, Mail, Lock } from 'lucide-react';

export default function WardenProfilePage() {
  const { currentUser, updateUserProfile, showToast } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobileNumber, setMobileNumber] = useState(currentUser?.mobileNumber || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    setPhotoUploading(true);
    setUploadProgress(15);

    // Instant local preview
    const localPreviewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    setAvatar(localPreviewUrl);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddthlutz4';
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'univercity';

      const uploaderData = new FormData();
      uploaderData.append('file', file, `avatar-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`);
      uploaderData.append('upload_preset', preset);

      setUploadProgress(50);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: uploaderData,
      });

      setUploadProgress(90);

      if (response.ok) {
        const resJson = await response.json();
        setAvatar(resJson.secure_url);
        showToast('Photo uploaded!', 'success');
      } else {
        const errText = await response.text();
        console.warn('Cloudinary upload failed:', response.status, errText);
      }
    } catch (error) {
      console.warn('Cloudinary upload error:', error);
    } finally {
      setPhotoUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Full Name is required', 'error');
      return;
    }

    const result = updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      mobileNumber: mobileNumber.trim(),
      avatar,
    });

    if (result?.success) {
      showToast('Profile updated successfully!', 'success');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-8 max-w-2xl animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-purple-400" />
          My Profile
        </h1>
        <p className="text-gray-400 text-sm mt-1">Update your profile photo, name, email and mobile number</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-8">

          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-purple-500/20">
            <div className="w-24 h-24 rounded-2xl bg-purple-950 border-2 border-purple-500/40 overflow-hidden flex items-center justify-center shrink-0 relative shadow-lg">
              <img
                src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Warden')}`}
                alt="Warden Avatar"
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

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900/85 border border-purple-500/30 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900/85 border border-purple-500/30 pl-11 pr-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-purple-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-gray-900/85 border border-purple-500/30 pl-11 pr-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Admin-only fields notice */}
          <div className="flex items-start gap-3 bg-purple-950/30 border border-purple-500/20 rounded-2xl px-4 py-3">
            <Lock className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-purple-300">Restricted Fields</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Hostel assignment, shift, employment type, and other operational details can only be changed by an <span className="text-purple-300 font-semibold">Administrator</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
