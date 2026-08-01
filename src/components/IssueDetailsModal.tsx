'use client';

import React from 'react';
import { HostelIssue, IssueStatus, FinancialStatus, ISSUE_CATEGORIES } from '@/types/auth';
import { X, CheckCircle2, Clock, AlertTriangle, User, MapPin, Phone, Calendar, ShieldCheck, Wrench, Star, CircleDot, CheckCheck, RefreshCw, Camera } from 'lucide-react';

interface Props {
  issue: HostelIssue | null;
  onClose: () => void;
}

// New 5-stage physical workflow
const STAGES: { status: IssueStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'New', label: 'New', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { status: 'Assigned', label: 'Assigned', icon: <Wrench className="w-3.5 h-3.5" /> },
  { status: 'In Progress', label: 'In Progress', icon: <CircleDot className="w-3.5 h-3.5" /> },
  { status: 'Work Completed', label: 'Work Done', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { status: 'Completed', label: 'Closed', icon: <CheckCheck className="w-3.5 h-3.5" /> },
];

const STATUS_COLORS: Record<IssueStatus, string> = {
  'New': 'text-amber-400 bg-amber-950/80 border-amber-500/40',
  'Assigned': 'text-blue-400 bg-blue-950/80 border-blue-500/40',
  'In Progress': 'text-purple-400 bg-purple-950/80 border-purple-500/40',
  'Work Completed': 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40',
  'Completed': 'text-gray-400 bg-gray-800/80 border-gray-600/40',
  'Closed': 'text-gray-500 bg-gray-900/80 border-gray-700/40',
};

const FINANCIAL_STAGES: { status: FinancialStatus; label: string }[] = [
  { status: 'Expense Submitted', label: 'Submitted' },
  { status: 'Expense Approved', label: 'Approved' },
  { status: 'Payment Processing', label: 'Processing' },
  { status: 'Payment Completed', label: 'Paid' },
];

export const IssueDetailsModal: React.FC<Props> = ({ issue, onClose }) => {
  if (!issue) return null;

  const catObj = ISSUE_CATEGORIES.find((c) => c.name === issue.category);

  const getCurrentStageIndex = (): number => {
    return STAGES.findIndex((s) => s.status === issue.status);
  };

  const currentIndex = getCurrentStageIndex();

  const getFinancialStageIndex = (): number => {
    return FINANCIAL_STAGES.findIndex((s) => s.status === issue.financialStatus);
  };
  
  const currentFinIndex = getFinancialStageIndex();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-indigo-500/30 rounded-3xl max-w-2xl w-[95%] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 my-4">
        
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl shrink-0">
              {catObj?.icon || '🏢'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">{issue.id}</span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  issue.priority === 'Urgent' ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                  issue.priority === 'High' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                  issue.priority === 'Medium' ? 'bg-blue-950 text-blue-300 border-blue-500/40' :
                  'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                }`}>
                  {issue.priority} Priority
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[issue.status]}`}>
                  {issue.status}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white mt-0.5">{issue.subCategory}</h2>
              <p className="text-xs text-gray-500">{issue.category}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 5-Stage Progress Stepper ─────────────────────────────────── */}
        <div className="my-5 p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Complaint Lifecycle
          </h4>
          <div className="flex items-center justify-between">
            {STAGES.map((stage, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isFuture = idx > currentIndex;
              return (
                <React.Fragment key={stage.status}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 scale-110 shadow-lg shadow-indigo-600/30'
                        : isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-800 text-gray-600'
                    }`}>
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : stage.icon}
                    </div>
                    <span className={`text-[9px] font-bold leading-tight text-center ${
                      isCurrent ? 'text-indigo-400' : isPassed ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${isPassed ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Financial Progress Tracker (Only show if expense exists) */}
          {issue.financialStatus !== 'None' && (
            <div className="mt-6 pt-4 border-t border-gray-800">
              <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">Financial Status</h5>
              <div className="flex items-center justify-between relative px-2">
                {FINANCIAL_STAGES.map((stage, idx) => {
                  const isCurrent = currentFinIndex === idx;
                  const isPassed = currentFinIndex > idx || issue.financialStatus === 'Payment Completed';
                  
                  // Handle "Correction Needed" case which isn't strictly linear
                  const isError = issue.financialStatus === 'Correction Needed' && idx === 0;

                  return (
                    <React.Fragment key={stage.status}>
                      <div className="flex flex-col items-center gap-1.5 relative z-10 w-14">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isCurrent && !isError
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30 shadow-md shadow-emerald-600/30'
                            : isError
                            ? 'bg-rose-500 text-white ring-2 ring-rose-500/30'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-800 border border-gray-700'
                        }`} />
                        <span className={`text-[8px] font-bold leading-tight text-center ${
                          isError ? 'text-rose-400' : isCurrent ? 'text-emerald-400' : isPassed ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {isError ? 'Correction' : stage.label}
                        </span>
                      </div>
                      {idx < FINANCIAL_STAGES.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${isPassed && !isError ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Info Grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Student Info */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">Student Information</div>
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-semibold text-white">{issue.studentName}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div>{issue.hostelName} — Room {issue.roomNumber}</div>
                {(issue.hostelBlock || issue.hostelFloor || issue.exactLocation) && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {[issue.hostelBlock, issue.hostelFloor, issue.exactLocation].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{issue.mobileNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Submitted: {new Date(issue.createdAt).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">Assignment Details</div>
            <div className="flex items-center gap-2 text-gray-300">
              <Wrench className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Staff: <strong className="text-white">{issue.assignedStaffName || 'Not Assigned Yet'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Department: <strong className="text-white">{issue.department || 'Pending Assignment'}</strong></span>
            </div>
            {issue.problemType && (
              <div className="flex items-center gap-2 text-gray-300">
                <AlertTriangle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Problem Type: <strong className="text-white">{issue.problemType}</strong></span>
              </div>
            )}
            {issue.slaTime && (
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Expected Resolution: <strong className="text-amber-300">{issue.slaTime}</strong></span>
              </div>
            )}
            {issue.priorityReason && (
              <div className="flex items-start gap-2 text-gray-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-rose-300 font-bold text-[10px] uppercase tracking-wider block">Priority Reason</span>
                  <span className="text-gray-300 leading-tight">{issue.priorityReason}</span>
                </div>
              </div>
            )}
            {issue.assignedBy && (
              <div className="flex items-center gap-2 text-gray-300">
                <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Assigned by: <strong className="text-white">{issue.assignedBy}</strong></span>
              </div>
            )}
            {issue.assignedAt && (
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Assigned: {new Date(issue.assignedAt).toLocaleString('en-IN')}</span>
              </div>
            )}
            {!issue.assignedStaffName && (
              <div className="text-amber-400 text-[10px] font-semibold">⏳ Awaiting staff assignment</div>
            )}
          </div>
        </div>

        {/* ─── Description ─────────────────────────────────────────────── */}
        <div className="mt-4 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Complaint Description</h5>
          <p className="text-xs text-gray-200 leading-relaxed">{issue.description}</p>
        </div>

        {/* ─── Admin Instruction / Assignment Note ────────────────────────── */}
        {issue.assignmentNote && (
          <div className="mt-3 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Admin Instruction: </span>
            <span className="text-xs text-blue-200">{issue.assignmentNote}</span>
          </div>
        )}

        {/* ─── Complaint Photos ──────────────────────────────────────────── */}
        {(issue.photoUrls?.length ? issue.photoUrls : issue.photoUrl ? [issue.photoUrl] : []).length > 0 && (
          <div className="mt-3">
            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Complaint Photos
            </h5>
            <div className={`grid gap-2 ${
              (issue.photoUrls?.length || 1) === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'
            }`}>
              {(issue.photoUrls?.length ? issue.photoUrls : issue.photoUrl ? [issue.photoUrl] : []).map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-gray-700">
                  <img src={url} alt={`Complaint ${idx + 1}`} className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-[10px] font-bold bg-black/60 px-2 py-1 rounded">View Full</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ─── Resolution Info ─────────────────────────────────────────── */}
        {issue.resolvedNote && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
            <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolution Details
            </h5>
            <p className="text-xs text-emerald-200 leading-relaxed">{issue.resolvedNote}</p>
            {issue.materialsUsed && (
              <p className="text-xs text-emerald-300/80 mt-1">Materials: {issue.materialsUsed}</p>
            )}
            <div className="text-[10px] text-emerald-500 mt-2">
              {issue.resolvedBy && `Work completed by: ${issue.resolvedBy}`}
              {issue.resolvedAt && ` • ${new Date(issue.resolvedAt).toLocaleString('en-IN')}`}
            </div>
            {issue.resolvedPhotoUrl && (
              <img src={issue.resolvedPhotoUrl} alt="Resolution" className="rounded-xl border border-emerald-800 max-h-40 object-cover w-full mt-2" />
            )}
          </div>
        )}

        {/* ─── Financial / Expense Info ────────────────────────────────── */}
        {issue.expenseTotalAmount !== undefined && (
          <div className="mt-4 p-4 rounded-xl bg-blue-950/30 border border-blue-500/30">
            <h5 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-3">Expense Details</h5>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div className="text-gray-400">Material/Part:</div>
              <div className="text-white font-medium">{issue.expenseMaterialName} ({issue.expenseQuantity})</div>
              
              <div className="text-gray-400">Total Claimed:</div>
              <div className="text-white font-medium">₹{issue.expenseTotalAmount}</div>
              
              {issue.expenseApprovedAmount !== undefined && (
                <>
                  <div className="text-gray-400">Approved Amount:</div>
                  <div className="text-emerald-400 font-bold">₹{issue.expenseApprovedAmount}</div>
                </>
              )}
              
              {issue.expenseAdminRemarks && (
                <>
                  <div className="text-gray-400">Admin Remarks:</div>
                  <div className="text-gray-300 italic">{issue.expenseAdminRemarks}</div>
                </>
              )}
              
              {issue.paymentReferenceId && (
                <>
                  <div className="text-gray-400 mt-2">Payment Ref:</div>
                  <div className="text-white font-medium mt-2">{issue.paymentReferenceId}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── Closure Info ────────────────────────────────────────────── */}
        {issue.closedBy && (
          <div className="mt-3 p-3 rounded-xl bg-gray-800/60 border border-gray-600/30">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" /> Closed by: {issue.closedBy}
              {issue.closedAt && ` on ${new Date(issue.closedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`}
            </span>
          </div>
        )}

        {/* ─── Reopen Info ─────────────────────────────────────────────── */}
        {issue.reopenReason && (
          <div className="mt-3 p-3 rounded-xl bg-orange-950/40 border border-orange-500/30">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Reopened:
            </span>
            <p className="text-xs text-orange-200 mt-1">{issue.reopenReason}</p>
            {issue.reopenedBy && <p className="text-[10px] text-orange-500 mt-0.5">by {issue.reopenedBy} {issue.reopenedAt && `• ${new Date(issue.reopenedAt).toLocaleDateString()}`}</p>}
          </div>
        )}

        {/* ─── Remarks ─────────────────────────────────────────────────── */}
        {(issue.wardenRemarks || issue.adminRemarks) && (
          <div className="mt-3 space-y-2 text-xs">
            {issue.wardenRemarks && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200">
                <span className="font-bold text-purple-400">Warden Remarks: </span>{issue.wardenRemarks}
              </div>
            )}
            {issue.adminRemarks && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                <span className="font-bold text-indigo-400">Admin Remarks: </span>{issue.adminRemarks}
              </div>
            )}
          </div>
        )}

        {/* ─── Complaint History ────────────────────────────────────────── */}
        {issue.history && issue.history.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Complaint History
            </h5>
            <div className="space-y-2">
              {[...issue.history].reverse().map((entry, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-[11px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-300">{entry.status}</span>
                    <span className="text-gray-500"> by </span>
                    <span className="text-gray-300 font-medium">{entry.updatedBy}</span>
                    <span className="text-gray-600 ml-2">{new Date(entry.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    {entry.remarks && <p className="text-gray-500 mt-0.5 italic">{entry.remarks}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Student Rating ───────────────────────────────────────────── */}
        {issue.rating && (
          <div className="mt-4 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30">
            <div className="flex items-center gap-1 text-amber-400 font-bold text-xs mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < issue.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
              ))}
              <span className="ml-2 text-white font-bold">{issue.rating}/5 Stars</span>
            </div>
            {issue.feedbackText && <p className="text-xs text-amber-200 italic">"{issue.feedbackText}"</p>}
          </div>
        )}

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
