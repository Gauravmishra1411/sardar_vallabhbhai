'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RequestStatus } from '@/types/auth';
import { FileCheck, Search, CheckCircle2, XCircle, Clock, Activity, Trash2 } from 'lucide-react';

export default function AdminRequestsPage() {
  const { requests, updateRequestStatus, deleteRequest } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusBadge = (status: RequestStatus) => {
    const s = String(status);
    if (s === 'Completed' || s === 'Closed') return <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-medium">Completed</span>;
    if (s === 'In Progress') return <span className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-medium">In Progress</span>;
    if (s === 'Rejected') return <span className="px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs font-medium">Rejected</span>;
    return <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-medium">Pending Review</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-purple-400" />
          Request Approval Center
        </h1>
        <p className="text-gray-400 text-sm mt-1">Review user service request tickets and manage resolution status</p>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, user email, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-xs focus:border-purple-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['all', 'pending', 'in-progress', 'completed', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {st === 'all' ? 'All Queue' : st.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Request Cards */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-dashed border-purple-500/20">
          <FileCheck className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-300">No requests in this queue</h3>
          <p className="text-xs text-gray-500 mt-1">Adjust search parameters or status filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((req) => (
            <div key={req.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4 border-purple-500/20">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-500/30">
                      {req.category}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Priority: <strong className="text-white">{req.priority}</strong>
                    </span>
                  </div>
                  {statusBadge(req.status)}
                </div>

                <h3 className="text-base font-bold text-white mt-3">{req.category} - {req.subCategory}</h3>
                <p className="text-xs text-gray-300 leading-relaxed mt-2 line-clamp-3">{req.description}</p>

                <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs text-gray-400">
                  <div>
                    <span className="text-gray-500">Submitted by:</span>{' '}
                    <strong className="text-white font-medium">{req.studentName}</strong> ({req.studentEmail})
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="pt-4 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => updateRequestStatus(req.id, 'Completed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      String(req.status) === 'Completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                  </button>

                  <button
                    onClick={() => updateRequestStatus(req.id, 'In Progress')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      String(req.status) === 'In Progress'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> In Progress
                  </button>

                  <button
                    onClick={() => updateRequestStatus(req.id, 'Rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      String(req.status) === 'Rejected'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>

                <button
                  onClick={() => deleteRequest(req.id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-950/40 text-gray-400 hover:text-rose-300 border border-white/5 transition-all"
                  title="Remove Ticket"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
