'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HostelIssue, IssuePriority, IssueStatus, ISSUE_CATEGORIES, DEPARTMENTS } from '@/types/auth';
import { SVPUAT_HOSTELS } from '@/constants/hostels';
import { NotificationCenter } from '@/components/NotificationCenter';
import { IssueDetailsModal } from '@/components/IssueDetailsModal';
import { AssignWorkModal } from '@/components/AssignWorkModal';
import { ExpenseReviewModal } from '@/components/ExpenseReviewModal';
import { PaymentProcessingModal } from '@/components/PaymentProcessingModal';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Wrench,
  BarChart3,
  Search,
  LogOut,
  UserCheck,
  FileSpreadsheet,
  X,
  AlertTriangle,
  RefreshCw,
  Eye,
  CircleDot,
  CheckCheck,
  Camera,
  Receipt,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
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

function AdminDashboardContent() {
  const { currentUser, issues, users, assignWork, closeComplaint, reopenComplaint, reviewExpense, processPayment, markIssueCompleted, approveGrievance, logout } = useAuth();
  const searchParams = useSearchParams();

  const [selectedIssue, setSelectedIssue] = useState<HostelIssue | null>(null);
  const [assigningIssue, setAssigningIssue] = useState<HostelIssue | null>(null);
  const [reviewingExpenseIssue, setReviewingExpenseIssue] = useState<HostelIssue | null>(null);
  const [processingPaymentIssue, setProcessingPaymentIssue] = useState<HostelIssue | null>(null);
  const [reopeningIssue, setReopeningIssue] = useState<HostelIssue | null>(null);
  const [activeTab, setActiveTab] = useState<'issues' | 'reports' | 'users' | 'messages'>('issues');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hostelFilter, setHostelFilter] = useState('All');
  const [reopenReason, setReopenReason] = useState('');

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

  const uniqueHostels = Array.from(new Set(issues.map((i) => i.hostelName).filter(Boolean)));

  const filteredIssues = issues.filter((i) => {
    const matchesSearch =
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.assignedStaffName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesHostel = hostelFilter === 'All' || i.hostelName.toLowerCase() === hostelFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || i.status === statusFilter;

    return matchesSearch && matchesHostel && matchesStatus;
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

  return (
    <>
      {/* ─── Main Viewport ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-purple-500/20 bg-[#070a12]/80 backdrop-blur-md px-6 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-purple-400 font-bold text-base">SVPUAT Admin</span>
            <span className="text-gray-600">/</span>
            <span className="text-white text-xs capitalize font-semibold">{activeTab}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('messages')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'messages' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Messages</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Staff</button>
            <NotificationCenter />
            <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold">
              System Active
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* ─── Stat Cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.entries(counts) as [string, number][]).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status as IssueStatus];
              return (
                <button
                  key={status}
                  onClick={() => { setActiveTab('issues'); setStatusFilter(status); }}
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

          {/* ─── TAB: ISSUES ──────────────────────────────────────────────── */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              {/* Filters */}
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

                <div className="relative w-full sm:w-44">
                  <Building2 className="w-4 h-4 text-purple-400 absolute left-3 top-2.5 pointer-events-none" />
                  <select
                    value={hostelFilter}
                    onChange={(e) => setHostelFilter(e.target.value)}
                    className="w-full bg-gray-900 border border-purple-500/30 pl-9 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                  >
                    <option value="All">All Hostels</option>
                    {uniqueHostels.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {(['All', 'New', 'Assigned', 'In Progress', 'Work Completed', 'Completed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === st
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grievance Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                  Hostel Grievances & Assignments ({filteredIssues.length})
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
                          {/* Card Top Row */}
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-2xl shrink-0 cursor-pointer" onClick={() => setSelectedIssue(iss)}>
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
                                  onClick={() => setSelectedIssue(iss)}
                                  className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                                >
                                  <CircleDot className="w-4 h-4" /> View Progress
                                </button>
                              )}

                              {iss.financialStatus === 'Expense Submitted' && (
                                <button
                                  onClick={() => setReviewingExpenseIssue(iss)}
                                  className="px-4 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                                >
                                  <Receipt className="w-4 h-4" /> Review Expense
                                </button>
                              )}

                              {iss.financialStatus === 'Expense Approved' && (
                                <button
                                  onClick={() => setProcessingPaymentIssue(iss)}
                                  className="px-4 py-2 rounded-xl bg-fuchsia-950/60 hover:bg-fuchsia-900/60 text-fuchsia-300 border border-fuchsia-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                                >
                                  <Landmark className="w-4 h-4" /> Process Payment
                                </button>
                              )}

                              {iss.status === 'Work Completed' && (iss.financialStatus === 'None' || iss.financialStatus === 'Payment Completed') && (
                                <button
                                  onClick={() => markIssueCompleted(iss.id)}
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

                              {/* Admin Approve Grievance Button */}
                              {!iss.adminApproved ? (
                                <button
                                  onClick={() => approveGrievance(iss.id)}
                                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all border border-emerald-500/50"
                                  title="Approve this grievance — locks it from Warden edits"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Approve Grievance
                                </button>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[9px] font-black flex items-center gap-1 uppercase tracking-wide">
                                  <CheckCircle2 className="w-3 h-3" /> Admin Approved
                                </span>
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
            </div>
          )}

          {/* ─── EXPENSE REVIEW MODAL ─────────────────────────────────────── */}
          {reviewingExpenseIssue && (
            <ExpenseReviewModal
              issue={reviewingExpenseIssue}
              onClose={() => setReviewingExpenseIssue(null)}
              onReview={(approved, remarks, approvedAmount) => {
                reviewExpense(reviewingExpenseIssue.id, approved, remarks, approvedAmount);
                setReviewingExpenseIssue(null);
              }}
            />
          )}

          {/* ─── PAYMENT PROCESSING MODAL ─────────────────────────────────── */}
          {processingPaymentIssue && (
            <PaymentProcessingModal
              issue={processingPaymentIssue}
              onClose={() => setProcessingPaymentIssue(null)}
              onProcessPayment={(paymentData) => {
                processPayment(processingPaymentIssue.id, paymentData);
                setProcessingPaymentIssue(null);
              }}
            />
          )}

          {/* ─── TAB: REPORTS ─────────────────────────────────────────────── */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                      SVPUAT Grievance Reports & Analytics
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Category-wise, Hostel-wise breakdown and resolution times.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Status breakdown */}
                  <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">Status Breakdown</h4>
                    {Object.entries(counts).map(([status, count]) => {
                      const cfg = STATUS_CONFIG[status as IssueStatus] || STATUS_CONFIG['New'];
                      return (
                        <div key={status} className="flex items-center justify-between text-xs">
                          <span className={`flex items-center gap-1.5 ${cfg.color} font-medium`}>{cfg.icon} {status}</span>
                          <span className={`font-bold ${cfg.bg} ${cfg.color} border ${cfg.border} px-2 py-0.5 rounded`}>{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Category breakdown */}
                  <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">Category-Wise</h4>
                    {ISSUE_CATEGORIES.slice(0, 6).map((cat) => {
                      const count = issues.filter((i) => i.category === cat.name).length;
                      return (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span className="text-gray-300 font-medium">{cat.name}</span>
                          </span>
                          <span className="font-bold text-white bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hostel breakdown */}
                  <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">Hostel-Wise</h4>
                    {SVPUAT_HOSTELS.map((h) => {
                      const count = issues.filter((i) => i.hostelName.toLowerCase() === h.toLowerCase()).length;
                      return (
                        <div key={h} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300 font-medium truncate max-w-[120px]">{h}</span>
                          <span className="font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                Registered System Users ({users.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div key={u.id} className="p-4 rounded-2xl bg-gray-900/80 border border-purple-500/20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                      {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : (u.name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{u.name}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                      <div className="flex gap-1 mt-1">
                        <span className="inline-block text-[9px] uppercase font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded">{u.role}</span>
                        {u.department && <span className="inline-block text-[9px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{u.department}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB: MESSAGES ────────────────────────────────────────────── */}
          {activeTab === 'messages' && (
            <div className="h-full pt-4">
              <ChatLayout />
            </div>
          )}
        </main>
      </div>

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
                <textarea
                  rows={3}
                  placeholder="e.g. Fan is still making noise after repair..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full bg-gray-900 border border-orange-500/30 p-3 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setReopeningIssue(null)} className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-extrabold shadow-lg flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" /> Reopen Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <IssueDetailsModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading Admin Dashboard...</p>
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
