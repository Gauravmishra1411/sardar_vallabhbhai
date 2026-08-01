'use client';

import React, { useState, useEffect } from 'react';
import { HostelIssue, IssuePriority, DEPARTMENTS, User, SLA_OPTIONS, SlaTime, PROBLEM_TYPES, ProblemType } from '@/types/auth';
import { UserCheck, X, AlertTriangle, Play, MapPin, FileText, Wand2 } from 'lucide-react';

interface Props {
  issue: HostelIssue;
  staffMembers: User[];
  onClose: () => void;
  onAssign: (
    issueId: string,
    staffId: string,
    staffName: string,
    department: string,
    priority: IssuePriority,
    options: {
      assignmentNote?: string;
      slaTime?: SlaTime;
      priorityReason?: string;
      problemType?: ProblemType;
      hostelBlock?: string;
      hostelFloor?: string;
      exactLocation?: string;
      startImmediately?: boolean;
    }
  ) => void;
}

export const AssignWorkModal: React.FC<Props> = ({ issue, staffMembers, onClose, onAssign }) => {
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [staffId, setStaffId] = useState('');
  const [priority, setPriority] = useState<IssuePriority>(issue.priority || 'Medium');
  
  // New fields
  const [problemType, setProblemType] = useState<ProblemType>(PROBLEM_TYPES[0]);
  const [hostelBlock, setHostelBlock] = useState('');
  const [hostelFloor, setHostelFloor] = useState('');
  const [exactLocation, setExactLocation] = useState('');
  const [priorityReason, setPriorityReason] = useState('');
  const [slaTime, setSlaTime] = useState<SlaTime>(SLA_OPTIONS[0]);
  const [assignmentNote, setAssignmentNote] = useState('');
  const [startImmediately, setStartImmediately] = useState(true);

  // AI State
  const [isGenerating, setIsGenerating] = useState(false);

  // Set default staff member when staff list or department changes
  useEffect(() => {
    // Optionally filter staff by department here if needed in the future
    const availableStaff = staffMembers; 
    if (availableStaff.length > 0 && (!staffId || !availableStaff.find(s => s.id === staffId))) {
      setStaffId(availableStaff[0].id);
    }
  }, [staffMembers, department, staffId]);

  const generateReasonWithAI = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: issue.category,
          subCategory: issue.subCategory,
          description: issue.description,
          priority
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPriorityReason(data.text);
      } else {
        console.error('Failed to generate reason:', await res.text());
        alert('AI Generation failed. Please type manually.');
      }
    } catch (err) {
      console.error('AI Error:', err);
      alert('AI Generation failed. Please type manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalStaffId = staffId || 'unassigned-staff';
    const finalStaffName = staffMembers.find((s) => s.id === finalStaffId)?.name || 'Maintenance Team';

    onAssign(issue.id, finalStaffId, finalStaffName, department, priority, {
      assignmentNote: assignmentNote.trim() || undefined,
      slaTime,
      priorityReason: (priority === 'High' || priority === 'Urgent') ? priorityReason.trim() : undefined,
      problemType,
      hostelBlock: hostelBlock.trim() || undefined,
      hostelFloor: hostelFloor.trim() || undefined,
      exactLocation: exactLocation.trim() || undefined,
      startImmediately,
    });
  };

  const isPriorityReasonRequired = priority === 'High' || priority === 'Urgent';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-amber-500/40 rounded-3xl max-w-4xl w-[95%] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Assign Staff & Department</h3>
              <span className="text-xs text-amber-400 font-semibold">{issue.id} • {issue.category}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-all shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Complaint Details (Read-Only) */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Complaint Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                  <span className="text-xs text-gray-500">Complaint ID</span>
                  <span className="text-xs font-bold text-indigo-300">{issue.id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                  <span className="text-xs text-gray-500">Student Name</span>
                  <span className="text-xs font-bold text-white">{issue.studentName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                  <span className="text-xs text-gray-500">Hostel</span>
                  <span className="text-xs font-bold text-white">{issue.hostelName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                  <span className="text-xs text-gray-500">Room Number</span>
                  <span className="text-xs font-bold text-white">{issue.roomNumber}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-xs font-bold text-white">{issue.category}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-gray-500">Title</span>
                  <span className="text-xs font-bold text-white text-right max-w-[200px] truncate" title={issue.subCategory}>{issue.subCategory}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Problem Description
              </h4>
              <div className="p-3 bg-gray-900 rounded-lg border border-indigo-500/10 text-xs text-indigo-100/80 leading-relaxed min-h-[80px]">
                {issue.description || 'No detailed description provided by the student.'}
              </div>
            </div>
          </div>

          {/* Right Column: Assignment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Location Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Exact Location
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Hostel Block</label>
                  <input type="text" placeholder="e.g. Block B" value={hostelBlock} onChange={(e) => setHostelBlock(e.target.value)}
                    className="w-full bg-gray-900 border border-indigo-500/30 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Floor</label>
                  <input type="text" placeholder="e.g. 2nd Floor" value={hostelFloor} onChange={(e) => setHostelFloor(e.target.value)}
                    className="w-full bg-gray-900 border border-indigo-500/30 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Room / Common Area</label>
                <input type="text" placeholder="e.g. Common Washroom near Room B-204" value={exactLocation} onChange={(e) => setExactLocation(e.target.value)}
                  className="w-full bg-gray-900 border border-indigo-500/30 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            {/* Problem Type & SLA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Problem Type</label>
                <select value={problemType} onChange={(e) => setProblemType(e.target.value as ProblemType)}
                  className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500">
                  {PROBLEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Expected Resolution (SLA)</label>
                <select value={slaTime} onChange={(e) => setSlaTime(e.target.value as SlaTime)}
                  className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500">
                  {SLA_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Priority & Staff sections removed as requested */}

            {/* Admin Instruction */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Admin Instruction / Assignment Note</label>
              <textarea rows={3} placeholder="e.g. Check the pipe joint and replace the damaged washer. Confirm the leakage is completely stopped."
                value={assignmentNote} onChange={(e) => setAssignmentNote(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Start Work Immediately Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 cursor-pointer"
                 onClick={() => setStartImmediately(!startImmediately)}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${startImmediately ? 'bg-purple-500 border-purple-500' : 'bg-gray-900 border-gray-600'}`}>
                {startImmediately && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-purple-300">Start Work Immediately</div>
                <div className="text-[10px] text-gray-400">Push status to "In Progress" right away</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50">
                {startImmediately ? (
                  <>
                    <Play className="w-4 h-4" />
                    Assign & Start Work
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Assign Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
