'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole, UserStatus } from '@/types/auth';
import { Users, Search, ShieldCheck, ShieldAlert, Trash2, ArrowUpRight, AlertCircle, X, CheckCircle2, Building2, UserCheck } from 'lucide-react';

export default function AdminUsersPage() {
  const { users, currentUser, updateUserRole, updateUserStatus, deleteUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const pendingWardens = users.filter((u) => u.role === 'warden' && u.status === 'suspended');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (u.email || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteUser(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          User Account Management
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage user roles, access statuses, and active registrations</p>
      </div>

      {/* Pending Warden Approvals Section */}
      {pendingWardens.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-amber-950/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              Pending Warden Approvals ({pendingWardens.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingWardens.map((warden) => (
              <div key={warden.id} className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/30 overflow-hidden flex items-center justify-center font-bold text-sm text-purple-300">
                      {warden.avatar ? (
                        <img src={warden.avatar} alt={warden.name} className="w-full h-full object-cover" />
                      ) : (
                        (warden.name ?? '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {warden.name}
                        {warden.wardenId && (
                          <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                            {warden.wardenId}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-gray-400">{warden.email}</p>
                      <p className="text-[11px] text-purple-300 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" /> {warden.hostelName || 'No Hostel Assigned'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-purple-500/10 pt-3">
                  <button
                    onClick={() => deleteUser(warden.id)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/20 hover:bg-rose-900/40 border border-rose-500/20 transition-all flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject / Delete
                  </button>
                  <button
                    onClick={() => updateUserStatus(warden.id, 'active')}
                    className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Activate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-xs focus:border-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs bg-[#070a12] text-gray-300 focus:border-purple-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="warden">Warden</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs bg-[#070a12] text-gray-300 focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended / Pending Approval</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl border border-purple-500/20 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-300">No matching user accounts</h3>
            <p className="text-xs text-gray-500 mt-1">Try adjusting search query or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-500/20 bg-purple-950/20 text-purple-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">User Profile</th>
                  <th className="py-3.5 px-5">Assigned Role</th>
                  <th className="py-3.5 px-5">Account Status</th>
                  <th className="py-3.5 px-5">Registered Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  const isPendingWarden = user.role === 'warden' && user.status === 'suspended';

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Profile */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 font-bold text-xs shrink-0 overflow-hidden border border-purple-500/30">
                            {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : (user.name ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm flex items-center gap-1.5">
                              {user.name}
                              {isSelf && <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.2 rounded">You</span>}
                              {user.wardenId && (
                                <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                  {user.wardenId}
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {user.email} {user.hostelName ? `• ${user.hostelName}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Select */}
                      <td className="py-4 px-5">
                        <select
                          value={user.role}
                          disabled={isSelf}
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          className="glass-input px-2.5 py-1 rounded-lg text-xs bg-[#070a12] text-white border-purple-500/30 disabled:opacity-60 capitalize font-medium"
                        >
                          <option value="student">Student</option>
                          <option value="warden">Warden</option>
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                        </select>
                      </td>

                      {/* Status Toggle / Warden Approve Button */}
                      <td className="py-4 px-5">
                        {isPendingWarden ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Pending Approval
                            </span>
                            <button
                              onClick={() => updateUserStatus(user.id, 'active')}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={isSelf}
                            onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'suspended' : 'active')}
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                              user.status === 'active'
                                ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 hover:border-rose-500/50'
                                : 'bg-rose-950/80 border border-rose-500/30 text-rose-300 hover:border-emerald-500/50'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {user.status === 'active' ? 'Active' : 'Suspended'}
                          </button>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-5 text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Delete */}
                      <td className="py-4 px-5 text-right">
                        <button
                          disabled={isSelf}
                          onClick={() => setDeleteTargetId(user.id)}
                          className="p-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 disabled:opacity-40 transition-all"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-rose-500/30 text-center animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Delete User Account?</h3>
            <p className="text-xs text-gray-300 mb-6">
              Are you sure you want to permanently remove this user account from the system? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
