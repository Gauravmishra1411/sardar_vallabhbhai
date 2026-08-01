'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
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
  Pencil,
  Trash2,
  Lock,
  History,
} from 'lucide-react';
import { ChatLayout } from '@/components/chat/ChatLayout';

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

function WardenDashboardContent() {
  const { currentUser, issues, users, assignWork, completePhysicalWork, submitExpense, closeComplaint, reopenComplaint, createIssue, editGrievance, deleteGrievance } = useAuth();
  const searchParams = useSearchParams();

  const [selectedIssue, setSelectedIssue] = useState<HostelIssue | null>(null);
  const [assigningIssue, setAssigningIssue] = useState<HostelIssue | null>(null);
  const [expensingIssue, setExpensingIssue] = useState<HostelIssue | null>(null);
  const [reopeningIssue, setReopeningIssue] = useState<HostelIssue | null>(null);
  const [editingIssue, setEditingIssue] = useState<HostelIssue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<HostelIssue | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [activeTab, setActiveTab] = useState<'issues' | 'messages'>('issues');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  // Edit form state
  const [editCat, setEditCat] = useState<CategoryName>('Electricity');
  const [editSubCat, setEditSubCat] = useState<string>('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<IssuePriority>('Medium');
  const [editRoom, setEditRoom] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  // Add Issue state
  const [isAddIssueOpen, setIsAddIssueOpen] = useState(false);
  const [newCat, setNewCat] = useState<CategoryName>('Electricity');
  const [newSubCat, setNewSubCat] = useState<string>('Fan Not Working');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<IssuePriority>('Medium');
  const [newRoom, setNewRoom] = useState('');
  const [newHostel, setNewHostel] = useState(currentUser?.hostelName || SVPUAT_HOSTELS[0]);
  const [newMobile, setNewMobile] = useState(currentUser?.mobileNumber || '');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
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

  // Active issues (non-deleted) for the main list
  const activeIssues = issues.filter((i) => !i.deleted);

  // All issues for history (active = green, deleted = red)
  const allHistoryIssues = [...issues].sort((a, b) => {
    // Deleted issues go to bottom
    if (a.deleted && !b.deleted) return 1;
    if (!a.deleted && b.deleted) return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredHistoryIssues = historySearch
    ? allHistoryIssues.filter((i) =>
        i.id.toLowerCase().includes(historySearch.toLowerCase()) ||
        i.category.toLowerCase().includes(historySearch.toLowerCase()) ||
        i.studentName.toLowerCase().includes(historySearch.toLowerCase()) ||
        (i.deletedBy || '').toLowerCase().includes(historySearch.toLowerCase())
      )
    : allHistoryIssues;

  // Warden sees only active (non-deleted) issues in main list
  const filteredIssues = activeIssues.filter((i) => {
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
    New: activeIssues.filter((i) => i.status === 'New').length,
    Assigned: activeIssues.filter((i) => i.status === 'Assigned').length,
    'In Progress': activeIssues.filter((i) => i.status === 'In Progress').length,
    'Work Completed': activeIssues.filter((i) => i.status === 'Work Completed').length,
    Completed: activeIssues.filter((i) => i.status === 'Completed').length,
  };

  const deletedCount = issues.filter((i) => i.deleted).length;

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopeningIssue) return;
    reopenComplaint(reopeningIssue.id, reopenReason.trim() || 'Complaint reopened for further review.');
    setReopeningIssue(null);
    setReopenReason('');
  };

  const openEditModal = (iss: HostelIssue) => {
    setEditCat(iss.category);
    setEditSubCat(iss.subCategory);
    setEditDesc(iss.description);
    setEditPriority(iss.priority);
    setEditRoom(iss.roomNumber);
    setEditPhotoUrl(iss.photoUrl || '');
    setEditingIssue(iss);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue) return;
    const result = editGrievance(editingIssue.id, {
      category: editCat,
      subCategory: editSubCat,
      description: editDesc,
      priority: editPriority,
      roomNumber: editRoom,
      photoUrl: editPhotoUrl || undefined,
    });
    if (result.success) setEditingIssue(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingIssue) return;
    deleteGrievance(deletingIssue.id);
    setDeletingIssue(null);
  };

  // Permission helper
  const canEditOrDelete = (iss: HostelIssue) =>
    !iss.adminApproved && (iss.status === 'New' || iss.status === 'Assigned' || iss.status === 'In Progress' || iss.status === 'Work Completed');

  const openAssignModal = (iss: HostelIssue) => {
    setAssigningIssue(iss);
  };

  const openExpenseModal = (iss: HostelIssue) => {
    setExpensingIssue(iss);
  };

  // ─── Multi-photo upload to Cloudinary ────────────────────────────────────
  const compressImage = (base64Str: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > 1200) { height = Math.round((height * 1200) / width); width = 1200; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.75)); }
        else resolve(base64Str);
      };
      img.onerror = () => resolve(base64Str);
    });

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddthlutz4';
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'univercity';

    // Read + compress
    const base64 = await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => res(e.target?.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    const compressed = await compressImage(base64);

    // Build form data
    const b64 = compressed.split(',')[1];
    const mime = compressed.split(';')[0].split(':')[1] || 'image/jpeg';
    const blob = new Blob([new Uint8Array(atob(b64).split('').map((c) => c.charCodeAt(0)))], { type: mime });
    const fd = new FormData();
    fd.append('file', blob, `warden-issue-${Date.now()}.jpg`);
    fd.append('upload_preset', preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: fd,
    });

    if (!res.ok) {
      // Fallback: use base64 local preview if Cloudinary fails
      console.warn('[Upload] Cloudinary upload failed, using local preview');
      return compressed;
    }
    const json = await res.json();
    return json.secure_url as string;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    // Limit to 5 total
    const remaining = 5 - photoUrls.length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) {
      return;
    }

    setUploadingCount((c) => c + toUpload.length);

    // Upload all in parallel
    const results = await Promise.allSettled(toUpload.map(uploadToCloudinary));
    const uploaded: string[] = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value);

    setPhotoUrls((prev) => [...prev, ...uploaded]);
    setUploadingCount((c) => c - toUpload.length);

    // Reset the input so same files can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
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
      photoUrls: photoUrls.length ? photoUrls : undefined,
      photoUrl: photoUrls[0],
    });
    if (res.success) {
      setIsAddIssueOpen(false);
      setNewDesc(''); setPhotoUrls([]); setNewRoom('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-purple-500/20 bg-[#070a12]/80 backdrop-blur-md px-6 md:px-8 flex items-center justify-between rounded-2xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-purple-400 font-bold text-base">Warden Desk</span>
          <span className="text-gray-600">/</span>
          <span className="text-white text-xs capitalize font-semibold">{activeTab}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('issues')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'issues' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Issues</button>
          <button onClick={() => setActiveTab('messages')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'messages' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Messages</button>
          <button
            onClick={() => setIsAddIssueOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Report Issue
          </button>
          {/* History Button */}
          <button
            onClick={() => { setIsHistoryOpen(true); setHistorySearch(''); }}
            className="relative px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-gray-700/50 transition-all"
            title="View all grievances history"
          >
            <History className="w-4 h-4" /> History
            {deletedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {deletedCount}
              </span>
            )}
          </button>
          <NotificationCenter />
          <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Verified Authority
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {activeTab === 'issues' && (
          <>
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

                            {/* Admin Approved Lock Badge */}
                            {iss.adminApproved && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[9px] font-black flex items-center gap-1 uppercase tracking-wide">
                                <Lock className="w-3 h-3" /> Admin Approved
                              </span>
                            )}

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

                            {/* Details Button — always visible */}
                            <button
                              onClick={() => setSelectedIssue(iss)}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
                            </button>

                            {/* Edit Button — only if not admin-approved */}
                            {canEditOrDelete(iss) && (
                              <button
                                onClick={() => openEditModal(iss)}
                                className="px-3 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                                title="Edit this grievance"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                            )}

                            {/* Delete Button — only if not admin-approved */}
                            {canEditOrDelete(iss) && (
                              <button
                                onClick={() => setDeletingIssue(iss)}
                                className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                                title="Delete this grievance"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}

                            {/* Locked message when admin-approved */}
                            {iss.adminApproved && (
                              <p className="text-[10px] text-emerald-500/70 text-right max-w-[140px] leading-tight">
                                🔒 Approved by Admin — view only
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── TAB: MESSAGES ────────────────────────────────────────────── */}
        {activeTab === 'messages' && (
          <div className="h-full pt-4">
            <ChatLayout />
          </div>
        )}
      </main>

      {/* ─── DELETE CONFIRMATION MODAL ───────────────────────────────────────── */}
      {deletingIssue && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Grievance</h3>
                <span className="text-xs text-rose-400 font-semibold">{deletingIssue.id}</span>
                <p className="text-sm text-gray-400 mt-2">
                  Are you sure you want to delete this grievance? This action cannot be undone.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  &quot;{deletingIssue.category} — {deletingIssue.subCategory}&quot;
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
              <button
                onClick={() => setDeletingIssue(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT ISSUE MODAL ────────────────────────────────────────────────── */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-blue-500/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Grievance</h3>
                  <span className="text-xs text-blue-400 font-semibold">{editingIssue.id}</span>
                </div>
              </div>
              <button onClick={() => setEditingIssue(null)} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block mb-1">Category</label>
                  <select value={editCat} onChange={(e) => {
                    const c = e.target.value as CategoryName;
                    setEditCat(c);
                    const catObj = ISSUE_CATEGORIES.find((cat) => cat.name === c);
                    if (catObj?.subcategories.length) setEditSubCat(catObj.subcategories[0]);
                  }} className="w-full bg-gray-900 border border-blue-500/30 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500">
                    {ISSUE_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block mb-1">Sub-Category</label>
                  <select value={editSubCat} onChange={(e) => setEditSubCat(e.target.value)}
                    className="w-full bg-gray-900 border border-blue-500/30 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500">
                    {(ISSUE_CATEGORIES.find((c) => c.name === editCat)?.subcategories || []).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block mb-1">Room / Location</label>
                  <input type="text" value={editRoom} onChange={(e) => setEditRoom(e.target.value)}
                    placeholder="Common Area / Room B-101"
                    className="w-full bg-gray-900 border border-blue-500/30 p-2.5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block mb-1">Priority</label>
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as IssuePriority)}
                    className="w-full bg-gray-900 border border-blue-500/30 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block mb-1">Description</label>
                <textarea rows={4} required value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="w-full bg-gray-900 border border-blue-500/30 p-3 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setEditingIssue(null)} className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5">
                  <Pencil className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1.5">
                  Photos (Optional — Max 5)
                </label>
                <div className="space-y-3">
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handlePhotoUpload} 
                  />
                  
                  {photoUrls.length < 5 && (
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={uploadingCount > 0}
                      className="w-full flex items-center justify-center gap-2 bg-purple-950/40 hover:bg-purple-900/40 disabled:opacity-50 border border-purple-500/30 border-dashed text-purple-300 text-xs font-semibold py-3 rounded-xl transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      {uploadingCount > 0 ? `Uploading ${uploadingCount} image(s)...` : 'Select Images'}
                    </button>
                  )}

                  {/* Image Grid */}
                  {photoUrls.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {photoUrls.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl bg-gray-900 border border-purple-500/30 overflow-hidden shrink-0 group">
                          <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removePhoto(idx)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
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

      {/* ─── HISTORY PANEL ───────────────────────────────────────────────────── */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-end">
          <div className="h-full w-full max-w-2xl bg-[#0b0f1c] border-l border-purple-500/20 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-[#070a12]/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center">
                  <History className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white">Grievance History</h2>
                  <p className="text-[10px] text-gray-500">{issues.length} total · {activeIssues.length} active · {deletedCount} deleted</p>
                </div>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-800/50 bg-black/20 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500/70 border border-emerald-400/50"></span>
                <span className="text-[10px] text-emerald-400 font-semibold">Active Grievances</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/70 border border-rose-400/50"></span>
                <span className="text-[10px] text-rose-400 font-semibold">Deleted Grievances</span>
              </div>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-800/50 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by ID, category, reporter..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 pl-9 pr-4 py-2 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Issue List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
              {filteredHistoryIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                  <History className="w-8 h-8 text-gray-700" />
                  <p className="text-xs text-gray-500">No grievances found in history.</p>
                </div>
              ) : (
                filteredHistoryIssues.map((iss) => {
                  const isDeleted = iss.deleted === true;
                  const catObj = ISSUE_CATEGORIES.find((c) => c.name === iss.category);
                  const statusCfg = STATUS_CONFIG[iss.status] || STATUS_CONFIG['New'];

                  return (
                    <div
                      key={iss.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDeleted
                          ? 'bg-rose-950/20 border-rose-500/25 hover:border-rose-500/40'
                          : 'bg-emerald-950/15 border-emerald-500/20 hover:border-emerald-500/35'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                          isDeleted ? 'bg-rose-950/60 border-rose-500/30' : 'bg-emerald-950/60 border-emerald-500/30'
                        }`}>
                          {isDeleted ? '🗑️' : (catObj?.icon || '🏢')}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={`text-xs font-black ${isDeleted ? 'text-rose-400' : 'text-emerald-400'}`}>{iss.id}</span>
                            {/* Status Badge */}
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                              {statusCfg.icon} {statusCfg.label}
                            </span>
                            {/* Deleted Badge */}
                            {isDeleted && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-rose-950 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
                                <Trash2 className="w-2.5 h-2.5" /> Deleted
                              </span>
                            )}
                            {/* Admin Approved Badge */}
                            {iss.adminApproved && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Approved
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-bold text-white">{iss.category} — {iss.subCategory}</p>
                          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{iss.description}</p>

                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-gray-500">
                            <span>👤 <strong className="text-gray-400">{iss.studentName}</strong></span>
                            <span>🏠 {iss.hostelName} — Room {iss.roomNumber}</span>
                            <span>🗓 {new Date(iss.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>

                          {/* Deleted Info */}
                          {isDeleted && iss.deletedAt && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-400/80">
                              <Trash2 className="w-3 h-3" />
                              Deleted by <strong className="text-rose-300">{iss.deletedBy || 'Warden'}</strong> on {new Date(iss.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>

                        {/* Details button */}
                        <button
                          onClick={() => { setSelectedIssue(iss); setIsHistoryOpen(false); }}
                          className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer summary */}
            <div className="px-6 py-3 border-t border-gray-800/50 bg-black/20 shrink-0 flex items-center justify-between">
              <span className="text-[10px] text-gray-600">
                Showing {filteredHistoryIssues.length} of {issues.length} records
              </span>
              <button onClick={() => setIsHistoryOpen(false)} className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WardenDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f3e8ff] flex items-center justify-center text-purple-900">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm text-purple-700 font-medium">Loading Warden Dashboard...</p>
          </div>
        </div>
      }
    >
      <WardenDashboardContent />
    </Suspense>
  );
}
