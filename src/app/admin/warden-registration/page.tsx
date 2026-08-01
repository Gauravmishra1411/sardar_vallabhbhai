'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WardenRegistrationForm } from '@/components/WardenRegistrationForm';
import { SVPUAT_HOSTELS } from '@/constants/hostels';
import {
  ShieldCheck, Users, Search, PlusCircle, Building2, Phone, Calendar,
  Trash2, CheckCircle2, X, Pencil, Save, Camera,
} from 'lucide-react';
import { User } from '@/types/auth';

type EditableFields = {
  name: string;
  email: string;
  mobileNumber: string;
  hostelName: string;
  hostelType: string;
  hostelBlock: string;
  shift: string;
  employmentType: string;
  officeNumber: string;
  joiningDate: string;
  avatar: string;
};

export default function AdminWardenRegistrationPage() {
  const { users, updateUserStatus, deleteUser, adminUpdateWarden, showToast } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWarden, setEditingWarden] = useState<User | null>(null);
  const [editFields, setEditFields] = useState<EditableFields | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wardens = users.filter((u) => u.role === 'warden');
  const filteredWardens = wardens.filter((w) => {
    const q = searchTerm.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      w.email.toLowerCase().includes(q) ||
      (w.hostelName && w.hostelName.toLowerCase().includes(q))
    );
  });

  const totalCount = wardens.length;
  const activeCount = wardens.filter((w) => w.status === 'active').length;
  const pendingCount = wardens.filter((w) => w.status === 'suspended' || w.status === 'pending' || w.approved === false).length;

  const openEdit = (warden: User) => {
    setEditingWarden(warden);
    setEditFields({
      name: warden.name || '',
      email: warden.email || '',
      mobileNumber: warden.mobileNumber || '',
      hostelName: warden.hostelName || SVPUAT_HOSTELS[9],
      hostelType: warden.hostelType || 'Boys Hostel',
      hostelBlock: warden.hostelBlock || '',
      shift: warden.shift || 'Day Shift',
      employmentType: warden.employmentType || 'Permanent',
      officeNumber: warden.officeNumber || '',
      joiningDate: warden.joiningDate || '',
      avatar: warden.avatar || '',
    });
  };

  const closeEdit = () => {
    setEditingWarden(null);
    setEditFields(null);
    setPhotoUploading(false);
    setUploadProgress(0);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editFields) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    setPhotoUploading(true);
    setUploadProgress(20);

    // Instant preview
    const localPreviewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    setEditFields((prev) => prev ? { ...prev, avatar: localPreviewUrl } : prev);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddthlutz4';
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'univercity';

      const uploaderData = new FormData();
      uploaderData.append('file', file, `warden-admin-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`);
      uploaderData.append('upload_preset', preset);

      setUploadProgress(50);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: uploaderData,
      });

      setUploadProgress(90);
      if (response.ok) {
        const resJson = await response.json();
        setEditFields((prev) => prev ? { ...prev, avatar: resJson.secure_url } : prev);
        showToast('Photo uploaded!', 'success');
      } else {
        console.warn('Cloudinary upload error — using local preview');
      }
    } catch (err) {
      console.warn('Cloudinary upload init error:', err);
    } finally {
      setPhotoUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveEdit = () => {
    if (!editingWarden || !editFields) return;
    if (!editFields.name.trim()) {
      showToast('Full name is required', 'error');
      return;
    }
    adminUpdateWarden(editingWarden.id, {
      name: editFields.name.trim(),
      email: editFields.email.trim(),
      mobileNumber: editFields.mobileNumber.trim(),
      hostelName: editFields.hostelName,
      hostelType: editFields.hostelType,
      hostelBlock: editFields.hostelBlock,
      shift: editFields.shift,
      employmentType: editFields.employmentType,
      officeNumber: editFields.officeNumber,
      joiningDate: editFields.joiningDate,
      avatar: editFields.avatar,
    });
    closeEdit();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            Warden Management Portal
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage assigned hostels, shifts, approval status, and active warden directory</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg flex items-center gap-1.5 transition-all w-fit cursor-pointer"
        >
          {showAddForm ? (
            <><X className="w-4 h-4" /> View Directory</>
          ) : (
            <><PlusCircle className="w-4 h-4" /> Register New Warden</>
          )}
        </button>
      </div>

      {showAddForm ? (
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20">
          <div className="mb-6 pb-3 border-b border-purple-500/20">
            <h2 className="text-base font-extrabold text-white">Manual Warden Registration Form</h2>
            <p className="text-xs text-gray-400 mt-1">Complete all steps to add a new warden to the university network</p>
          </div>
          <WardenRegistrationForm onSuccess={() => setShowAddForm(false)} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/40">
              <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Total Wardens</span>
              <span className="text-2xl font-black text-white mt-1 block">{totalCount}</span>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Active &amp; Working</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">{activeCount}</span>
            </div>
            <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Pending Approval</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">{pendingCount}</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, or hostel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Wardens Grid */}
          {filteredWardens.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-purple-500/20">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-300">No Wardens Found</h3>
              <p className="text-xs text-gray-500 mt-1">Add a new warden or adjust your search filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWardens.map((warden) => (
                <div
                  key={warden.id}
                  className="glass-panel p-5 rounded-2xl border border-purple-500/20 flex flex-col justify-between gap-4 bg-[#24103F]/20 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple-900/40 border border-purple-500/30 overflow-hidden flex items-center justify-center font-bold text-lg text-purple-300 shrink-0">
                      {warden.avatar ? (
                        <img src={warden.avatar} alt={warden.name} className="w-full h-full object-cover" />
                      ) : (
                        (warden.name ?? '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{warden.name}</h3>
                        {warden.wardenId && (
                          <span className="text-[9px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                            {warden.wardenId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{warden.email}</p>
                      <div className="flex flex-col gap-1 pt-1.5">
                        <span className="text-[11px] text-purple-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-400" /> {warden.hostelName || 'No Hostel Assigned'}
                        </span>
                        <span className="text-[11px] text-purple-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-purple-400" /> {warden.mobileNumber || 'N/A'}
                        </span>
                        {warden.shift && (
                          <span className="text-[11px] text-purple-300 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" /> {warden.shift} &bull; {warden.employmentType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-purple-500/10 pt-3">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      warden.status === 'active' && warden.approved !== false
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                        : warden.status === 'rejected'
                        ? 'bg-rose-950 text-rose-400 border-rose-500/30'
                        : 'bg-amber-950 text-amber-400 border-amber-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        warden.status === 'active' && warden.approved !== false ? 'bg-emerald-400' : warden.status === 'rejected' ? 'bg-rose-400' : 'bg-amber-400'
                      }`} />
                      {warden.status === 'active' && warden.approved !== false ? '✓ Active' : warden.status === 'rejected' ? '✗ Rejected' : '⏳ Pending Approval'}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEdit(warden)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black text-white bg-purple-700 hover:bg-purple-600 transition-all flex items-center gap-1 cursor-pointer"
                        title="Edit Warden"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>

                      {/* Approve / Revoke Toggle Button */}
                      <button
                        onClick={() => {
                          const isCurrentlyApproved = warden.status === 'active' && warden.approved !== false;
                          if (isCurrentlyApproved) {
                            updateUserStatus(warden.id, 'pending');
                          } else {
                            updateUserStatus(warden.id, 'active');
                          }
                        }}
                        title={warden.status === 'active' && warden.approved !== false ? 'Click to Revoke Approval' : 'Click to Approve'}
                        className={`relative px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                          warden.status === 'active' && warden.approved !== false
                            ? 'bg-emerald-600 hover:bg-rose-600 text-white group'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {warden.status === 'active' && warden.approved !== false ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 group-hover:hidden" />
                            <span className="group-hover:hidden">Approved</span>
                            <span className="hidden group-hover:inline text-[10px]">Revoke?</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </>
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteUser(warden.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/40 transition-all cursor-pointer"
                        title="Delete Warden"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit Warden Modal */}
      {editingWarden && editFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0D1320] border border-purple-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20 sticky top-0 bg-[#0D1320] z-10">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-purple-400" /> Edit Warden
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Full admin access — all fields editable</p>
              </div>
              <button onClick={closeEdit} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-2xl bg-purple-900/40 border border-purple-500/30 overflow-hidden flex items-center justify-center font-bold text-xl text-purple-300 shrink-0">
                  {editFields.avatar ? (
                    <img src={editFields.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (editingWarden.name ?? '?').charAt(0).toUpperCase()
                  )}
                  {photoUploading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{uploadProgress}%</span>
                    </div>
                  )}
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" /> Change Photo
                  </button>
                  <p className="text-[10px] text-gray-500 mt-1.5">JPG, PNG or WEBP (max 5MB)</p>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={editFields.name}
                    onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                    className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editFields.email}
                    onChange={(e) => setEditFields({ ...editFields, email: e.target.value })}
                    className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    value={editFields.mobileNumber}
                    onChange={(e) => setEditFields({ ...editFields, mobileNumber: e.target.value })}
                    className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    value={editFields.joiningDate}
                    onChange={(e) => setEditFields({ ...editFields, joiningDate: e.target.value })}
                    className="w-full bg-gray-900/80 border border-purple-500/30 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Hostel Assignment */}
              <div className="pt-4 border-t border-purple-500/10">
                <h3 className="text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Hostel Assignment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-purple-300 uppercase block mb-1.5">Hostel Name</label>
                    <select
                      value={editFields.hostelName}
                      onChange={(e) => setEditFields({ ...editFields, hostelName: e.target.value })}
                      className="w-full bg-gray-900 border border-purple-500/20 p-2.5 rounded-xl text-xs text-white"
                    >
                      {SVPUAT_HOSTELS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-300 uppercase block mb-1.5">Hostel Type</label>
                    <select
                      value={editFields.hostelType}
                      onChange={(e) => setEditFields({ ...editFields, hostelType: e.target.value })}
                      className="w-full bg-gray-900 border border-purple-500/20 p-2.5 rounded-xl text-xs text-white"
                    >
                      {['Boys Hostel', 'Girls Hostel', 'Co-ed', 'Research Scholar Hostel'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-300 uppercase block mb-1.5">Hostel Block</label>
                    <input
                      type="text"
                      value={editFields.hostelBlock}
                      onChange={(e) => setEditFields({ ...editFields, hostelBlock: e.target.value })}
                      className="w-full bg-gray-900 border border-purple-500/20 p-2.5 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-300 uppercase block mb-1.5">Office / Room No.</label>
                    <input
                      type="text"
                      value={editFields.officeNumber}
                      onChange={(e) => setEditFields({ ...editFields, officeNumber: e.target.value })}
                      className="w-full bg-gray-900 border border-purple-500/20 p-2.5 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-300 uppercase block mb-1.5">Shift</label>
                    <select
                      value={editFields.shift}
                      onChange={(e) => setEditFields({ ...editFields, shift: e.target.value })}
                      className="w-full bg-gray-900 border border-purple-500/20 p-2.5 rounded-xl text-xs text-white"
                    >
                      {['Day Shift', 'Night Shift', '24x7 On-Call', 'Rotational'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-300 uppercase block mb-1.5">Employment Type</label>
                    <select
                      value={editFields.employmentType}
                      onChange={(e) => setEditFields({ ...editFields, employmentType: e.target.value })}
                      className="w-full bg-gray-900 border border-purple-500/20 p-2.5 rounded-xl text-xs text-white"
                    >
                      {['Permanent', 'Deputation', 'Contractual', 'Guest Warden'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-purple-500/20 sticky bottom-0 bg-[#0D1320]">
              <button
                onClick={closeEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
