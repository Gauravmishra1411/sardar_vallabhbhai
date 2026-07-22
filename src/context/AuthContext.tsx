'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserStatus, ServiceRequest, RequestStatus, RequestPriority, AuditLog } from '@/types/auth';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  requests: ServiceRequest[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  toastMessage: { type: 'success' | 'error' | 'info'; text: string } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  registerUser: (name: string, email: string, password: string) => { success: boolean; error?: string };
  loginUser: (email: string, password: string) => { success: boolean; error?: string };
  loginAdmin: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserStatus: (userId: string, newStatus: UserStatus) => void;
  deleteUser: (userId: string) => void;
  createRequest: (title: string, description: string, category: string, priority: RequestPriority) => { success: boolean; error?: string };
  updateRequestStatus: (requestId: string, newStatus: RequestStatus) => void;
  deleteRequest: (requestId: string) => void;
  clearLogs: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial Demo Seed Data
const DEFAULT_USERS: (User & { passwordHash: string })[] = [
  {
    id: 'user-admin-1',
    name: 'System Admin',
    email: 'admin@example.com',
    passwordHash: 'admin123',
    role: 'admin',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-member-1',
    name: 'Alex Morgan',
    email: 'user@example.com',
    passwordHash: 'user123',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-member-2',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    passwordHash: 'user123',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-101',
    userId: 'user-member-1',
    userName: 'Alex Morgan',
    userEmail: 'user@example.com',
    title: 'Cloud Storage Limit Increase',
    description: 'Requesting storage upgrade from 50GB to 200GB for team analytics datasets.',
    category: 'Infrastructure',
    status: 'in-progress',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-102',
    userId: 'user-member-2',
    userName: 'Sarah Connor',
    userEmail: 'sarah@example.com',
    title: 'API Gateway Key Authorization',
    description: 'Need OAuth credentials generated for production mobile app integration.',
    category: 'Security',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-103',
    userId: 'user-member-1',
    userName: 'Alex Morgan',
    userEmail: 'user@example.com',
    title: 'Dashboard Theme Customization',
    description: 'Requesting dark theme preferences sync across all logged-in devices.',
    category: 'UI/UX Support',
    status: 'completed',
    priority: 'low',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    userEmail: 'admin@example.com',
    action: 'SYSTEM_BOOT',
    role: 'admin',
    timestamp: new Date().toISOString(),
    details: 'System initialized with dual-panel authentication.',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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
      if (typeof window !== 'undefined') {
        localStorage.setItem('svpuat_audit_logs', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Initialize data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Hydrate Session
      const savedUser = localStorage.getItem('svpuat_session');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      // Hydrate Users
      const savedUsers = localStorage.getItem('svpuat_users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        localStorage.setItem('svpuat_users', JSON.stringify(DEFAULT_USERS));
        setUsers(DEFAULT_USERS.map(({ passwordHash, ...u }) => u));
      }

      // Hydrate Requests
      const savedRequests = localStorage.getItem('svpuat_requests');
      if (savedRequests) {
        setRequests(JSON.parse(savedRequests));
      } else {
        localStorage.setItem('svpuat_requests', JSON.stringify(DEFAULT_REQUESTS));
        setRequests(DEFAULT_REQUESTS);
      }

      // Hydrate Audit Logs
      const savedLogs = localStorage.getItem('svpuat_audit_logs');
      if (savedLogs) {
        setAuditLogs(JSON.parse(savedLogs));
      } else {
        localStorage.setItem('svpuat_audit_logs', JSON.stringify(DEFAULT_LOGS));
        setAuditLogs(DEFAULT_LOGS);
      }
    } catch (err) {
      console.error('Error hydrating localStorage:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper to retrieve users with password hashes
  const getStoredFullUsers = (): (User & { passwordHash: string })[] => {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    const raw = localStorage.getItem('svpuat_users');
    return raw ? JSON.parse(raw) : DEFAULT_USERS;
  };

  // Register User
  const registerUser = (name: string, email: string, password: string) => {
    const fullUsers = getStoredFullUsers();
    const existing = fullUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      showToast('An account with this email already exists.', 'error');
      return { success: false, error: 'Email already registered' };
    }

    const newUser: User & { passwordHash: string } = {
      id: 'user-' + Date.now(),
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    };

    const updatedFull = [...fullUsers, newUser];
    localStorage.setItem('svpuat_users', JSON.stringify(updatedFull));

    const sanitizeUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
      avatar: newUser.avatar,
    };

    setUsers(updatedFull.map(({ passwordHash, ...u }) => u));
    setCurrentUser(sanitizeUser);
    localStorage.setItem('svpuat_session', JSON.stringify(sanitizeUser));

    addAuditLog(sanitizeUser.email, 'USER_REGISTER', 'user', `New user registered: ${sanitizeUser.name}`);
    showToast(`Welcome, ${name}! Your account has been registered.`, 'success');
    return { success: true };
  };

  // Login User
  const loginUser = (email: string, password: string) => {
    const fullUsers = getStoredFullUsers();
    const target = fullUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!target) {
      showToast('No user account found with this email.', 'error');
      return { success: false, error: 'User not found' };
    }

    if (target.passwordHash !== password) {
      showToast('Invalid password provided.', 'error');
      return { success: false, error: 'Invalid credentials' };
    }

    if (target.status === 'suspended') {
      showToast('Your account is currently suspended. Contact Admin.', 'error');
      return { success: false, error: 'Account suspended' };
    }

    const sessionUser: User = {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      status: target.status,
      createdAt: target.createdAt,
      avatar: target.avatar,
    };

    setCurrentUser(sessionUser);
    localStorage.setItem('svpuat_session', JSON.stringify(sessionUser));

    addAuditLog(sessionUser.email, 'USER_LOGIN', sessionUser.role, `User logged in successfully`);
    showToast(`Welcome back, ${sessionUser.name}!`, 'success');
    return { success: true };
  };

  // Login Admin
  const loginAdmin = (email: string, password: string) => {
    const fullUsers = getStoredFullUsers();
    const target = fullUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!target) {
      showToast('Admin account not found.', 'error');
      return { success: false, error: 'Admin account not found' };
    }

    if (target.role !== 'admin') {
      showToast('Access denied. This account does not have Admin privileges.', 'error');
      return { success: false, error: 'Not an admin account' };
    }

    if (target.passwordHash !== password) {
      showToast('Invalid admin password.', 'error');
      return { success: false, error: 'Invalid credentials' };
    }

    const sessionUser: User = {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      status: target.status,
      createdAt: target.createdAt,
      avatar: target.avatar,
    };

    setCurrentUser(sessionUser);
    localStorage.setItem('svpuat_session', JSON.stringify(sessionUser));

    addAuditLog(sessionUser.email, 'ADMIN_LOGIN', 'admin', `Admin portal access granted`);
    showToast(`Admin Access Authorized. Welcome, ${sessionUser.name}!`, 'success');
    return { success: true };
  };

  // Logout
  const logout = () => {
    if (currentUser) {
      addAuditLog(currentUser.email, 'LOGOUT', currentUser.role, 'User signed out');
    }
    setCurrentUser(null);
    localStorage.removeItem('svpuat_session');
    showToast('Signed out successfully.', 'info');
  };

  // Admin Actions
  const updateUserRole = (userId: string, newRole: UserRole) => {
    if (currentUser?.role !== 'admin') {
      showToast('Only admins can change user roles.', 'error');
      return;
    }

    const fullUsers = getStoredFullUsers();
    const updatedFull = fullUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    localStorage.setItem('svpuat_users', JSON.stringify(updatedFull));

    setUsers(updatedFull.map(({ passwordHash, ...u }) => u));

    // If active user updated
    if (currentUser?.id === userId) {
      const updatedSelf = { ...currentUser, role: newRole };
      setCurrentUser(updatedSelf);
      localStorage.setItem('svpuat_session', JSON.stringify(updatedSelf));
    }

    const targetUser = fullUsers.find((u) => u.id === userId);
    addAuditLog(currentUser.email, 'ROLE_UPDATE', 'admin', `Updated ${targetUser?.email} role to ${newRole}`);
    showToast(`User role updated to ${newRole.toUpperCase()}.`, 'success');
  };

  const updateUserStatus = (userId: string, newStatus: UserStatus) => {
    if (currentUser?.role !== 'admin') {
      showToast('Only admins can change user status.', 'error');
      return;
    }

    const fullUsers = getStoredFullUsers();
    const updatedFull = fullUsers.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
    localStorage.setItem('svpuat_users', JSON.stringify(updatedFull));

    setUsers(updatedFull.map(({ passwordHash, ...u }) => u));

    const targetUser = fullUsers.find((u) => u.id === userId);
    addAuditLog(currentUser.email, 'STATUS_UPDATE', 'admin', `Updated ${targetUser?.email} status to ${newStatus}`);
    showToast(`Account status updated to ${newStatus.toUpperCase()}.`, 'success');
  };

  const deleteUser = (userId: string) => {
    if (currentUser?.role !== 'admin') {
      showToast('Only admins can delete users.', 'error');
      return;
    }

    const fullUsers = getStoredFullUsers();
    const targetUser = fullUsers.find((u) => u.id === userId);
    if (targetUser?.role === 'admin' && fullUsers.filter((u) => u.role === 'admin').length <= 1) {
      showToast('Cannot delete the last admin account.', 'error');
      return;
    }

    const updatedFull = fullUsers.filter((u) => u.id !== userId);
    localStorage.setItem('svpuat_users', JSON.stringify(updatedFull));
    setUsers(updatedFull.map(({ passwordHash, ...u }) => u));

    addAuditLog(currentUser.email, 'USER_DELETE', 'admin', `Deleted user ${targetUser?.email}`);
    showToast('User account removed.', 'info');
  };

  // User & Admin Request Management
  const createRequest = (title: string, description: string, category: string, priority: RequestPriority) => {
    if (!currentUser) {
      showToast('You must be logged in to submit a request.', 'error');
      return { success: false, error: 'Not logged in' };
    }

    const newReq: ServiceRequest = {
      id: 'req-' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      title,
      description,
      category,
      status: 'pending',
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRequests((prev) => {
      const updated = [newReq, ...prev];
      localStorage.setItem('svpuat_requests', JSON.stringify(updated));
      return updated;
    });

    addAuditLog(currentUser.email, 'CREATE_REQUEST', currentUser.role, `Submitted request: "${title}"`);
    showToast('Service request submitted successfully!', 'success');
    return { success: true };
  };

  const updateRequestStatus = (requestId: string, newStatus: RequestStatus) => {
    setRequests((prev) => {
      const updated = prev.map((r) => (r.id === requestId ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r));
      localStorage.setItem('svpuat_requests', JSON.stringify(updated));
      return updated;
    });

    if (currentUser) {
      addAuditLog(currentUser.email, 'REQUEST_STATUS_UPDATE', currentUser.role, `Updated request #${requestId} to ${newStatus}`);
    }
    showToast(`Request status updated to ${newStatus.toUpperCase()}`, 'success');
  };

  const deleteRequest = (requestId: string) => {
    setRequests((prev) => {
      const updated = prev.filter((r) => r.id !== requestId);
      localStorage.setItem('svpuat_requests', JSON.stringify(updated));
      return updated;
    });

    if (currentUser) {
      addAuditLog(currentUser.email, 'REQUEST_DELETE', currentUser.role, `Deleted request #${requestId}`);
    }
    showToast('Request deleted.', 'info');
  };

  const clearLogs = () => {
    setAuditLogs([]);
    localStorage.setItem('svpuat_audit_logs', JSON.stringify([]));
    showToast('Audit logs cleared.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        requests,
        auditLogs,
        isLoading,
        toastMessage,
        showToast,
        clearToast,
        registerUser,
        loginUser,
        loginAdmin,
        logout,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        createRequest,
        updateRequestStatus,
        deleteRequest,
        clearLogs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
