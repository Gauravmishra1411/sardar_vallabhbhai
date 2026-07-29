'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { HostelIssue, ISSUE_CATEGORIES, IssueStatus } from '@/types/auth';
import { NotificationCenter } from '@/components/NotificationCenter';
import { IssueDetailsModal } from '@/components/IssueDetailsModal';
import {
  Wrench,
  CheckCircle2,
  Clock,
  CircleDot,
  CheckCheck,
  X,
  Camera,
  Play,
  ClipboardCheck,
} from 'lucide-react';

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'New': { label: 'New', color: 'text-amber-300', bg: 'bg-amber-950/60', border: 'border-amber-500/30', icon: <Clock className="w-3 h-3" /> },
  'Assigned': { label: 'Assigned', color: 'text-blue-300', bg: 'bg-blue-950/60', border: 'border-blue-500/30', icon: <Wrench className="w-3 h-3" /> },
  'In Progress': { label: 'In Progress', color: 'text-purple-300', bg: 'bg-purple-950/60', border: 'border-purple-500/30', icon: <CircleDot className="w-3 h-3" /> },
  'Work Completed': { label: 'Work Done', color: 'text-emerald-300', bg: 'bg-emerald-950/60', border: 'border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  'Completed': { label: 'Closed', color: 'text-gray-400', bg: 'bg-gray-800/60', border: 'border-gray-600/30', icon: <CheckCheck className="w-3 h-3" /> },
  'Closed': { label: 'Closed', color: 'text-gray-500', bg: 'bg-gray-900/80', border: 'border-gray-700/30', icon: <CheckCheck className="w-3 h-3" /> },
};

const PRIORITY_CONFIG = {
  'Urgent': { color: 'text-rose-300', bg: 'bg-rose-950/80', border: 'border-rose-500/40' },
  'High': { color: 'text-amber-300', bg: 'bg-amber-950/80', border: 'border-amber-500/40' },
  'Medium': { color: 'text-blue-300', bg: 'bg-blue-950/80', border: 'border-blue-500/40' },
  'Low': { color: 'text-emerald-300', bg: 'bg-emerald-950/80', border: 'border-emerald-500/40' },
};

