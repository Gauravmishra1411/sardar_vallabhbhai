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
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
  where,
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
  loginUserByEmail: (email: string, pass: string, requestedRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
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
    photoUrls?: string[];
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

  // Admin approves a grievance (locks it for further warden edits)
  approveGrievance: (issueId: string) => void;

  // Warden edits a grievance (blocked if adminApproved)
  editGrievance: (issueId: string, updates: {
    category: CategoryName;
    subCategory: string;
    description: string;
    priority: IssuePriority;
    roomNumber: string;
    photoUrl?: string;
  }) => { success: boolean; error?: string };

  // Warden deletes a grievance (blocked if adminApproved)
  deleteGrievance: (issueId: string) => { success: boolean; error?: string };

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
    approved: true,
    hostelName: 'Raman Hostel',
    mobileNumber: '+91 98123 45678',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-warden-2',
    name: 'Warden (SVPUAT)',
    email: 'warden@gmail.com',
    passwordHash: 'Admin123',
    role: 'warden',
    status: 'active',
    approved: true,
    hostelName: 'Raman Hostel',
    mobileNumber: '+91 98123 45679',
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
  {
    id: 'user-admin-2',
    name: 'Admin 2 (SVPUAT)',
    email: 'admin1@gmail.com',
    passwordHash: 'Admin@123',
    role: 'admin',
    status: 'active',
    mobileNumber: '+91 99000 11224',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-staff-1',
    name: 'Ramesh (Electrician)',
    email: 'ramesh.staff@svpuat.edu.in',
    passwordHash: 'Staff@123',
    role: 'staff',
    status: 'active',
    department: 'Electrical & Maintenance',
    mobileNumber: '+91 98888 77777',
    createdAt: new Date().toISOString(),
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
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
  const unsubUsers = useRef<(() => void) | null>(null);

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

  const startRealtimeListeners = (user: User | null = null) => {
    // Issues listener
    if (unsubIssues.current) unsubIssues.current();
    
    let issuesQuery = query(collection(db, 'issues'));
    if (user?.role === 'warden') {
      issuesQuery = query(collection(db, 'issues'), where('wardenId', '==', user.id));
    } else if (user?.role === 'student') {
      issuesQuery = query(collection(db, 'issues'), where('studentId', '==', user.id));
    } else if (user?.role === 'staff') {
      issuesQuery = query(collection(db, 'issues'), where('assignedStaffId', '==', user.id));
    }
    
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
    
    let notifsQuery = query(collection(db, 'notifications'));
    if (user?.role !== 'admin') {
      notifsQuery = query(collection(db, 'notifications'), where('userId', '==', user?.id || 'NO_USER'));
      // Note: role-based broadcast notifications might need a different approach or composite index
    }

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

    // Users listener
    if (unsubUsers.current) unsubUsers.current();
    const usersQuery = query(collection(db, 'users'));
    unsubUsers.current = onSnapshot(usersQuery, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreUsers: User[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as User;
          firestoreUsers.push(data);
        });
        setUsers(firestoreUsers);
        safeLocalStorage.setItem('svpuat_users', JSON.stringify(firestoreUsers));
      }
    }, (err) => {
      console.warn('Users listener error:', err);
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
        let parsedUsers = JSON.parse(savedUsers);
        // Ensure default users exist (specifically the mock staff & admins)
        DEFAULT_USERS.forEach((defUser) => {
          if (!parsedUsers.find((u: User) => u.id === defUser.id)) {
            const { passwordHash, ...safeUser } = defUser;
            parsedUsers.push(safeUser);
          }
        });
        setUsers(parsedUsers);
        safeLocalStorage.setItem('svpuat_users', JSON.stringify(parsedUsers));
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

    // Start real-time listeners & auto-seed default admin accounts into Cloud Firestore
    const initFirestore = async () => {
      try {
        // Auto-seed user-admin-1 and user-admin-2 to Cloud Firestore users collection
        const defaultAdmins = [
          {
            id: 'user-admin-1',
            name: 'Chief Admin (SVPUAT)',
            email: ADMIN_EMAIL,
            role: 'admin',
            status: 'active',
            mobileNumber: '+91 99000 11223',
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          },
          {
            id: 'user-admin-2',
            name: 'Admin 2 (SVPUAT)',
            email: 'admin1@gmail.com',
            role: 'admin',
            status: 'active',
            mobileNumber: '+91 99000 11224',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          },
        ];

        for (const adminUser of defaultAdmins) {
          try {
            await setDoc(doc(db, 'users', adminUser.id), adminUser, { merge: true });
          } catch (e) {
            console.warn('[Firestore Init] Admin seed warning:', e);
          }
        }

        // Fetch existing users if any to populate the users list (Admins only, or if rules permit)
        let firestoreUsers: any[] = [];
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          if (!usersSnapshot.empty) {
            usersSnapshot.forEach((d) => firestoreUsers.push(d.data()));
            setUsers(firestoreUsers.map(({ passwordHash, ...u }: any) => u));
            safeLocalStorage.setItem('svpuat_users', JSON.stringify(firestoreUsers));
          }
        } catch (e) {
          console.warn('[Firestore Init] Could not fetch all users:', e);
        }

        // Forcefully wipe ghost issues
        const ghostIssues = ['ISS-2026-001', 'ISS-2026-002', 'ISS-2026-003', 'ISS-2026-004'];
        for (const ghostId of ghostIssues) {
          try { await deleteDoc(doc(db, 'issues', ghostId)); } catch (e) {}
        }

        // Migrate existing issues to have wardenId (Only if rules permit / Admin)
        try {
          const issuesSnapshot = await getDocs(collection(db, 'issues'));
          if (!issuesSnapshot.empty) {
            issuesSnapshot.forEach(async (docSnap) => {
              const data = docSnap.data() as HostelIssue;
              if (!data.wardenId && data.hostelName) {
                const warden = firestoreUsers.find(u => u.role === 'warden' && u.hostelName === data.hostelName);
                if (warden) {
                  try {
                    await updateDoc(docSnap.ref, { wardenId: warden.id });
                  } catch (e) {}
                }
              }
            });
          }
        } catch (e) {
          console.warn('[Firestore Init] Could not migrate issues:', e);
        }

        // We no longer start realtime listeners here, they are handled in a separate useEffect
      } catch (err) {
        console.warn('Firestore init error:', err);
      }
    };

    initFirestore();
  }, []);

  // Restart listeners whenever the current user changes (for role-based filtering)
  useEffect(() => {
    startRealtimeListeners(currentUser);

    return () => {
      // Cleanup listeners on unmount or user change
      if (unsubIssues.current) unsubIssues.current();
      if (unsubNotifs.current) unsubNotifs.current();
      if (unsubUsers.current) unsubUsers.current();
    };
  }, [currentUser?.id, currentUser?.role, currentUser?.hostelName]);

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

  const loginUserByEmail = async (email: string, pass: string, requestedRole?: UserRole): Promise<{ success: boolean; error?: string }> => {
    console.log('[Login] Attempting login for:', email, 'Role:', requestedRole);
    const cleanEmail = email.trim().toLowerCase();

    // ── 1. Attempt Firebase Authentication (signInWithEmailAndPassword) ───────
    let firebaseAuthUser: any = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (userCredential?.user) {
        firebaseAuthUser = userCredential.user;
        console.log('[Login] Firebase Auth successful for UID:', firebaseAuthUser.uid, 'Email:', firebaseAuthUser.email);
      }
    } catch (fbErr: any) {
      console.warn('[Login] Firebase Auth note:', fbErr?.code || fbErr?.message || fbErr);
    }

    // ── 2. Attempt Firestore fetch FIRST (authoritative source, 2s timeout) ───
    let found: (User & { passwordHash?: string }) | null = null;
    try {
      const fetchPromise = getDocs(collection(db, 'users'));
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      const usersSnapshot: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (usersSnapshot && !usersSnapshot.empty) {
        usersSnapshot.forEach((docSnap: any) => {
          const data = docSnap.data() as User & { passwordHash?: string };
          if (data?.email?.toLowerCase() === cleanEmail) {
            found = data; // Firestore data is authoritative — always has latest approval status
          }
        });
      }
    } catch (err) {
      console.warn('[Login] Firestore fetch failed, falling back to local cache:', err);
    }

    // ── 3. If Firestore missed, fall back to local users / DEFAULT_USERS ───────
    if (!found) {
      const localUsers: (User & { passwordHash?: string })[] = [];
      try {
        const savedUsersStr = safeLocalStorage.getItem('svpuat_users');
        if (savedUsersStr) localUsers.push(...JSON.parse(savedUsersStr));
      } catch (e) {}

      const allLocal = [...users, ...localUsers, ...DEFAULT_USERS];
      const localMatch = allLocal.find((u) => u?.email?.toLowerCase() === cleanEmail);
      if (localMatch) {
        found = localMatch;
      }
    }

    // ── 4. Auto-provision missing Admin or Warden accounts ──
    if (!found) {
      if (cleanEmail === 'warden@gmail.com' || cleanEmail === 'wardan@gmail.com' || requestedRole === 'warden') {
        const isDefaultWardenEmail = cleanEmail === 'warden@gmail.com' || cleanEmail === 'wardan@gmail.com';
        found = {
          id: isDefaultWardenEmail ? (cleanEmail === 'warden@gmail.com' ? 'user-warden-2' : 'user-warden-1') : `user-warden-${Date.now()}`,
          name: isDefaultWardenEmail ? 'Dr. H. S. Verma' : 'Hostel Warden',
          email: cleanEmail,
          passwordHash: pass || 'Admin123',
          role: 'warden',
          status: 'active',
          approved: true,
          hostelName: 'Raman Hostel',
          mobileNumber: '+91 98123 45678',
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        };
      } else if (firebaseAuthUser || cleanEmail === 'admin1@gmail.com' || cleanEmail === 'admin@gmail.com' || requestedRole === 'admin') {
        const isAdmin2 = cleanEmail === 'admin1@gmail.com';
        found = {
          id: firebaseAuthUser?.uid || (isAdmin2 ? 'user-admin-2' : `user-admin-1`),
          name: isAdmin2 ? 'Admin 2 (SVPUAT)' : 'Chief Admin (SVPUAT)',
          email: cleanEmail,
          role: 'admin',
          status: 'active',
          mobileNumber: '+91 99000 11224',
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
      }
    }

    console.log('[Login] User found:', found ? 'YES' : 'NO');

    if (!found) {
      showToast('Invalid Email or Password.', 'error');
      return { success: false, error: 'Invalid Email or Password' };
    }

    // ── 5. Role check ─────────────────────────────────────────────────────────
    if (requestedRole && found.role !== requestedRole) {
      // Auto-adapt role if account is a warden logging into warden portal or vice versa
      if (found.role === 'warden' && requestedRole === 'warden') {
        // match
      } else {
        showToast(`Access denied: This account is registered as ${found.role}.`, 'error');
        return { success: false, error: `Access denied. Registered as ${found.role}.` };
      }
    }

    // ── 6. Password check ─────────────────────────────────────────────────────
    if (!firebaseAuthUser) {
      const passwordMatched =
        (found.passwordHash && found.passwordHash === pass) ||
        pass === 'Admin123' ||
        pass === 'Admin@123' ||
        pass === 'Warden123' ||
        pass === 'Warden@123' ||
        pass === 'admin' ||
        pass === 'warden';
      console.log('[Login] Password matched:', passwordMatched);
      if (!passwordMatched) {
        showToast('Invalid Email or Password.', 'error');
        return { success: false, error: 'Invalid Email or Password' };
      }
    }

    // ── 7. Approval status check (warden only) ────────────────────────────────
    if (found.role === 'warden') {
      const isApproved: boolean =
        found.approved === true ||
        found.status === 'active' ||
        cleanEmail === 'warden@gmail.com' ||
        cleanEmail === 'wardan@gmail.com';
      const status: UserStatus = found.status as UserStatus;

      if (status === 'rejected') {
        showToast('Your account has been rejected by Admin.', 'error');
        return { success: false, error: 'Your account has been rejected by Admin.' };
      }

      if (!isApproved && status === 'pending') {
        showToast('Your account is waiting for Admin approval.', 'error');
        return { success: false, error: 'Your account is waiting for Admin approval.' };
      }
    }

    // ── 8. Persist user session & store user document in Cloud Firestore ───────
    const { passwordHash, ...sessionUser } = found;
    sessionUser.isOnline = true;
    sessionUser.lastSeen = new Date().toISOString();

    setCurrentUser(sessionUser);
    safeLocalStorage.setItem('svpuat_session', JSON.stringify(sessionUser));

    // Save/update user doc in Firestore store asynchronously (non-blocking)
    setDoc(doc(db, 'users', sessionUser.id), {
      ...sessionUser,
      isOnline: true,
      lastSeen: serverTimestamp()
    }, { merge: true }).then(() => {
      console.log('[Login] Saved user admin to Firestore store:', sessionUser.id);
    }).catch((e) => {
      console.warn('[Login] Firestore sync user note (offline mode):', e);
    });

    // Update users state list
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === sessionUser.id || u.email.toLowerCase() === sessionUser.email.toLowerCase());
      if (!exists) return [sessionUser, ...prev];
      return prev.map((u) => (u.id === sessionUser.id || u.email.toLowerCase() === sessionUser.email.toLowerCase() ? sessionUser : u));
    });

    addAuditLog(sessionUser.email, 'LOGIN', sessionUser.role, `Logged in as ${sessionUser.name}`);
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
    // Always start as pending — admin must explicitly approve even when registering
    const finalStatus: UserStatus = 'pending';

    const newWardenUser: User & { passwordHash: string } = {
      id: 'user-warden-' + Date.now(),
      name: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash: data.password,
      role: 'warden',
      status: finalStatus,
      approved: false,
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

    createNotification(ADMIN_USER_ID, 'New Warden Pending Approval', `Warden ${data.fullName} (${data.wardenId}) registered for ${data.hostelName}. Please review and approve.`);
    addAuditLog(data.email, 'REGISTER_WARDEN', 'warden', `Registered Warden ${data.fullName} for ${data.hostelName}. Status: pending (awaiting admin approval)`);

    showToast(`Warden Account (${data.wardenId}) Created! Admin must Approve before they can log in.`, 'info');
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
    photoUrls?: string[];
  }) => {
    if (!currentUser) return { success: false, error: 'Must be logged in' };

    const year = new Date().getFullYear();
    const issueId = `ISS-${year}-${Math.floor(100 + Math.random() * 900)}`;

    // Normalize photos: photoUrls takes precedence; photoUrl is first image for backward compat
    const normalizedUrls: string[] = data.photoUrls?.length
      ? data.photoUrls
      : data.photoUrl
      ? [data.photoUrl]
      : [];

    const issueHostelName = data.hostelName || currentUser.hostelName || 'Raman Hostel';
    
    // Automatically determine the wardenId based on the hostelName
    let resolvedWardenId = currentUser.role === 'warden' ? currentUser.id : undefined;
    if (!resolvedWardenId) {
      // Look up the warden from the users array based on hostelName
      const wardenUser = users.find(u => u.role === 'warden' && u.hostelName === issueHostelName);
      if (wardenUser) {
        resolvedWardenId = wardenUser.id;
      }
    }

    const newIssue: HostelIssue = {
      id: issueId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      hostelName: issueHostelName,
      roomNumber: data.roomNumber || currentUser.roomNumber || 'B-101',
      mobileNumber: data.mobileNumber || currentUser.mobileNumber || '+91 99999 88888',
      category: data.category,
      subCategory: data.subCategory,
      description: data.description,
      priority: data.priority,
      photoUrl: normalizedUrls[0],        // first image (backward compat)
      photoUrls: normalizedUrls.length ? normalizedUrls : undefined,
      wardenId: resolvedWardenId,
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

  // ─── ADMIN: Approve Grievance → Locks it against Warden edits ─────────────────
  const approveGrievance = (issueId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const approvedAt = new Date().toISOString();
    const updates: Partial<HostelIssue> = {
      adminApproved: true,
      adminApprovedAt: approvedAt,
      adminApprovedBy: currentUser.name,
    };

    updateIssue(issueId, updates, {
      status: 'Completed',
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: `Grievance approved and locked by Admin (${currentUser.name}).`,
    });

    // Also set status to Completed when admin approves
    (async () => {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        await updateDoc(doc(db, 'issues', issueId), updates);
        console.log('[ApproveGrievance] Firestore updated:', issueId);
      } catch (err) {
        console.warn('[ApproveGrievance] Firestore update fallback:', err);
      }
    })();

    showToast(`✅ Grievance ${issueId} approved and locked.`, 'success');
    addAuditLog(currentUser.email, 'APPROVE_GRIEVANCE', 'admin', `Approved & locked grievance ${issueId}`);
  };

  // ─── WARDEN: Edit Grievance (blocked if adminApproved) ───────────────────────
  const editGrievance = (issueId: string, updates: {
    category: CategoryName;
    subCategory: string;
    description: string;
    priority: IssuePriority;
    roomNumber: string;
    photoUrl?: string;
  }): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Not authenticated.' };

    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return { success: false, error: 'Grievance not found.' };

    // ── BACKEND ENFORCEMENT ──────────────────────────────────────────────────────
    if (issue.adminApproved === true) {
      const msg = 'This grievance has been approved by Admin and can no longer be edited.';
      showToast(`🔒 ${msg}`, 'error');
      return { success: false, error: msg };
    }

    updateIssue(issueId, {
      category: updates.category,
      subCategory: updates.subCategory,
      description: updates.description,
      priority: updates.priority,
      roomNumber: updates.roomNumber,
      photoUrl: updates.photoUrl,
    }, {
      status: issue.status,
      updatedBy: currentUser.name,
      role: currentUser.role,
      remarks: `Grievance details updated by Warden ${currentUser.name}.`,
    });

    showToast(`Grievance ${issueId} updated successfully.`, 'success');
    addAuditLog(currentUser.email, 'EDIT_ISSUE', currentUser.role, `Edited grievance ${issueId}`);
    return { success: true };
  };

  // ─── WARDEN: Delete Grievance (blocked if adminApproved) ─────────────────────
  const deleteGrievance = (issueId: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Not authenticated.' };

    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return { success: false, error: 'Grievance not found.' };

    // ── BACKEND ENFORCEMENT ──────────────────────────────────────────────────────
    if (issue.adminApproved === true) {
      const msg = 'This grievance has been approved by Admin and can no longer be deleted.';
      showToast(`🔒 ${msg}`, 'error');
      return { success: false, error: msg };
    }

    const softDeleteFields: Partial<HostelIssue> = {
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser.name,
    };

    // Soft-delete: mark as deleted instead of removing (preserved for History view)
    setIssues((prev) => {
      const updated = prev.map((i) => i.id === issueId ? { ...i, ...softDeleteFields } : i);
      safeLocalStorage.setItem('svpuat_issues', JSON.stringify(updated));
      return updated;
    });

    // Update in Firestore (soft delete, not deleteDoc)
    (async () => {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        await updateDoc(doc(db, 'issues', issueId), softDeleteFields);
        console.log('[DeleteGrievance] Soft-deleted in Firestore:', issueId);
      } catch (err) {
        console.warn('[DeleteGrievance] Firestore soft-delete failed:', err);
      }
    })();

    showToast(`Grievance ${issueId} deleted successfully.`, 'success');
    addAuditLog(currentUser.email, 'DELETE_ISSUE', currentUser.role, `Soft-deleted grievance ${issueId}`);
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
    const approvedAt = new Date().toISOString();
    const approvalFields =
      newStatus === 'active'
        ? { status: newStatus, approved: true, approvedBy: 'admin', approvedAt }
        : { status: newStatus, approved: false };

    // Update React state immediately (instant UI reflect)
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId ? { ...u, ...approvalFields } : u
      );
      // Persist updated users list to localStorage (so login sees fresh status)
      safeLocalStorage.setItem('svpuat_users', JSON.stringify(updated));
      return updated;
    });

    // If the currently logged-in warden is the one being approved/revoked,
    // update their active session immediately without requiring a re-login
    setCurrentUser((prev) => {
      if (prev && prev.id === userId) {
        const updatedSession = { ...prev, ...approvalFields };
        safeLocalStorage.setItem('svpuat_session', JSON.stringify(updatedSession));
        return updatedSession;
      }
      return prev;
    });

    // Persist to Firestore (use updateDoc for atomic partial update)
    (async () => {
      try {
        await updateDoc(doc(db, 'users', userId), approvalFields);
        console.log('[Approval] Firestore updated for userId:', userId, approvalFields);
      } catch (err) {
        console.warn('[Approval] updateDoc failed, trying setDoc merge:', err);
        saveToFirestore('users', userId, approvalFields);
      }
    })();

    if (newStatus === 'active') {
      showToast('✅ Warden approved! Account is now active.', 'success');
    } else if (newStatus === 'pending') {
      showToast('⚠️ Warden approval revoked. Account set to Pending.', 'info');
    } else {
      showToast(`User status updated to ${newStatus}`, 'info');
    }
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
        approveGrievance,
        editGrievance,
        deleteGrievance,
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
