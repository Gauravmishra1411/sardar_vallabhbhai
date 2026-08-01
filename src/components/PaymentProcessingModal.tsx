'use client';

import React, { useState } from 'react';
import { HostelIssue } from '@/types/auth';
import { X, Landmark, IndianRupee, CreditCard, Upload } from 'lucide-react';

interface Props {
  issue: HostelIssue;
  onClose: () => void;
  onProcessPayment: (paymentData: any) => void;
}

export const PaymentProcessingModal: React.FC<Props> = ({ issue, onClose, onProcessPayment }) => {
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReferenceId, setPaymentReferenceId] = useState('');
  const [proofUploaded, setProofUploaded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onProcessPayment({
      paymentMethod,
      paymentReferenceId: paymentReferenceId.trim(),
      paymentProofUrl: proofUploaded ? 'dummy_payment_proof.jpg' : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-fuchsia-500/40 rounded-3xl max-w-lg w-[95%] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Process Final Payment</h3>
              <span className="text-xs text-fuchsia-400 font-semibold">{issue.id} • {issue.title || issue.category}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-all shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-3 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Approved Expense Amount:</span>
            <span className="text-emerald-400 font-bold text-lg flex items-center">
              <IndianRupee className="w-4 h-4 mr-0.5" />{issue.expenseApprovedAmount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Pay To (Warden):</span>
            <span className="text-white font-medium">{issue.expenseSubmittedBy}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border-t border-gray-800 pt-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" /> Payment Method
            </label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-all"
            >
              <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Transaction ID / Reference Number</label>
            <input 
              type="text" 
              required 
              value={paymentReferenceId}
              onChange={(e) => setPaymentReferenceId(e.target.value)}
              placeholder="e.g. TXN-984321098"
              className="w-full bg-gray-900 border border-gray-700 px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Upload Payment Proof (Optional)</label>
            <button 
              type="button" 
              onClick={() => setProofUploaded(!proofUploaded)}
              className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${proofUploaded ? 'border-fuchsia-500/50 bg-fuchsia-500/10' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'}`}
            >
              <Upload className={`w-6 h-6 mb-2 ${proofUploaded ? 'text-fuchsia-400' : 'text-gray-400'}`} />
              <span className={`text-sm ${proofUploaded ? 'text-fuchsia-300 font-medium' : 'text-gray-400'}`}>
                {proofUploaded ? 'Proof Uploaded (Click to remove)' : 'Upload Receipt Screenshot'}
              </span>
            </button>
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
              className="px-6 py-2 rounded-xl text-sm font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition-all shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_25px_rgba(192,38,211,0.5)]"
            >
              Mark as Paid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
