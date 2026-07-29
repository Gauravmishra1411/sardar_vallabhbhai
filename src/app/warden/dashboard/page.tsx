'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HostelIssue, IssuePriority, IssueStatus, ISSUE_CATEGORIES, DEPARTMENTS, CategoryName } from '@/types/auth';
import { NotificationCenter } from '@/components/NotificationCenter';
import { IssueDetailsModal } from '@/components/IssueDetailsModal';
import { AssignWorkModal } from '@/components/AssignWorkModal';
import { ExpenseSubmissionModal } from '@/components/ExpenseSubmissionModal';
import { SVPUAT_HOSTELS } from '@/constants/hostels';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  ShieldCheck,
  UserCheck,
  PlusCircle,
  X,
  Camera,
  CircleDot,
  CheckCheck,
  RefreshCw,
  Eye,
  Receipt,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'New': {
    label: 'New',
    color: 'text-amber-300',
    bg: 'bg-amber-950/60',
    border: 'border-amber-500/30',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  'Assigned': {
    label: 'Assigned',
    color: 'text-blue-300',
    bg: 'bg-blue-950/60',
    border: 'border-blue-500/30',
    icon: <UserCheck className="w-3 h-3" />,
  },
  'In Progress': {
    label: 'In Progress',
    color: 'text-purple-300',
    bg: 'bg-purple-950/60',
    border: 'border-purple-500/30',
    icon: <CircleDot className="w-3 h-3" />,
  },
  'Work Completed': {
    label: 'Work Done',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/30',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  'Completed': {
    label: 'Completed',
    color: 'text-gray-400',
    bg: 'bg-gray-800/60',
    border: 'border-gray-600/30',
    icon: <CheckCheck className="w-3 h-3" />,
  },
  'Closed': {
    label: 'Closed',
    color: 'text-gray-500',
    bg: 'bg-gray-900/80',
    border: 'border-gray-700/30',
    icon: <CheckCheck className="w-3 h-3" />,
  },
};

