'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  User,
  UserRole,
  UserStatus,
  HostelIssue,
  IssueStatus,
  IssuePriority,
  CategoryName,
  AppNotification,
  AuditLog,
  WardenRegistrationFormData,
  migrateLegacyStatus,
} from '@/types/auth';
import { safeLocalStorage } from '@/utils/safeStorage';
import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// ─── Firestore helpers ────────────────────────────────────────────────────────

const sanitizeForFirestore = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  const clean: any = Array.isArray(data) ? [] : {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val === undefined) {
      // Firestore doesn't accept undefined — skip
      continue;
    } else if (typeof val === 'string' && val.startsWith('data:')) {
      clean[key] = null;
    } else if (val && typeof val === 'object') {
      clean[key] = sanitizeForFirestore(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

const saveToFirestore = async (collectionName: string, docId: string, data: any) => {
  try {
    const safeData = sanitizeForFirestore(data);
    await setDoc(doc(db, collectionName, docId), safeData, { merge: true });
  } catch (error) {
    console.error(`Error saving to Firestore (${collectionName}/${docId}):`, error);
  }
};

const deleteFromFirestore = async (collectionName: string, docId: string) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error(`Error deleting from Firestore (${collectionName}/${docId}):`, error);
  }
};

// ─── Context type ─────────────────────────────────────────────────────────────

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  issues: HostelIssue[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  toastMessage: { type: 'success' | 'error' | 'info'; text: string } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;

  // Authentication
  loginRole: (role: UserRole) => void;
  loginUserByEmail: (email: string, pass: string, requestedRole?: UserRole) => { success: boolean; error?: string };
  registerStudent: (
    name: string,
    email: string,
    pass: string,
    hostel: string,
    room: string,
    mobile: string
  ) => { success: boolean; error?: string };
  registerWarden: (data: WardenRegistrationFormData) => { success: boolean; error?: string };
  logout: () => void;

  // ─── GRIEVANCE WORKFLOW ───────────────────────────────────────────────────
  // Student or Admin/Warden creates issue (status: New)
  createIssue: (data: {
    category: CategoryName;
    subCategory: string;
    description: string;
    priority: IssuePriority;
    hostelName: string;
    roomNumber: string;
    mobileNumber: string;
    photoUrl?: string;
  }) => { success: boolean; error?: string };

  // Admin OR Warden assigns staff (New → Assigned OR directly → In Progress)
  assignWork: (
    issueId: string,
    staffId: string,
    staffName: string,
    department: string,
    priority: IssuePriority,
    options?: {
      assignmentNote?: string;
      slaTime?: string;
      priorityReason?: string;
      problemType?: string;
      hostelBlock?: string;
      hostelFloor?: string;
      exactLocation?: string;
      startImmediately?: boolean; // true = skip Assigned → go directly to In Progress
    }
  ) => void;

  // Staff starts work (Assigned → In Progress)
  staffStartWork: (issueId: string) => void;

  // Staff/Warden completes physical work (In Progress → Work Completed)
  completePhysicalWork: (
    issueId: string,
    resolvedNote: string,
    resolvedPhotoUrl?: string,
    materialsUsed?: string
  ) => void;

  // Warden submits expense (Financial Status → Expense Submitted)
  submitExpense: (
    issueId: string,
    expenseData: {
      expenseCategory: string;
      expenseMaterialName: string;
      expenseQuantity: number;
      expenseUnitPrice: number;
      expenseTotalAmount: number;
      expenseVendorName: string;
      expenseInvoiceNumber: string;
      expenseBillPhotoUrl?: string;
      expensePaymentMethod: string;
      expenseNotes?: string;
    }
  ) => void;

  // Admin reviews expense
  reviewExpense: (issueId: string, approved: boolean, remarks: string, approvedAmount?: number) => void;

  // Admin processes payment
  processPayment: (
    issueId: string,
    paymentData: {
      paymentMethod: string;
      paymentReferenceId: string;
      paymentProofUrl?: string;
    }
  ) => void;

  // Final step: Mark issue as Completed
  markIssueCompleted: (issueId: string) => void;

  // Admin OR Warden closes complaint (Resolved → Closed)
  closeComplaint: (issueId: string) => void;

  // Admin OR Warden reopens complaint (Resolved/Closed → In Progress)
  reopenComplaint: (issueId: string, reason: string) => void;

  // Legacy compat
  adminAssignWork: (
    issueId: string,
    staffId: string,
    staffName: string,
    department: string,
    priority: IssuePriority,
    remarks?: string
  ) => void;
  staffUpdateStatus: (issueId: string, newStatus: 'In Progress' | 'Completed', completionPhotoUrl?: string) => void;
  wardenReview: (issueId: string, approve: boolean, remarks: string) => void;
  studentRateService: (issueId: string, rating: number, feedbackText: string) => void;

  // Notifications
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;

  // User Management
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserStatus: (userId: string, newStatus: UserStatus) => void;
  updateUserProfile: (updatedData: Partial<User>) => { success: boolean; error?: string };
  adminUpdateWarden: (wardenId: string, updatedData: Partial<User>) => { success: boolean; error?: string };
  deleteUser: (userId: string) => void;
  clearLogs: () => void;

  // Legacy Compatibility Helpers
  requests: HostelIssue[];
  createRequest: (title: string, description: string, category: string, priority: any) => { success: boolean; error?: string };
  updateRequestStatus: (id: string, status: any) => void;
  deleteRequest: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin123';
const WARDEN_EMAIL = process.env.NEXT_PUBLIC_WARDEN_EMAIL || 'wardan@gmail.com';
const WARDEN_PASSWORD = process.env.NEXT_PUBLIC_WARDEN_PASSWORD || 'Admin123';

// Known admin & warden IDs (for notification broadcasting)
const ADMIN_USER_ID = 'user-admin-1';
const WARDEN_USER_ID = 'user-warden-1';

const DEFAULT_USERS: (User & { passwordHash: string })[] = [
  {
    id: 'user-warden-1',
    name: 'Dr. H. S. Verma',
    email: WARDEN_EMAIL,
    passwordHash: WARDEN_PASSWORD,
    role: 'warden',
    status: 'active',
    hostelName: 'Raman Hostel',
    mobileNumber: '+91 98123 45678',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-admin-1',
    name: 'Chief Admin (SVPUAT)',
    email: ADMIN_EMAIL,
    passwordHash: ADMIN_PASSWORD,
    role: 'admin',
    status: 'active',
    mobileNumber: '+91 99000 11223',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_ISSUES: HostelIssue[] = [];

// ─── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [issues, setIssues] = useState<HostelIssue[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Track unsubscribe functions for Firestore listeners
  const unsubIssues = useRef<(() => void) | null>(null);
  const unsubNotifs = useRef<(() => void) | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const clearToast = () => setToastMessage(null);

  const addAuditLog = (email: string, action: string, role: UserRole, details: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      userEmail: email,
      action,
      role,
      timestamp: new Date().toISOString(),
      details,
    };
    setAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      safeLocalStorage.setItem('svpuat_audit_logs', JSON.stringify(updated));
      return updated;
    });
    // saveToFirestore('audit_logs', newLog.id, newLog);
  };

  // ─── Notification helpers ────────────────────────────────────────────────────

  const createNotification = (userId: string, title: string, message: string, issueId?: string, role?: UserRole) => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId,
      role,
      title,
      message,
      read: false,
      issueId,
      createdAt: new Date().toISOString(),
    };
    saveToFirestore('notifications', newNotif.id, newNotif);
    return newNotif;
  };

  // Notify Admin + Warden
  const notifyAdminAndWarden = (title: string, message: string, issueId?: string) => {
    createNotification(ADMIN_USER_ID, title, message, issueId);
    createNotification(WARDEN_USER_ID, title, message, issueId);
  };

  // Notify specific user + Admin + Warden
  const notifyAll = (targetUserId: string, title: string, message: string, issueId?: string) => {
    // Notify target (staff/student)
    if (targetUserId !== ADMIN_USER_ID && targetUserId !== WARDEN_USER_ID) {
      createNotification(targetUserId, title, message, issueId);
    }
    // Always notify admin and warden
    notifyAdminAndWarden(title, message, issueId);
  };

  // ─── Real-time Firestore listeners ──────────────────────────────────────────

  const startRealtimeListeners = () => {
    // Issues listener
    if (unsubIssues.current) unsubIssues.current();
    const issuesQuery = query(collection(db, 'issues'));
    unsubIssues.current = onSnapshot(issuesQuery, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreIssues: HostelIssue[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          // Migrate legacy status on the fly
          if (data.status && !['New', 'Assigned', 'In Progress', 'Work Completed', 'Completed'].includes(data.status)) {
            data.status = migrateLegacyStatus(data.status);
          }
          firestoreIssues.push(data as HostelIssue);
        });
        // Sort by createdAt descending
        firestoreIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setIssues(firestoreIssues);
        safeLocalStorage.setItem('svpuat_issues', JSON.stringify(firestoreIssues));
      } else {
        setIssues([]);
        safeLocalStorage.setItem('svpuat_issues', JSON.stringify([]));
      }
    }, (err) => {
      console.warn('Issues listener error:', err);
    });

    // Notifications listener
    if (unsubNotifs.current) unsubNotifs.current();
    const notifsQuery = query(collection(db, 'notifications'));
    unsubNotifs.current = onSnapshot(notifsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreNotifs: AppNotification[] = [];
        snapshot.forEach((docSnap) => firestoreNotifs.push(docSnap.data() as AppNotification));
        firestoreNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(firestoreNotifs);
        safeLocalStorage.setItem('svpuat_notifications', JSON.stringify(firestoreNotifs));
      } else {
        setNotifications([]);
        safeLocalStorage.setItem('svpuat_notifications', JSON.stringify([]));
      }
    }, (err) => {
      console.warn('Notifications listener error:', err);
    });
  };

  // ─── Initial hydration ───────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Fast local hydration
    try {
      const savedUser = safeLocalStorage.getItem('svpuat_session');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedUsers = safeLocalStorage.getItem('svpuat_users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        safeLocalStorage.setItem('svpuat_users', JSON.stringify(DEFAULT_USERS));
        setUsers(DEFAULT_USERS.map(({ passwordHash, ...u }) => u));
      }

      const savedIssues = safeLocalStorage.getItem('svpuat_issues');
      if (savedIssues && !savedIssues.includes('ISS-2026-001')) {
        // Migrate legacy statuses
        const parsed = JSON.parse(savedIssues).map((iss: any) => ({
          ...iss,
          status: ['New', 'Assigned', 'In Progress', 'Work Completed', 'Completed'].includes(iss.status)
            ? iss.status
            : migrateLegacyStatus(iss.status),
        }));
        setIssues(parsed);
      } else {
        safeLocalStorage.setItem('svpuat_issues', JSON.stringify([]));
        setIssues([]);
      }

      const savedNotifs = safeLocalStorage.getItem('svpuat_notifications');
      if (savedNotifs && !savedNotifs.includes('notif-init-1')) {
        setNotifications(JSON.parse(savedNotifs));
      } else {
        safeLocalStorage.setItem('svpuat_notifications', JSON.stringify([]));
        setNotifications([]);
      }

      const savedLogs = safeLocalStorage.getItem('svpuat_audit_logs');
      if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
    } catch (err) {
      console.error('Local hydration error:', err);
    } finally {
      setIsLoading(false);
    }

    // Start real-time listeners
    const initFirestore = async () => {
      try {
        // Fetch existing users if any to populate the users list for assignment dropdowns
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (!usersSnapshot.empty) {
          const firestoreUsers: any[] = [];
          usersSnapshot.forEach((d) => firestoreUsers.push(d.data()));
          setUsers(firestoreUsers.map(({ passwordHash, ...u }: any) => u));
          safeLocalStorage.setItem('svpuat_users', JSON.stringify(firestoreUsers));
        }

        // Forcefully wipe the 4 dummy issues from the database if they exist
        const ghostIssues = ['ISS-2026-001', 'ISS-2026-002', 'ISS-2026-003', 'ISS-2026-004'];
        for (const ghostId of ghostIssues) {
          try { await deleteDoc(doc(db, 'issues', ghostId)); } catch (e) {}
        }

        // Start real-time listeners
        startRealtimeListeners();
      } catch (err) {
        console.warn('Firestore init error:', err);
        // Still start listeners even if seed fails
        startRealtimeListeners();
      }
    };

    initFirestore();

    return () => {
      // Cleanup listeners on unmount
      if (unsubIssues.current) unsubIssues.current();
      if (unsubNotifs.current) unsubNotifs.current();
    };
  }, []);

  // ─── Auth ────────────────────────────────────────────────────────────────────

  const loginRole = (targetRole: UserRole) => {
    const target = DEFAULT_USERS.find((u) => u.role === targetRole) || DEFAULT_USERS[0];
    const sessionUser: User = {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      status: target.status,
      hostelName: target.hostelName,
      roomNumber: target.roomNumber,
      mobileNumber: target.mobileNumber,
      department: target.department,
      createdAt: target.createdAt,
      avatar: target.avatar,
    };
    setCurrentUser(sessionUser);
    safeLocalStorage.setItem('svpuat_session', JSON.stringify(sessionUser));
    showToast(`Switched to ${targetRole.toUpperCase()} Portal as ${sessionUser.name}`, 'success');
  };

  const loginUserByEmail = (email: string, pass: string, requestedRole?: UserRole) => {
    const stored = safeLocalStorage.getItem('svpuat_users');
    const allUsers: (User & { passwordHash: string })[] = stored ? JSON.parse(stored) : DEFAULT_USERS;

    const found =
      allUsers.find((u) => u?.email?.toLowerCase() === email?.toLowerCase()) ||
      DEFAULT_USERS.find((u) => u?.email?.toLowerCase() === email?.toLowerCase());

    if (!found) {
      if (requestedRole) {
        if (email.includes(requestedRole)) { loginRole(requestedRole); return { success: true }; }
        showToast('Account not found.', 'error');
        return { success: false, error: 'User not found' };
      }
      
      if (email.includes('student')) { loginRole('student'); return { success: true }; }
      if (email.includes('warden') || email.includes('wardan')) { loginRole('warden'); return { success: true }; }
      if (email.includes('admin')) { loginRole('admin'); return { success: true }; }
      if (email.includes('staff')) { loginRole('staff'); return { success: true }; }
      showToast('Account not found.', 'error');
      return { success: false, error: 'User not found' };
    }

    if (requestedRole && found.role !== requestedRole) {
      showToast(`Access denied: This account is not a ${requestedRole} account.`, 'error');
      return { success: false, error: `Access denied. Not a ${requestedRole}.` };
    }

    if (found.role === 'warden' && found.status === 'suspended') {
      showToast('Warden account is pending Admin approval.', 'error');
      return { success: false, error: 'Warden account is pending Admin approval.' };
    }

    const sessionUser: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      status: found.status,
      hostelName: found.hostelName,
      roomNumber: found.roomNumber,
      mobileNumber: found.mobileNumber,
      department: found.department,
      createdAt: found.createdAt,
      avatar: found.avatar,
    };

    setCurrentUser(sessionUser);
    safeLocalStorage.setItem('svpuat_session', JSON.stringify(sessionUser));
    addAuditLog(sessionUser.email, 'LOGIN', sessionUser.role, 'Logged in');
    showToast(`Welcome back, ${sessionUser.name}!`, 'success');
    return { success: true };
  };

  const registerStudent = (name: string, email: string, pass: string, hostel: string, room: string, mobile: string) => {
    const stored = safeLocalStorage.getItem('svpuat_users');
    const allUsers: (User & { passwordHash: string })[] = stored ? JSON.parse(stored) : DEFAULT_USERS;

    if (allUsers.some((u) => u?.email?.toLowerCase() === email?.toLowerCase())) {
      showToast('Email already registered', 'error');
      return { success: false, error: 'Email already registered' };
    }

    const newStudent: User & { passwordHash: string } = {
      id: 'user-student-' + Date.now(),
      name,
      email: email.toLowerCase(),
      passwordHash: pass,
      role: 'student',
      status: 'active',
      hostelName: hostel,
      roomNumber: room,
      mobileNumber: mobile,
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    };

    const updated = [...allUsers, newStudent];
    safeLocalStorage.setItem('svpuat_users', JSON.stringify(updated));
    setUsers(updated.map(({ passwordHash, ...u }) => u));
    saveToFirestore('users', newStudent.id, newStudent);

    const sessionUser: User = { ...newStudent };
    delete (sessionUser as any).passwordHash;
    setCurrentUser(sessionUser);
    safeLocalStorage.setItem('svpuat_session', JSON.stringify(sessionUser));
    showToast(`Student Account Registered Successfully! Welcome ${name}`, 'success');
    return { success: true };
  };

  const registerWarden = (data: WardenRegistrationFormData) => {
    const stored = safeLocalStorage.getItem('svpuat_users');
    const allUsers: (User & { passwordHash: string })[] = stored ? JSON.parse(stored) : DEFAULT_USERS;

    if (allUsers.some((u) => u?.email?.toLowerCase() === data?.email?.toLowerCase())) {
      showToast('Warden email already registered', 'error');
      return { success: false, error: 'Email already registered' };
    }

    const isAdminRegistering = currentUser?.role === 'admin';
    const finalStatus: UserStatus = isAdminRegistering ? (data.accountStatus || 'active') : 'suspended';

    const newWardenUser: User & { passwordHash: string } = {
      id: 'user-warden-' + Date.now(),
      name: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash: data.password,
      role: 'warden',
      status: finalStatus,
      hostelName: data.hostelName,
      roomNumber: data.officeNumber,
      mobileNumber: data.mobileNumber,
      createdAt: new Date().toISOString(),
      avatar: data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.fullName)}`,
      wardenId: data.wardenId,
      gender: data.gender,
      dob: data.dob,
      alternateMobile: data.alternateMobile,
      hostelType: data.hostelType,
      hostelBlock: data.hostelBlock,
      officeNumber: data.officeNumber,
      joiningDate: data.joiningDate,
      shift: data.shift,
      employmentType: data.employmentType,
      wardenDetails: data,
    };

    const updated = [...allUsers, newWardenUser];
    safeLocalStorage.setItem('svpuat_users', JSON.stringify(updated));
    setUsers(updated.map(({ passwordHash, ...u }) => u));
    saveToFirestore('users', newWardenUser.id, newWardenUser);

    createNotification(ADMIN_USER_ID, 'New Warden Pending Approval', `Warden ${data.fullName} (${data.wardenId}) registered for ${data.hostelName}.`);
    addAuditLog(data.email, 'REGISTER_WARDEN', 'warden', `Registered Warden ${data.fullName} for ${data.hostelName}. Status: ${finalStatus}`);

    showToast(isAdminRegistering ? `Warden Account (${data.wardenId}) Registered & Activated!` : `Registration Submitted! Pending Admin approval.`, isAdminRegistering ? 'success' : 'info');
    return { success: true };
  };

  const logout = () => {
    if (currentUser) addAuditLog(currentUser.email, 'LOGOUT', currentUser.role, 'Logged out');
    setCurrentUser(null);
    safeLocalStorage.removeItem('svpuat_session');
    showToast('Signed out successfully.', 'info');
  };

  // ─── GRIEVANCE WORKFLOW ───────────────────────────────────────────────────────

  // Helper to update issue in state + Firestore
  const updateIssue = (issueId: string, updates: Partial<HostelIssue>, historyEntry?: { status: string; updatedBy: string; role: UserRole; remarks?: string }) => {
    setIssues((prev) => {
      const updated = prev.map((iss) => {
        if (iss.id !== issueId) return iss;
        const newHistory = historyEntry
          ? [...(iss.history || []), { ...historyEntry, timestamp: new Date().toISOString() }]
          : iss.history;
        const updatedIss = { ...iss, ...updates, updatedAt: new Date().toISOString(), history: newHistory };
        saveToFirestore('issues', issueId, updatedIss);
        return updatedIss;
      });
      safeLocalStorage.setItem('svpuat_issues', JSON.stringify(updated));
      return updated;
    });
  };

  // EVENT 1: Student/Admin/Warden creates issue → STATUS: New
  const createIssue = (data: {
    category: CategoryName;
    subCategory: string;
    description: string;
    priority: IssuePriority;
    hostelName: string;
    roomNumber: string;
    mobileNumber: string;
    photoUrl?: string;
  }) => {
    if (!currentUser) return { success: false, error: 'Must be logged in' };

    const year = new Date().getFullYear();
    const issueId = `ISS-${year}-${Math.floor(100 + Math.random() * 900)}`;
    const newIssue: HostelIssue = {
      id: issueId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      hostelName: data.hostelName || currentUser.hostelName || 'Raman Hostel',
      roomNumber: data.roomNumber || currentUser.roomNumber || 'B-101',
      mobileNumber: data.mobileNumber || currentUser.mobileNumber || '+91 99999 88888',
      category: data.category,
      subCategory: data.subCategory,
      description: data.description,
      priority: data.priority,
      photoUrl: data.photoUrl,
      status: 'New',
      financialStatus: 'None',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          status: 'New',
          updatedBy: currentUser.name,
          role: currentUser.role,
          timestamp: new Date().toISOString(),
          remarks: 'Grievance submitted.',
        },
      ],
    };

    setIssues((prev) => {
      const updated = [newIssue, ...prev];
      safeLocalStorage.setItem('svpuat_issues', JSON.stringify(updated));
      return updated;
    });
    saveToFirestore('issues', issueId, newIssue);

    // EVENT 1: Notify Admin + Warden
    notifyAdminAndWarden(
      'New Grievance Submitted',
      `New grievance ${issueId} has been submitted by ${currentUser.name} from ${newIssue.hostelName} Room ${newIssue.roomNumber}.`,
      issueId
    );

    addAuditLog(currentUser.email, 'CREATE_ISSUE', currentUser.role, `Created issue ${issueId}`);
    showToast(`Grievance ${issueId} submitted successfully!`, 'success');
    return { success: true };
  };

  // EVENT 2: Admin OR Warden assigns staff → STATUS: Assigned OR In Progress (when startImmediately=true)
  const assignWork = (
    issueId: string,
    staffId: string,
    staffName: string,
    department: string,
    priority: IssuePriority,
    options?: {
      assignmentNote?: string;
      slaTime?: string;
      priorityReason?: string;
      problemType?: string;
      hostelBlock?: string;
      hostelFloor?: string;
      exactLocation?: string;
      startImmediately?: boolean;
    }
  ) => {
    if (!currentUser) return;

    const {
      assignmentNote,
      slaTime,
      priorityReason,
      problemType,
      hostelBlock,
      hostelFloor,
      exactLocation,
      startImmediately = false,
    } = options || {};

    const targetStatus: IssueStatus = startImmediately ? 'In Progress' : 'Assigned';
    const now = new Date().toISOString();

    const updates: Partial<HostelIssue> = {
      status: targetStatus,
      priority,
      assignedStaffId: staffId,
      assignedStaffName: staffName,
      department,
      assignmentNote,
      slaTime,
      priorityReason,
      problemType,
      hostelBlock,
      hostelFloor,
      exactLocation,
      assignedBy: currentUser.name,
      assignedAt: now,
    };

    updateIssue(issueId, updates, {
      status: targetStatus,
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: `Assigned to ${staffName} (${department}).${slaTime ? ' SLA: ' + slaTime + '.' : ''}${assignmentNote ? ' Instruction: ' + assignmentNote : ''}`,
    });

    // Build rich notification message for Warden
    const issue = issues.find((i) => i.id === issueId);
    const locationLine = [hostelBlock, hostelFloor, exactLocation].filter(Boolean).join(', ');
    const richMsg = [
      `Complaint ${issueId} – ${issue?.category || ''}`,
      `Problem: ${issue?.subCategory || ''}${problemType ? ' (' + problemType + ')' : ''}`,
      `Student: ${issue?.studentName || ''}`,
      `Hostel: ${issue?.hostelName || ''}${locationLine ? ' → ' + locationLine : ''}`,
      `Priority: ${priority}${priorityReason ? ' — ' + priorityReason : ''}`,
      `Assigned: ${staffName} (${department})`,
      slaTime ? `Expected Resolution: ${slaTime}` : '',
      assignmentNote ? `Instruction: ${assignmentNote}` : '',
      `Status: 🟠 ${targetStatus}`,
    ].filter(Boolean).join('\n');

    const notifTitle = startImmediately
      ? '🔔 Complaint Moved to In Progress'
      : '📋 Staff Assigned to Complaint';

    notifyAdminAndWarden(notifTitle, richMsg, issueId);

    // Notify assigned staff with work details
    const staffMsg = [
      `You have been assigned to complaint ${issueId}.`,
      `Category: ${issue?.category || ''} — ${issue?.subCategory || ''}`,
      `Hostel: ${issue?.hostelName || ''} Room ${issue?.roomNumber || ''}${locationLine ? ' → ' + locationLine : ''}`,
      `Priority: ${priority}${priorityReason ? ' — ' + priorityReason : ''}`,
      `Department: ${department}`,
      slaTime ? `Expected Resolution: ${slaTime}` : '',
      assignmentNote ? `Instruction: ${assignmentNote}` : '',
    ].filter(Boolean).join('\n');

    createNotification(staffId, `New Work Assignment: ${issueId}`, staffMsg, issueId);

    addAuditLog(currentUser.email, 'ASSIGN_WORK', currentUser.role, `Assigned ${issueId} to ${staffName}. Status: ${targetStatus}`);
    showToast(
      startImmediately
        ? `Complaint ${issueId} assigned & started! Status: In Progress`
        : `Complaint ${issueId} assigned to ${staffName}!`,
      'success'
    );
  };

  // EVENT 3: Staff starts work → STATUS: In Progress
  const staffStartWork = (issueId: string) => {
    if (!currentUser) return;

    updateIssue(issueId, { status: 'In Progress' }, {
      status: 'In Progress',
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: 'Staff started working on the complaint.',
    });

    // EVENT 3: Notify Admin + Warden
    notifyAdminAndWarden(
      'Work Started',
      `${currentUser.name} has started working on complaint ${issueId}.`,
      issueId
    );

    addAuditLog(currentUser.email, 'START_WORK', currentUser.role, `Started work on ${issueId}`);
    showToast('Status updated to In Progress!', 'success');
  };

  // EVENT 4: Staff/Warden completes physical work → STATUS: Work Completed
  const completePhysicalWork = (issueId: string, resolvedNote: string, resolvedPhotoUrl?: string, materialsUsed?: string) => {
    if (!currentUser) return;

    const updates: Partial<HostelIssue> = {
      status: 'Work Completed',
      resolvedNote,
      materialsUsed,
      resolvedAt: new Date().toISOString(),
      resolvedBy: currentUser.name,
    };
    if (resolvedPhotoUrl) updates.resolvedPhotoUrl = resolvedPhotoUrl;

    updateIssue(issueId, updates, {
      status: 'Work Completed',
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: resolvedNote,
    });

    notifyAdminAndWarden(
      'Work Completed',
      `Physical work for complaint ${issueId} has been completed by ${currentUser.name}.`,
      issueId
    );

    addAuditLog(currentUser.email, 'COMPLETE_WORK', currentUser.role, `Completed physical work on ${issueId}`);
    showToast(`Work completed for ${issueId}!`, 'success');
  };

  // EXPENSE: Warden submits expense
  const submitExpense = (issueId: string, expenseData: any) => {
    if (!currentUser) return;
    
    const updates: Partial<HostelIssue> = {
      financialStatus: 'Expense Submitted',
      ...expenseData,
      expenseSubmittedAt: new Date().toISOString(),
      expenseSubmittedBy: currentUser.name,
    };

    updateIssue(issueId, updates, {
      status: 'Expense Submitted' as any, // Not real issue status, but tracking history
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: `Expense submitted: $${expenseData.expenseTotalAmount}`,
    });

    // Notify Admin
    notifyAdminAndWarden('Expense Submitted', `Warden ${currentUser.name} submitted an expense of $${expenseData.expenseTotalAmount} for complaint ${issueId}.`, issueId);
    
    addAuditLog(currentUser.email, 'SUBMIT_EXPENSE', currentUser.role, `Submitted expense for ${issueId}`);
    showToast(`Expense submitted for ${issueId}`, 'success');
  };

  // EXPENSE: Admin reviews expense
  const reviewExpense = (issueId: string, approved: boolean, remarks: string, approvedAmount?: number) => {
    if (!currentUser) return;

    const updates: Partial<HostelIssue> = {
      financialStatus: approved ? 'Expense Approved' : 'Correction Needed',
      expenseAdminRemarks: remarks,
      expenseReviewedAt: new Date().toISOString(),
      expenseReviewedBy: currentUser.name,
    };
    if (approvedAmount !== undefined) {
      updates.expenseApprovedAmount = approvedAmount;
    }

    updateIssue(issueId, updates, {
      status: (approved ? 'Expense Approved' : 'Correction Needed') as any,
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: `Admin reviewed expense. Approved: ${approved}. Remarks: ${remarks}`,
    });

    notifyAdminAndWarden(
      approved ? 'Expense Approved' : 'Expense Correction Needed',
      `Expense for complaint ${issueId} was ${approved ? 'approved' : 'returned for correction'}.`,
      issueId
    );

    addAuditLog(currentUser.email, 'REVIEW_EXPENSE', currentUser.role, `Reviewed expense for ${issueId}`);
    showToast(`Expense ${approved ? 'approved' : 'returned for correction'}`, 'success');
  };

  // PAYMENT: Admin processes payment
  const processPayment = (issueId: string, paymentData: any) => {
    if (!currentUser) return;

    const updates: Partial<HostelIssue> = {
      financialStatus: 'Payment Completed',
      ...paymentData,
      paymentProcessedAt: new Date().toISOString(),
      paymentProcessedBy: currentUser.name,
    };

    updateIssue(issueId, updates, {
      status: 'Payment Completed' as any,
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: `Payment processed: ${paymentData.paymentMethod}`,
    });

    notifyAdminAndWarden(
      'Payment Completed',
      `Payment of for complaint ${issueId} has been successfully processed.`,
      issueId
    );

    addAuditLog(currentUser.email, 'PROCESS_PAYMENT', currentUser.role, `Processed payment for ${issueId}`);
    showToast(`Payment processed for ${issueId}`, 'success');
  };

  // FINAL: Mark issue as Completed
  const markIssueCompleted = (issueId: string) => {
    if (!currentUser) return;

    const updates: Partial<HostelIssue> = {
      status: 'Completed',
      closedBy: currentUser.name,
      closedByRole: currentUser.role,
      closedAt: new Date().toISOString(),
    };

    updateIssue(issueId, updates, {
      status: 'Completed',
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: `Issue fully completed and closed.`,
    });

    notifyAdminAndWarden('Issue Completed', `Complaint ${issueId} is now fully completed.`, issueId);

    addAuditLog(currentUser.email, 'ISSUE_COMPLETED', currentUser.role, `Marked ${issueId} as completed`);
    showToast(`Complaint ${issueId} marked as completed!`, 'success');
  };

  // EVENT 5: Admin OR Warden closes → STATUS: Closed
  const closeComplaint = (issueId: string) => {
    if (!currentUser) return;

    const issue = issues.find((i) => i.id === issueId);
    const updates: Partial<HostelIssue> = {
      status: 'Closed',
      closedBy: currentUser.name,
      closedByRole: currentUser.role,
      closedAt: new Date().toISOString(),
    };

    updateIssue(issueId, updates, {
      status: 'Closed',
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: `Complaint closed by ${currentUser.role === 'admin' ? 'Admin' : 'Warden'}: ${currentUser.name}`,
    });

    // EVENT 5: Notify Admin + Warden + Staff
    const msg = `Complaint ${issueId} has been successfully closed by ${currentUser.name}.`;
    notifyAdminAndWarden('Complaint Closed', msg, issueId);
    if (issue?.assignedStaffId) {
      createNotification(issue.assignedStaffId, 'Complaint Closed', msg, issueId);
    }

    addAuditLog(currentUser.email, 'CLOSE_COMPLAINT', currentUser.role, `Closed ${issueId}`);
    showToast(`Complaint ${issueId} has been closed!`, 'success');
  };

  // EVENT 6: Admin OR Warden reopens → STATUS: In Progress
  const reopenComplaint = (issueId: string, reason: string) => {
    if (!currentUser) return;

    const issue = issues.find((i) => i.id === issueId);
    const updates: Partial<HostelIssue> = {
      status: 'In Progress',
      reopenReason: reason,
      reopenedAt: new Date().toISOString(),
      reopenedBy: currentUser.name,
    };

    updateIssue(issueId, updates, {
      status: 'In Progress',
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: `Complaint reopened. Reason: ${reason}`,
    });

    // EVENT 6: Notify Admin + Warden + Staff
    const msg = `Complaint ${issueId} has been reopened. Reason: ${reason}`;
    notifyAdminAndWarden('Complaint Reopened', msg, issueId);
    if (issue?.assignedStaffId) {
      createNotification(issue.assignedStaffId, 'Complaint Reopened', msg, issueId);
    }

    addAuditLog(currentUser.email, 'REOPEN_COMPLAINT', currentUser.role, `Reopened ${issueId}. Reason: ${reason}`);
    showToast(`Complaint ${issueId} has been reopened.`, 'info');
  };

  // ─── Legacy compatibility ─────────────────────────────────────────────────────

  const adminAssignWork = (issueId: string, staffId: string, staffName: string, department: string, priority: IssuePriority, remarks?: string) => {
    assignWork(issueId, staffId, staffName, department, priority, { assignmentNote: remarks });
  };

  const wardenReview = (issueId: string, approve: boolean, remarks: string) => {
    // Old warden review → just update to Assigned-ready or log it
    if (approve) {
      updateIssue(issueId, { status: 'New', wardenRemarks: remarks }, {
        status: 'New',
        updatedBy: currentUser?.name || 'Warden',
        role: 'warden',
        remarks: `Warden reviewed: ${remarks}`,
      });
      showToast('Complaint reviewed. You can now assign staff.', 'success');
    } else {
      updateIssue(issueId, { wardenRemarks: remarks }, {
        status: 'New',
        updatedBy: currentUser?.name || 'Warden',
        role: 'warden',
        remarks: `Warden note: ${remarks}`,
      });
      showToast('Remarks added.', 'info');
    }
  };

  const staffUpdateStatus = (issueId: string, newStatus: 'In Progress' | 'Completed', completionPhotoUrl?: string) => {
    if (newStatus === 'In Progress') {
      staffStartWork(issueId);
    } else {
      completePhysicalWork(issueId, 'Work completed.', completionPhotoUrl);
    }
  };

  const studentRateService = (issueId: string, rating: number, feedbackText: string) => {
    updateIssue(issueId, { rating, feedbackText, status: 'Closed' }, {
      status: 'Closed',
      updatedBy: issues.find((i) => i.id === issueId)?.studentName || 'Student',
      role: 'student',
      remarks: `Rated ${rating}/5: ${feedbackText}`,
    });
    showToast(`Thank you for your feedback!`, 'success');
  };

  // ─── Notifications ────────────────────────────────────────────────────────────

  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notifId ? { ...n, read: true } : n));
      safeLocalStorage.setItem('svpuat_notifications', JSON.stringify(updated));
      return updated;
    });
    saveToFirestore('notifications', notifId, { read: true });
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    const userNotifs = notifications.filter(
      (n) => n.userId === currentUser.id || n.role === currentUser.role
    );
    userNotifs.forEach((n) => {
      if (!n.read) {
        saveToFirestore('notifications', n.id, { read: true });
      }
    });
    setNotifications((prev) => {
      const ids = new Set(userNotifs.map((n) => n.id));
      const updated = prev.map((n) => (ids.has(n.id) ? { ...n, read: true } : n));
      safeLocalStorage.setItem('svpuat_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // ─── User Management ──────────────────────────────────────────────────────────

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
      safeLocalStorage.setItem('svpuat_users', JSON.stringify(updated));
      return updated;
    });
    saveToFirestore('users', userId, { role: newRole });
    showToast(`User role updated to ${newRole}`, 'info');
  };

  const updateUserStatus = (userId: string, newStatus: UserStatus) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
      safeLocalStorage.setItem('svpuat_users', JSON.stringify(updated));
      return updated;
    });
    saveToFirestore('users', userId, { status: newStatus });
    showToast(`User status updated to ${newStatus}`, 'info');
  };

  const updateUserProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };

    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === currentUser.id ? { ...u, ...updatedData } : u));
      safeLocalStorage.setItem('svpuat_users', JSON.stringify(updated));
      return updated;
    });

    const newSessionUser = { ...currentUser, ...updatedData };
    setCurrentUser(newSessionUser);
    safeLocalStorage.setItem('svpuat_session', JSON.stringify(newSessionUser));
    saveToFirestore('users', currentUser.id, updatedData);
    showToast('Profile updated successfully!', 'success');
    return { success: true };
  };

  const adminUpdateWarden = (wardenId: string, updatedData: Partial<User>) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === wardenId ? { ...u, ...updatedData } : u));
      safeLocalStorage.setItem('svpuat_users', JSON.stringify(updated));
      return updated;
    });
    saveToFirestore('users', wardenId, updatedData);
    showToast('Warden profile updated successfully!', 'success');
    return { success: true };
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      safeLocalStorage.setItem('svpuat_users', JSON.stringify(updated));
      return updated;
    });
    deleteFromFirestore('users', userId);
    showToast('User removed', 'info');
  };

  const clearLogs = () => {
    setAuditLogs([]);
    safeLocalStorage.setItem('svpuat_audit_logs', JSON.stringify([]));
    showToast('Audit logs cleared', 'info');
  };

  // ─── Context value ────────────────────────────────────────────────────────────

  const contextValue = useMemo(() => ({
        currentUser,
        users,
        issues,
        notifications,
        auditLogs,
        isLoading,
        toastMessage,
        showToast,
        clearToast,
        loginRole,
        loginUserByEmail,
        registerStudent,
        registerWarden,
        logout,
        createIssue,
        assignWork,
        staffStartWork,
        completePhysicalWork,
      submitExpense,
      reviewExpense,
      processPayment,
      markIssueCompleted,
        closeComplaint,
        reopenComplaint,
        adminAssignWork,
        staffUpdateStatus,
        wardenReview,
        studentRateService,
        markNotificationRead,
        markAllNotificationsRead,
        updateUserRole,
        updateUserStatus,
        updateUserProfile,
        adminUpdateWarden,
        deleteUser,
        clearLogs,
        requests: issues,
        createRequest: (title: string, description: string, category: string, priority: string) =>
          createIssue({
            category: 'Other',
            subCategory: category || 'General',
            description: `${title} - ${description}`,
            priority: priority === 'high' ? 'High' : priority === 'low' ? 'Low' : 'Medium',
            hostelName: currentUser?.hostelName || 'Raman Hostel',
            roomNumber: currentUser?.roomNumber || 'B-101',
            mobileNumber: currentUser?.mobileNumber || '+91 99999 88888',
          }),
        updateRequestStatus: (id: string, status: string) => {
          const newStatus = ['New', 'Assigned', 'In Progress', 'Work Completed', 'Completed'].includes(status)
            ? status as IssueStatus
            : migrateLegacyStatus(status);
          updateIssue(id, { status: newStatus });
        },
        deleteRequest: (id: string) => {
          setIssues((prev) => {
            const updated = prev.filter((i) => i.id !== id);
            safeLocalStorage.setItem('svpuat_issues', JSON.stringify(updated));
            return updated;
          });
          deleteFromFirestore('issues', id);
        },
  }), [currentUser, users, issues, notifications, auditLogs, isLoading, toastMessage]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
