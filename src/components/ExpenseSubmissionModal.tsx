'use client';

import React, { useState } from 'react';
import { HostelIssue } from '@/types/auth';
import { X, Receipt, Upload, IndianRupee, Info } from 'lucide-react';

interface Props {
  issue: HostelIssue;
  onClose: () => void;
  onSubmit: (expenseData: any) => void;
}

export const ExpenseSubmissionModal: React.FC<Props> = ({ issue, onClose, onSubmit }) => {
  const [expenseCategory, setExpenseCategory] = useState('Maintenance/Repairs');
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  
  // Dummy state for image upload (since we are doing local testing)
  const [billUploaded, setBillUploaded] = useState(false);

  const totalAmount = (quantity * (Number(unitPrice) || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitPrice || Number(unitPrice) <= 0) return;

    onSubmit({
      expenseCategory,
      expenseMaterialName: materialName.trim(),
      expenseQuantity: quantity,
      expenseUnitPrice: Number(unitPrice),
      expenseTotalAmount: totalAmount,
      expenseVendorName: vendorName.trim(),
      expenseInvoiceNumber: invoiceNumber.trim(),
      expensePaymentMethod: paymentMethod,
      expenseNotes: notes.trim(),
      expenseBillPhotoUrl: billUploaded ? 'dummy_bill_url.jpg' : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Submit Work Expense</h3>
              <span className="text-xs text-emerald-400 font-semibold">{issue.id} • {issue.title || issue.category}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-all shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Expense Category</label>
              <select 
                value={expenseCategory} 
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Maintenance/Repairs">Maintenance/Repairs</option>
                <option value="Plumbing Parts">Plumbing Parts</option>
                <option value="Electrical Components">Electrical Components</option>
                <option value="Service Charge">Service Charge (Labor)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Material/Part Name</label>
              <input 
                type="text" 
                required 
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="e.g. Ceiling Fan Capacitor"
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Quantity</label>
              <input 
                type="number" 
                min="1" 
                required 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Unit Price (₹)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                required 
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || '')}
                placeholder="0.00"
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Vendor/Supplier Name</label>
              <input 
                type="text" 
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Sharma Hardware"
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Invoice/Bill Number</label>
              <input 
                type="text" 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-9982"
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
            <div className="text-gray-400 text-sm font-medium">Total Expense Amount:</div>
            <div className="text-2xl font-bold text-white flex items-center">
              <IndianRupee className="w-5 h-5 mr-1 text-emerald-400" />
              {totalAmount.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Additional Notes (Optional)</label>
            <textarea 
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any comments for the admin reviewer..."
              className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Upload Bill/Invoice Image</label>
            <button 
              type="button" 
              onClick={() => setBillUploaded(!billUploaded)}
              className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${billUploaded ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'}`}
            >
              <Upload className={`w-6 h-6 mb-2 ${billUploaded ? 'text-emerald-400' : 'text-gray-400'}`} />
              <span className={`text-sm ${billUploaded ? 'text-emerald-300 font-medium' : 'text-gray-400'}`}>
                {billUploaded ? 'Bill Uploaded Successfully (Click to remove)' : 'Click to simulate uploading a bill photo'}
              </span>
            </button>
          </div>

          <div className="bg-blue-950/30 border border-blue-900/50 p-3 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200 leading-relaxed">
              Submitting this form will notify the Admin for expense approval. The physical issue status will remain 'Work Completed' until the financial process is also finalized.
            </p>
          </div>

          {/* Footer */}
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
              className="px-6 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
            >
              Submit Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