const PRIORITY_CONFIG = {
  'Urgent': { color: 'text-rose-300', bg: 'bg-rose-950/80', border: 'border-rose-500/40' },
  'High': { color: 'text-amber-300', bg: 'bg-amber-950/80', border: 'border-amber-500/40' },
  'Medium': { color: 'text-blue-300', bg: 'bg-blue-950/80', border: 'border-blue-500/40' },
  'Low': { color: 'text-emerald-300', bg: 'bg-emerald-950/80', border: 'border-emerald-500/40' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function WardenDashboard() {
  const { currentUser, issues, users, assignWork, completePhysicalWork, submitExpense, closeComplaint, reopenComplaint, createIssue } = useAuth();
  const searchParams = useSearchParams();

  const [selectedIssue, setSelectedIssue] = useState<HostelIssue | null>(null);
  const [assigningIssue, setAssigningIssue] = useState<HostelIssue | null>(null);
  const [expensingIssue, setExpensingIssue] = useState<HostelIssue | null>(null);
  const [reopeningIssue, setReopeningIssue] = useState<HostelIssue | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  // Add Issue state
  const [isAddIssueOpen, setIsAddIssueOpen] = useState(false);
  const [newCat, setNewCat] = useState<CategoryName>('Electricity');
  const [newSubCat, setNewSubCat] = useState<string>('Fan Not Working');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<IssuePriority>('Medium');
  const [newRoom, setNewRoom] = useState('');
  const [newHostel, setNewHostel] = useState(currentUser?.hostelName || SVPUAT_HOSTELS[0]);
  const [newMobile, setNewMobile] = useState(currentUser?.mobileNumber || '');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const staffMembers = users.filter((u) => u.role === 'staff');

  // We no longer pre-fill here, it is handled inside AssignWorkModal

  // Deep-link from notification
  useEffect(() => {
    const issueId = searchParams.get('issueId');
    if (issueId && issues.length > 0) {
      const found = issues.find((i) => i.id === issueId);
      if (found) setSelectedIssue(found);
    }
  }, [searchParams, issues]);

  const wardenHostel = currentUser?.hostelName || 'Raman Hostel';

  // Warden sees ALL issues (same as Admin)
  const filteredIssues = issues.filter((i) => {
    const matchesSearch =
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.assignedStaffName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    New: issues.filter((i) => i.status === 'New').length,
    Assigned: issues.filter((i) => i.status === 'Assigned').length,
    'In Progress': issues.filter((i) => i.status === 'In Progress').length,
    'Work Completed': issues.filter((i) => i.status === 'Work Completed').length,
    Completed: issues.filter((i) => i.status === 'Completed').length,
  };

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopeningIssue) return;
    reopenComplaint(reopeningIssue.id, reopenReason.trim() || 'Complaint reopened for further review.');
    setReopeningIssue(null);
    setReopenReason('');
  };

  const openAssignModal = (iss: HostelIssue) => {
    setAssigningIssue(iss);
  };

  const openExpenseModal = (iss: HostelIssue) => {
    setExpensingIssue(iss);
  };

  // Photo upload (same as before)
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
      setPhotoUrl(compressed);
      let done = false;
      const finish = (url?: string) => {
        if (done) return; done = true;
        if (url) setPhotoUrl(url);
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
        fd.append('file', blob, `warden-${Date.now()}.jpg`);
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

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    const res = createIssue({
      category: newCat,
      subCategory: newSubCat,
      description: newDesc,
      priority: newPriority,
      hostelName: newHostel || wardenHostel,
      roomNumber: newRoom.trim() || 'Hostel Office',
      mobileNumber: newMobile.trim() || currentUser?.mobileNumber || '+91 98123 45678',
      photoUrl: photoUrl.trim() || undefined,
    });
    if (res.success) {
      setIsAddIssueOpen(false);
      setNewDesc(''); setPhotoUrl(''); setNewRoom('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-purple-500/20 bg-[#070a12]/80 backdrop-blur-md px-6 md:px-8 flex items-center justify-between rounded-2xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-purple-400 font-bold text-base">Warden Desk</span>
          <span className="text-gray-600">/</span>
          <span className="text-white text-xs font-semibold">All Grievances</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddIssueOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Report Issue
          </button>
          <NotificationCenter />
          <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Verified Authority
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* ─── Stat Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.entries(counts) as [string, number][]).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status as IssueStatus] || STATUS_CONFIG['New'];
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`p-4 rounded-2xl ${cfg.bg} border ${cfg.border} flex flex-col justify-between hover:opacity-80 transition-all text-left`}
              >
                <span className={`text-[10px] ${cfg.color} font-bold uppercase tracking-wider flex items-center gap-1`}>
                  {cfg.icon} {cfg.label}
                </span>
                <h3 className={`text-2xl font-black ${cfg.color} mt-2`}>{count}</h3>
              </button>
            );
          })}
        </div>

        {/* ─── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-purple-950/20 p-4 rounded-2xl border border-purple-500/20">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search ID, student, hostel, staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-purple-500/30 pl-10 pr-4 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {(['All', 'New', 'Assigned', 'In Progress', 'Work Completed', 'Completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st ? 'bg-purple-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Grievance Cards ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
            {statusFilter === 'All' ? 'All' : statusFilter} Grievances ({filteredIssues.length})
          </h3>

          {filteredIssues.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-purple-400 mx-auto" />
              <p className="text-sm font-medium text-gray-400">No complaints matching this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredIssues.map((iss) => {
                const catObj = ISSUE_CATEGORIES.find((c) => c.name === iss.category);
                const statusCfg = STATUS_CONFIG[iss.status] || STATUS_CONFIG['New'];
                const priorityCfg = PRIORITY_CONFIG[iss.priority] || PRIORITY_CONFIG['Medium'];

                return (
                  <div
                    key={iss.id}
                    className="p-5 rounded-2xl bg-gray-900/80 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-2xl shrink-0 cursor-pointer"
                        onClick={() => setSelectedIssue(iss)}
                      >
                        {catObj?.icon || '🏢'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 cursor-pointer min-w-0" onClick={() => setSelectedIssue(iss)}>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-black text-purple-400">{iss.id}</span>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${priorityCfg.bg} ${priorityCfg.color} border ${priorityCfg.border}`}>
                            {iss.priority}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white">{iss.category} — {iss.subCategory}</h4>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{iss.description}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-[11px] text-gray-500">
                          <span>👤 <strong className="text-gray-300">{iss.studentName}</strong></span>
                          <span>🏠 <strong className="text-gray-300">{iss.hostelName} — Room {iss.roomNumber}</strong></span>
                          <span>📱 {iss.mobileNumber}</span>
                          <span>🗓 {new Date(iss.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>

                        {iss.assignedStaffName && (
                          <div className="mt-2 flex items-center gap-2 text-[11px]">
                            <span className="text-blue-400">🔧 Assigned to:</span>
                            <strong className="text-blue-300">{iss.assignedStaffName}</strong>
                            {iss.department && <span className="text-gray-500">({iss.department})</span>}
                            {iss.assignedBy && <span className="text-gray-600">by {iss.assignedBy}</span>}
                          </div>
                        )}

                        {iss.resolvedNote && (
                          <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px]">
                            <span className="text-emerald-400 font-bold">✅ Resolution: </span>
                            <span className="text-emerald-200">{iss.resolvedNote}</span>
                            {iss.resolvedBy && <span className="text-emerald-500"> — {iss.resolvedBy}</span>}
                          </div>
                        )}

                        {iss.closedBy && (
                          <div className="mt-1.5 text-[11px] text-gray-500">
                            🔒 Closed by <span className="text-gray-400">{iss.closedBy}</span>
                            {iss.closedAt && ` on ${new Date(iss.closedAt).toLocaleDateString('en-IN')}`}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-gray-800 md:flex-col md:items-end">
                        {iss.status === 'New' && (
                          <button
                            onClick={() => openAssignModal(iss)}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all"
                          >
                            <UserCheck className="w-4 h-4" /> Assign Staff
                          </button>
                        )}

                        {iss.status === 'Assigned' && (
                          <button
                            onClick={() => setSelectedIssue(iss)}
                            className="px-4 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Eye className="w-4 h-4" /> View Assignment
                          </button>
                        )}

                        {iss.status === 'In Progress' && (
                          <button
                            onClick={() => openExpenseModal(iss)}
                            className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Receipt className="w-4 h-4" /> Submit Work & Expense
                          </button>
                        )}

                        {iss.status === 'Work Completed' && iss.financialStatus === 'None' && (
                          <button
                            onClick={() => openExpenseModal(iss)}
                            className="px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Receipt className="w-4 h-4" /> Submit Expense
                          </button>
                        )}

                        {iss.status === 'Work Completed' && iss.financialStatus === 'Payment Completed' && (
                          <button
                            onClick={() => closeComplaint(iss.id)}
                            className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all"
                          >
                            <CheckCheck className="w-4 h-4" /> Finalize Closure
                          </button>
                        )}

                        {(iss.status === 'Work Completed' || iss.status === 'Completed') && (
                          <button
                            onClick={() => { setReopeningIssue(iss); setReopenReason(''); }}
                            className="px-4 py-2 rounded-xl bg-orange-950/60 hover:bg-orange-900/60 text-orange-300 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <RefreshCw className="w-4 h-4" /> Reopen
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedIssue(iss)}
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─── ASSIGN STAFF MODAL ─────────────────────────────────────────────── */}
      {assigningIssue && (
        <AssignWorkModal
          issue={assigningIssue}
          staffMembers={staffMembers}
          onClose={() => setAssigningIssue(null)}
          onAssign={(id, sId, sName, dept, prio, opts) => {
            assignWork(id, sId, sName, dept, prio, opts);
            setAssigningIssue(null);
          }}
        />
      )}

      {/* ─── EXPENSE SUBMISSION MODAL ─────────────────────────────────────── */}
      {expensingIssue && (
        <ExpenseSubmissionModal
          issue={expensingIssue}
          onClose={() => setExpensingIssue(null)}
          onSubmit={(data) => {
            if (expensingIssue.status !== 'Work Completed') {
              completePhysicalWork(
                expensingIssue.id, 
                data.expenseNotes || 'Work completed and expense submitted.', 
                undefined, 
                data.expenseMaterialName
              );
            }
            submitExpense(expensingIssue.id, data);
            setExpensingIssue(null);
          }}
        />
      )}

      {/* ─── REOPEN MODAL ───────────────────────────────────────────────────── */}
      {reopeningIssue && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-orange-500/40 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reopen Complaint</h3>
                  <span className="text-xs text-orange-400 font-semibold">{reopeningIssue.id}</span>
                </div>
              </div>
              <button onClick={() => setReopeningIssue(null)} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">Reason for Reopening</label>
                <textarea rows={3} placeholder="e.g. Fan is still making noise after repair..."
                  value={reopenReason} onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full bg-gray-900 border border-orange-500/30 p-3 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setReopeningIssue(null)} className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-extrabold shadow-lg flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" /> Reopen Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD ISSUE MODAL ─────────────────────────────────────────────────── */}
      {isAddIssueOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Report New Hostel Issue</h3>
                  <span className="text-xs text-purple-400 font-semibold">{wardenHostel} Premises</span>
                </div>
              </div>
              <button onClick={() => setIsAddIssueOpen(false)} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1">Category</label>
                  <select value={newCat} onChange={(e) => {
                    const c = e.target.value as CategoryName;
                    setNewCat(c);
                    const catObj = ISSUE_CATEGORIES.find((cat) => cat.name === c);
                    if (catObj?.subcategories.length) setNewSubCat(catObj.subcategories[0]);
                  }} className="w-full bg-gray-900 border border-purple-500/30 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                    {ISSUE_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1">Sub-Category</label>
                  <select value={newSubCat} onChange={(e) => setNewSubCat(e.target.value)}
                    className="w-full bg-gray-900 border border-purple-500/30 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                    {(ISSUE_CATEGORIES.find((c) => c.name === newCat)?.subcategories || []).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1">Room / Location</label>
                  <input type="text" required value={newRoom} onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="Common Area / Room B-101"
                    className="w-full bg-gray-900 border border-purple-500/30 p-2.5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1">Priority</label>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as IssuePriority)}
                    className="w-full bg-gray-900 border border-purple-500/30 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1">Description</label>
                <textarea rows={3} required value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="w-full bg-gray-900 border border-purple-500/30 p-3 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1.5">Photo (Optional)</label>
                <div className="flex items-center gap-3">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-950/40 hover:bg-purple-900/40 disabled:opacity-50 border border-purple-500/30 text-purple-300 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all">
                    <Camera className="w-4 h-4" />
                    {photoUploading ? `Uploading... ${uploadProgress}%` : photoUrl ? 'Change Photo' : 'Upload Image'}
                  </button>
                  {photoUrl && (
                    <div className="relative w-10 h-10 rounded-xl bg-gray-900 border border-purple-500/30 overflow-hidden shrink-0">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setPhotoUrl('')}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsAddIssueOpen(false)} className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" /> Submit Issue
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
