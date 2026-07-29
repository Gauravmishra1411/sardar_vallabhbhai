'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WardenRegistrationFormData, UserStatus } from '@/types/auth';
import { SVPUAT_HOSTELS } from '@/constants/hostels';
import { storage } from '@/lib/firebase';
// Firebase Storage replaced by Cloudinary
import {
  User,
  Phone,
  Building2,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Camera,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  FileText,
  UserCheck,
  Layers,
} from 'lucide-react';
import Link from 'next/link';


export function WardenRegistrationForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { registerWarden, showToast, currentUser } = useAuth();

  // Mode: Step-by-step vs Full Page View
  const [viewMode, setViewMode] = useState<'step' | 'full'>('step');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState<WardenRegistrationFormData>({
    // 01 Personal
    wardenId: `WDN-2026-${Math.floor(100 + Math.random() * 900)}`,
    fullName: '',
    avatarUrl: '',
    gender: 'Male',
    dob: '1985-05-15',

    // 02 Contact
    mobileNumber: '',
    alternateMobile: '',
    email: '',

    // 03 Hostel Assignment
    hostelName: SVPUAT_HOSTELS[0],
    hostelType: 'Boys Hostel',
    hostelBlock: 'Block A',
    officeNumber: 'Office G-01',

    // 04 Employment
    joiningDate: new Date().toISOString().split('T')[0],
    shift: 'Day Shift',
    employmentType: 'Permanent',

    // 05 Login & Security
    username: '',
    password: '',
    role: 'warden',
    accountStatus: 'active',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB.', 'error');
      return;
    }

    setPhotoUploading(true);
    setUploadProgress(15);

    // 1. Instant local Data URL preview
    const localPreviewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    handleChange('avatarUrl', localPreviewUrl);

    let isCompleted = false;
    const finishUpload = (toastMessage?: string, finalUrl?: string) => {
      if (isCompleted) return;
      isCompleted = true;
      if (finalUrl) {
        handleChange('avatarUrl', finalUrl);
      }
      setPhotoUploading(false);
      setUploadProgress(0);
      if (toastMessage) {
        showToast(toastMessage, 'success');
      }
    };

    // 2. Attempt cloud upload to Cloudinary
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddthlutz4';
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'univercity';

      // Use file directly as Blob — no base64 conversion needed
      const uploaderData = new FormData();
      uploaderData.append('file', file, `warden-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`);
      uploaderData.append('upload_preset', preset);

      setUploadProgress(40);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: uploaderData,
      });

      setUploadProgress(80);

      if (response.ok) {
        const resJson = await response.json();
        finishUpload('Photo uploaded successfully!', resJson.secure_url);
      } else {
        const errText = await response.text();
        console.warn('Cloudinary upload failed:', response.status, errText);
        finishUpload('Photo attached successfully!');
      }
    } catch (error) {
      console.warn('Cloudinary upload init error:', error);
      finishUpload('Photo attached successfully!');
    }
  };
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update Field
  const handleChange = (field: keyof WardenRegistrationFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-sync username with email
      if (field === 'email') {
        updated.username = value;
      }
      return updated;
    });
    // Clear error
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Section Validation
  const validateSection = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.wardenId.trim()) newErrors.wardenId = 'Warden ID is required';
      if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
      if (!formData.dob) newErrors.dob = 'Date of Birth is required';
    }

    if (step === 2) {
      if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile Number is required';
      if (!formData.email.trim()) newErrors.email = 'Email Address is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter a valid email address';
    }

    if (step === 3) {
      if (!formData.hostelName) newErrors.hostelName = 'Hostel Name is required';
      if (!formData.hostelBlock.trim()) newErrors.hostelBlock = 'Hostel Block is required';
      if (!formData.officeNumber.trim()) newErrors.officeNumber = 'Office / Room Number is required';
    }

    if (step === 4) {
      if (!formData.joiningDate) newErrors.joiningDate = 'Joining Date is required';
    }

    if (step === 5) {
      if (!formData.email.trim()) newErrors.email = 'Username/Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateSection(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setIsSubmitModalOpen(true);
      }
    } else {
      showToast('Please fix the errors in this section before proceeding.', 'error');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate all sections
    let isValid = true;
    for (let s = 1; s <= 5; s++) {
      if (!validateSection(s)) {
        isValid = false;
        if (viewMode === 'step') {
          setCurrentStep(s);
          break;
        }
      }
    }

    if (!isValid) {
      setIsSubmitModalOpen(false);
      showToast('Please complete all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    const result = registerWarden(formData);
    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitModalOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/auth');
      }
    }
  };

  const stepsList = [
    { num: 1, title: '01 Personal Info', icon: User, desc: 'Identity & Details' },
    { num: 2, title: '02 Contact Details', icon: Phone, desc: 'Mobile & Email' },
    { num: 3, title: '03 Hostel Assignment', icon: Building2, desc: 'Hostel & Office' },
    { num: 4, title: '04 Employment Info', icon: Briefcase, desc: 'Joining & Shift' },
    { num: 5, title: '05 Login & Security', icon: Lock, desc: 'Credentials & Role' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-purple-500/30 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Official Administrative Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Warden Registration Form
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Register a new Hostel Warden with complete personal, assignment, employment, and security credentials.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="relative z-10 flex items-center bg-gray-900/80 p-1.5 rounded-2xl border border-purple-500/30 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('step')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              viewMode === 'step' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Step-by-Step
          </button>
          <button
            type="button"
            onClick={() => setViewMode('full')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              viewMode === 'full' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> All-in-One Scroll
          </button>
        </div>
      </div>

      {/* Step Indicator Bar (in Step Mode) */}
      {viewMode === 'step' && (
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-2">
            <span>SECTION {currentStep} OF 5</span>
            <span className="text-purple-400 font-extrabold">{currentStep * 20}% COMPLETED</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-purple-500/20">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${currentStep * 20}%` }}
            />
          </div>

          {/* Step Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            {stepsList.map((step) => {
              const Icon = step.icon;
              const isDone = step.num < currentStep;
              const isCurrent = step.num === currentStep;

              return (
                <button
                  type="button"
                  key={step.num}
                  onClick={() => {
                    if (step.num < currentStep || validateSection(currentStep)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    isCurrent
                      ? 'bg-purple-950/70 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                      : isDone
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold bg-purple-900/50 border border-purple-500/30">
                      {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : `0${step.num}`}
                    </span>
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-purple-400' : isDone ? 'text-emerald-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold truncate">{step.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{step.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        {/* ==================== 01 PERSONAL INFORMATION ==================== */}
        {(viewMode === 'full' || currentStep === 1) && (
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">01 Personal Information</h2>
                <p className="text-xs text-gray-400">Warden identification, identity details, and profile photo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Warden ID */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Warden ID <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-bold text-purple-400">ID</span>
                  <input
                    type="text"
                    value={formData.wardenId}
                    onChange={(e) => handleChange('wardenId', e.target.value)}
                    className="w-full bg-gray-900/80 border border-purple-500/30 pl-10 pr-4 py-3 rounded-2xl text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                    placeholder="e.g. WDN-2026-101"
                  />
                </div>
                {errors.wardenId && <p className="text-xs text-rose-400 mt-1">{errors.wardenId}</p>}
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="Dr. Rajesh Sharma"
                />
                {errors.fullName && <p className="text-xs text-rose-400 mt-1">{errors.fullName}</p>}
              </div>

              {/* Profile Photo */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  Profile Photo
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="w-20 h-20 rounded-2xl bg-purple-950 border-2 border-purple-500/40 overflow-hidden flex items-center justify-center shrink-0 relative">
                    <img
                      src={
                        formData.avatarUrl
                          ? formData.avatarUrl
                          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.fullName || 'Warden')}`
                      }
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                    {photoUploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{uploadProgress}%</span>
                      </div>
                    )}
                  </div>

                  {/* File Picker */}
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
                      className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/40 disabled:opacity-50 border border-purple-500/40 hover:border-purple-400 text-purple-200 text-sm font-medium py-3 px-4 rounded-2xl transition-all duration-200 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      {photoUploading
                        ? `Uploading... ${uploadProgress}%`
                        : formData.avatarUrl
                        ? 'Change Photo'
                        : 'Choose from Gallery'}
                    </button>
                    <p className="text-[11px] text-gray-400">
                      {formData.avatarUrl
                        ? '✅ Photo uploaded to Firebase Storage'
                        : 'Select a JPG, PNG or WEBP image (max 5MB). An auto-generated avatar will be used if skipped.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Gender <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => handleChange('gender', g)}
                      className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                        formData.gender === g
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                          : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Date of Birth <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
                {errors.dob && <p className="text-xs text-rose-400 mt-1">{errors.dob}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 02 CONTACT INFORMATION ==================== */}
        {(viewMode === 'full' || currentStep === 2) && (
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">02 Contact Information</h2>
                <p className="text-xs text-gray-400">Communication lines, emergency numbers, and official email</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mobile Number */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => handleChange('mobileNumber', e.target.value)}
                  className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="+91 98765 43210"
                />
                {errors.mobileNumber && <p className="text-xs text-rose-400 mt-1">{errors.mobileNumber}</p>}
              </div>

              {/* Alternate Mobile */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Alternate Mobile (Emergency)
                </label>
                <input
                  type="tel"
                  value={formData.alternateMobile}
                  onChange={(e) => handleChange('alternateMobile', e.target.value)}
                  className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="+91 98123 45678 (Optional)"
                />
              </div>

              {/* Email Address */}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="warden@svpuat.edu.in"
                />
                {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
                <p className="text-[11px] text-gray-400 mt-1">
                  This email will also serve as the login username.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 03 HOSTEL ASSIGNMENT ==================== */}
        {(viewMode === 'full' || currentStep === 3) && (
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">03 Hostel Assignment</h2>
                <p className="text-xs text-gray-400">Designated hostel premises, block, and warden office location</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hostel Name */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Hostel Name <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.hostelName}
                  onChange={(e) => handleChange('hostelName', e.target.value)}
                  className="w-full bg-gray-900 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {SVPUAT_HOSTELS.map((h) => (
                    <option key={h} value={h} className="bg-gray-900 text-white">
                      {h}
                    </option>
                  ))}
                </select>
                {errors.hostelName && <p className="text-xs text-rose-400 mt-1">{errors.hostelName}</p>}
              </div>

              {/* Hostel Type */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Hostel Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.hostelType}
                  onChange={(e) => handleChange('hostelType', e.target.value)}
                  className="w-full bg-gray-900 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls Hostel">Girls Hostel</option>
                  <option value="Co-ed">Co-ed</option>
                  <option value="Research Scholar Hostel">Research Scholar Hostel</option>
                </select>
              </div>

              {/* Hostel Block */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Hostel Block <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hostelBlock}
                  onChange={(e) => handleChange('hostelBlock', e.target.value)}
                  className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="Block A / Main Wing"
                />
                {errors.hostelBlock && <p className="text-xs text-rose-400 mt-1">{errors.hostelBlock}</p>}
              </div>

              {/* Room / Office Number */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Room / Office Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.officeNumber}
                  onChange={(e) => handleChange('officeNumber', e.target.value)}
                  className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="Office G-01 / Warden Quarter 101"
                />
                {errors.officeNumber && <p className="text-xs text-rose-400 mt-1">{errors.officeNumber}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 04 EMPLOYMENT INFORMATION ==================== */}
        {(viewMode === 'full' || currentStep === 4) && (
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">04 Employment Information</h2>
                <p className="text-xs text-gray-400">Joining date, working shift, and employment type</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Joining Date */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Joining Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => handleChange('joiningDate', e.target.value)}
                  className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
                {errors.joiningDate && <p className="text-xs text-rose-400 mt-1">{errors.joiningDate}</p>}
              </div>

              {/* Shift */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Duty Shift <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => handleChange('shift', e.target.value)}
                  className="w-full bg-gray-900 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Day Shift">Day Shift (09:00 AM - 05:00 PM)</option>
                  <option value="Night Shift">Night Shift (05:00 PM - 09:00 AM)</option>
                  <option value="24x7 On-Call">24x7 On-Call</option>
                  <option value="Rotational">Rotational Shift</option>
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Employment Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => handleChange('employmentType', e.target.value)}
                  className="w-full bg-gray-900 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Permanent">Permanent Faculty/Staff</option>
                  <option value="Deputation">Deputation</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Guest Warden">Guest Warden</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 05 LOGIN & SECURITY ==================== */}
        {(viewMode === 'full' || currentStep === 5) && (
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">05 Login &amp; Security</h2>
                <p className="text-xs text-gray-400">System credentials, password protection, and account status</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username / Email */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Username / Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username || formData.email}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="warden@svpuat.edu.in"
                />
              </div>

              {/* Role (Read-only) */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  System Role
                </label>
                <div className="w-full bg-purple-950/40 border border-purple-500/30 px-4 py-3 rounded-2xl text-sm text-purple-300 font-extrabold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Warden (Hostel Authority)
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full bg-gray-900/80 border border-purple-500/30 pl-4 pr-12 py-3 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-900/80 border border-purple-500/30 pl-4 pr-12 py-3 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-rose-400 mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Account Status */}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Account Status
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleChange('accountStatus', 'active')}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                      formData.accountStatus === 'active'
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-xs font-bold">Active</p>
                      <p className="text-[10px] text-gray-400">Warden portal login immediately enabled</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('accountStatus', 'suspended')}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                      formData.accountStatus === 'suspended'
                        ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400'
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <p className="text-xs font-bold">Suspended / Pending</p>
                      <p className="text-[10px] text-gray-400">Account created but requires admin verification</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation Control Bar */}
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 flex items-center justify-between gap-4">
          {viewMode === 'step' && currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold flex items-center gap-2 transition-all border border-gray-800"
            >
              <ArrowLeft className="w-4 h-4" /> Previous Section
            </button>
          ) : (
            <Link
              href="/warden/dashboard"
              className="px-6 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white text-xs font-bold flex items-center gap-2 transition-all border border-gray-800"
            >
              Cancel &amp; Exit
            </Link>
          )}

          {viewMode === 'step' && currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-8 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              Next Section <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Review &amp; Register Warden
            </button>
          )}
        </div>
      </form>

      {/* ==================== SUMMARY & SUBMIT MODAL ==================== */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-purple-500/40 rounded-3xl max-w-2xl w-full p-6 md:p-8 text-white shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Review Warden Registration</h3>
                <p className="text-xs text-purple-400">Verify details across all 5 sections before submitting</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Section 01 */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2">
                <div className="text-xs font-extrabold text-purple-400 uppercase">01 Personal Information</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Warden ID:</span> <strong className="text-white font-mono">{formData.wardenId}</strong></div>
                  <div><span className="text-gray-400">Full Name:</span> <strong className="text-white">{formData.fullName}</strong></div>
                  <div><span className="text-gray-400">Gender:</span> <strong className="text-white">{formData.gender}</strong></div>
                  <div><span className="text-gray-400">DOB:</span> <strong className="text-white">{formData.dob}</strong></div>
                </div>
              </div>

              {/* Section 02 */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2">
                <div className="text-xs font-extrabold text-purple-400 uppercase">02 Contact Information</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Mobile:</span> <strong className="text-white">{formData.mobileNumber}</strong></div>
                  <div><span className="text-gray-400">Alternate:</span> <strong className="text-white">{formData.alternateMobile || 'N/A'}</strong></div>
                  <div className="col-span-2"><span className="text-gray-400">Email:</span> <strong className="text-white">{formData.email}</strong></div>
                </div>
              </div>

              {/* Section 03 */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2">
                <div className="text-xs font-extrabold text-purple-400 uppercase">03 Hostel Assignment</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Hostel:</span> <strong className="text-white">{formData.hostelName}</strong></div>
                  <div><span className="text-gray-400">Type:</span> <strong className="text-white">{formData.hostelType}</strong></div>
                  <div><span className="text-gray-400">Block:</span> <strong className="text-white">{formData.hostelBlock}</strong></div>
                  <div><span className="text-gray-400">Office/Room:</span> <strong className="text-white">{formData.officeNumber}</strong></div>
                </div>
              </div>

              {/* Section 04 */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2">
                <div className="text-xs font-extrabold text-purple-400 uppercase">04 Employment Information</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Joining Date:</span> <strong className="text-white">{formData.joiningDate}</strong></div>
                  <div><span className="text-gray-400">Duty Shift:</span> <strong className="text-white">{formData.shift}</strong></div>
                  <div className="col-span-2"><span className="text-gray-400">Type:</span> <strong className="text-white">{formData.employmentType}</strong></div>
                </div>
              </div>

              {/* Section 05 */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2">
                <div className="text-xs font-extrabold text-purple-400 uppercase">05 Security &amp; Credentials</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Username:</span> <strong className="text-white">{formData.username || formData.email}</strong></div>
                  <div><span className="text-gray-400">Status:</span> <strong className="text-emerald-400 uppercase font-bold">{formData.accountStatus}</strong></div>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold hover:bg-gray-700 transition-all"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm &amp; Register Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