export default function StaffDashboard() {
  const { currentUser, issues, staffStartWork, completePhysicalWork } = useAuth();

  const [selectedIssue, setSelectedIssue] = useState<HostelIssue | null>(null);
  const [resolvingIssue, setResolvingIssue] = useState<HostelIssue | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolvePhoto, setResolvePhoto] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // My assigned complaints only
  const myIssues = issues.filter((i) => i.assignedStaffId === currentUser?.id);
  const activeIssues = myIssues.filter((i) => ['Assigned', 'In Progress'].includes(i.status));
  const resolvedIssues = myIssues.filter((i) => ['Work Completed', 'Completed'].includes(i.status));

  // Photo upload for resolution
  const compressImage = (base64Str: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.6)); }
        else resolve(base64Str);
      };
      img.onerror = () => resolve(base64Str);
    });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setPhotoUploading(true); setUploadProgress(15);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      if (!raw) { setPhotoUploading(false); return; }
      const compressed = await compressImage(raw);
      setResolvePhoto(compressed);
      let done = false;
      const finish = (url?: string) => {
        if (done) return; done = true;
        if (url) setResolvePhoto(url);
        setPhotoUploading(false); setUploadProgress(0);
      };
      const tid = setTimeout(finish, 8000);
      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddthlutz4';
        const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'univercity';
        const b64 = compressed.split(',')[1];
        const mime = compressed.split(';')[0].split(':')[1] || 'image/jpeg';
        const blob = new Blob([new Uint8Array(atob(b64).split('').map((c) => c.charCodeAt(0)))], { type: mime });
        const fd = new FormData();
        fd.append('file', blob, `resolution-${Date.now()}.jpg`);
        fd.append('upload_preset', preset);
        setUploadProgress(40);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
        clearTimeout(tid); setUploadProgress(80);
        if (res.ok) { const j = await res.json(); finish(j.secure_url); }
        else finish(compressed);
      } catch { clearTimeout(tid); finish(compressed); }
    };
    reader.onerror = () => { setPhotoUploading(false); setUploadProgress(0); };
    reader.readAsDataURL(file);
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIssue || !resolveNote.trim()) return;
    completePhysicalWork(resolvingIssue.id, resolveNote, resolvePhoto || undefined);
    setResolvingIssue(null);
    setResolveNote('');
    setResolvePhoto('');
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="h-16 border-b border-purple-500/20 bg-[#070a12]/80 backdrop-blur-md px-6 flex items-center justify-between rounded-2xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold text-base">Staff Work Portal</span>
          <span className="text-gray-600">/</span>
          <span className="text-white text-xs font-semibold">{currentUser.department || 'Maintenance'}</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationCenter />
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            Staff Mode
          </span>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/40">
          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Assigned</span>
          <h3 className="text-2xl font-black text-blue-400 mt-1">{myIssues.filter((i) => i.status === 'Assigned').length}</h3>
        </div>
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40">
          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">In Progress</span>
          <h3 className="text-2xl font-black text-purple-400 mt-1">{myIssues.filter((i) => i.status === 'In Progress').length}</h3>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
          <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Completed</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">{myIssues.filter((i) => i.status === 'Work Completed' || i.status === 'Completed').length}</h3>
        </div>
        <div className="p-4 rounded-2xl bg-gray-800/40 border border-gray-600/40">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Closed</span>
          <h3 className="text-2xl font-black text-gray-300 mt-1">{myIssues.filter((i) => i.status === 'Closed').length}</h3>
        </div>
      </div>

      {/* Active Complaints */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
          Active Assignments ({activeIssues.length})
        </h3>

        {activeIssues.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-400">No active assignments.</p>
            <p className="text-xs text-gray-600 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {activeIssues.map((iss) => {
              const catObj = ISSUE_CATEGORIES.find((c) => c.name === iss.category);
              const statusCfg = STATUS_CONFIG[iss.status];

              return (
                <div key={iss.id} className="p-5 rounded-2xl bg-gray-900/80 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-2xl shrink-0 cursor-pointer" onClick={() => setSelectedIssue(iss)}>
                      {catObj?.icon || '🏢'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedIssue(iss)}>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-black text-purple-400">{iss.id}</span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-500/30">
                          {iss.priority}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{iss.category} — {iss.subCategory}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{iss.description}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-[11px] text-gray-500">
                        <span>👤 {iss.studentName}</span>
                        <span>🏠 {iss.hostelName} — Room {iss.roomNumber}</span>
                        <span>📱 {iss.mobileNumber}</span>
                      </div>

                      {iss.assignmentNote && (
                        <div className="mt-2 p-2 rounded-lg bg-blue-950/40 border border-blue-500/20 text-[11px]">
                          <span className="text-blue-400 font-bold">📋 Note: </span>
                          <span className="text-blue-200">{iss.assignmentNote}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-gray-800 md:flex-col md:items-end">
                      {iss.status === 'Assigned' && (
                        <button
                          onClick={() => staffStartWork(iss.id)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <Play className="w-4 h-4" /> Start Work
                        </button>
                      )}

                      {iss.status === 'In Progress' && (
                        <button
                          onClick={() => { setResolvingIssue(iss); setResolveNote(''); setResolvePhoto(''); }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <ClipboardCheck className="w-4 h-4" /> Mark as Done
                        </button>
                      )}

                      <button onClick={() => setSelectedIssue(iss)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-all">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed History */}
      {resolvedIssues.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Completed History ({resolvedIssues.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {resolvedIssues.map((iss) => {
              const catObj = ISSUE_CATEGORIES.find((c) => c.name === iss.category);
              const statusCfg = STATUS_CONFIG[iss.status];
              return (
                <div key={iss.id} className="p-4 rounded-2xl bg-gray-900/40 border border-gray-700/30 opacity-70 hover:opacity-100 transition-all cursor-pointer" onClick={() => setSelectedIssue(iss)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-xl shrink-0">
                      {catObj?.icon || '🏢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-gray-400">{iss.id}</span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{iss.category} — {iss.subCategory}</p>
                      {iss.resolvedNote && <p className="text-[11px] text-emerald-400 mt-1 line-clamp-1">✅ {iss.resolvedNote}</p>}
                    </div>
                    {iss.resolvedAt && <span className="text-[10px] text-gray-600 shrink-0">{new Date(iss.resolvedAt).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── RESOLVE MODAL ─────────────────────────────────────────────────── */}
      {resolvingIssue && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Mark as Work Done</h3>
                  <span className="text-xs text-emerald-400 font-semibold">{resolvingIssue.id} • {resolvingIssue.subCategory}</span>
                </div>
              </div>
              <button onClick={() => setResolvingIssue(null)} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                  Resolution Note <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what was done to resolve the issue... e.g. Fan capacitor replaced and fan is working normally."
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  className="w-full bg-gray-900 border border-emerald-500/30 p-3 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                  Resolution Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-950/40 hover:bg-emerald-900/40 disabled:opacity-50 border border-emerald-500/30 text-emerald-300 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all">
                    <Camera className="w-4 h-4" />
                    {photoUploading ? `Uploading... ${uploadProgress}%` : resolvePhoto ? 'Change Photo' : 'Upload Resolution Photo'}
                  </button>
                  {resolvePhoto && (
                    <div className="relative w-12 h-12 rounded-xl bg-gray-900 border border-emerald-500/30 overflow-hidden shrink-0">
                      <img src={resolvePhoto} alt="Resolution" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setResolvePhoto('')}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setResolvingIssue(null)} className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold hover:bg-gray-700 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={!resolveNote.trim()}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5 transition-all">
                  <ClipboardCheck className="w-4 h-4" /> Submit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <IssueDetailsModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </div>
  );
}
