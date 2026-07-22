export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  avatar?: string;
}

export type RequestStatus = 'pending' | 'in-progress' | 'completed' | 'rejected';
export type RequestPriority = 'low' | 'medium' | 'high';

export interface ServiceRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  category: string;
  status: RequestStatus;
  priority: RequestPriority;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  role: UserRole;
  timestamp: string;
  details: string;
}
