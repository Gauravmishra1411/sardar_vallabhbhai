'use client';

import React, { useState } from 'react';
import { HostelIssue } from '@/types/auth';
import { X, Receipt, IndianRupee, FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  issue: HostelIssue;
  onClose: () => void;
  onReview: (approved: boolean, remarks: string, approvedAmount?: number) => void;
}

export const ExpenseReviewModal: React.FC<Props> = ({ issue, onClose, onReview }) => {
  const [remarks, setRemarks] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<number | ''>(issue.expenseTotalAmount || '');
  const [status, setStatus] = useState<'Approve' | 'Reject' | 'Correction'>('Approve');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'Approve') {
      onReview(true, remarks.trim(), Number(approvedAmount));
    } else if (status === 'Correction') {
      onReview(false, remarks.trim());
    } else {
      // Rejection could be handled differently, but for now we'll just treat it as a false review
      onReview(false, remarks.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-blue-500/40 rounded-3xl max-w-2xl w-[95%] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Review Expense Claim</h3>
              <span className="text-xs text-blue-400 font-semibold">{issue.id} • {issue.title || issue.category}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-all shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Expense Details
            </h4>
            <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-white font-medium">{issue.expenseCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Material/Part:</span>
                <span className="text-white font-medium">{issue.expenseMaterialName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white font-medium">{issue.expenseQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Unit Price:</span>
                <span className="text-white font-medium">₹{issue.expenseUnitPrice}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700/50">
                <span className="text-gray-300 font-bold">Total Claimed:</span>
                <span className="text-emerald-400 font-bold text-lg">₹{issue.expenseTotalAmount}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-400" /> Vendor & Billing
            </h4>
            <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-3 text-sm h-full">
              <div>
                <span className="text-gray-400 block text-xs mb-1">Vendor Name:</span>
                <span className="text-white font-medium">{issue.expenseVendorName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs mb-1">Invoice/Bill Number:</span>
                <span className="text-white font-medium">{issue.expenseInvoiceNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs mb-1">Submitted By:</span>
                <span className="text-white font-medium">{issue.expenseSubmittedBy || 'Warden'}</span>
              </div>
              {issue.expenseBillPhotoUrl && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium cursor-pointer hover:bg-emerald-500/20">
                  <Receipt className="w-4 h-4" /> View Attached Bill
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border-t border-gray-800 pt-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Review Decision</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('Approve')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${status === 'Approve' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setStatus('Correction')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${status === 'Correction' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
              >
                <AlertTriangle className="w-4 h-4" /> Need Correction
              </button>
              <button
                type="button"
                onClick={() => setStatus('Reject')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${status === 'Reject' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>

          {status === 'Approve' && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Approved Amount (₹)</label>
              <div className="relative">
                <IndianRupee className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" />
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required 
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(parseFloat(e.target.value) || '')}
                  className="w-full bg-gray-900 border border-emerald-500/50 pl-10 pr-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin Remarks / Notes</label>
            <textarea 
              rows={2}
              required={status !== 'Approve'}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={status === 'Approve' ? 'Optional remarks...' : 'Please specify the reason for correction or rejection...'}
              className={`w-full bg-gray-900 border px-3 py-2 rounded-xl text-sm text-white focus:outline-none transition-all ${status === 'Approve' ? 'border-gray-700 focus:border-emerald-500' : status === 'Correction' ? 'border-amber-500/50 focus:border-amber-500' : 'border-rose-500/50 focus:border-rose-500'}`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                status === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                status === 'Correction' ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' :
                'bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
              }`}
            >
              {status === 'Approve' ? 'Approve & Forward to Payment' : `Submit ${status}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
