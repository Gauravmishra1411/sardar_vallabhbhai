export type UserRole = 'student' | 'warden' | 'admin' | 'staff';

// SLA / Expected Resolution Time options
export const SLA_OPTIONS = [
  'Within 2 Hours',
  'Within 6 Hours',
  'Within 24 Hours',
  'Within 48 Hours',
] as const;
export type SlaTime = typeof SLA_OPTIONS[number];

// Problem types for assignment
export const PROBLEM_TYPES = [
  'Electrical',
  'Plumbing',
  'IT & Network',
  'Cleaning',
  'Furniture',
  'Security',
  'Other',
] as const;
export type ProblemType = typeof PROBLEM_TYPES[number];
export type UserStatus = 'active' | 'suspended';

export interface WardenRegistrationFormData {
  // 01 Personal Information
  wardenId: string;
  fullName: string;
  avatarUrl?: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;

  // 02 Contact Information
  mobileNumber: string;
  alternateMobile?: string;
  email: string;

  // 03 Hostel Assignment
  hostelName: string;
  hostelType: 'Boys Hostel' | 'Girls Hostel' | 'Co-ed' | 'Research Scholar Hostel';
  hostelBlock: string;
  officeNumber: string;

  // 04 Employment Information
  joiningDate: string;
  shift: 'Day Shift' | 'Night Shift' | '24x7 On-Call' | 'Rotational';
  employmentType: 'Permanent' | 'Deputation' | 'Contractual' | 'Guest Warden';

  // 05 Login & Security
  username: string;
  password: string;
  role: 'warden';
  accountStatus: UserStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  hostelName?: string;
  roomNumber?: string;
  mobileNumber?: string;
  department?: string;
  createdAt: string;
  avatar?: string;
  wardenId?: string;
  gender?: string;
  dob?: string;
  alternateMobile?: string;
  hostelType?: string;
  hostelBlock?: string;
  officeNumber?: string;
  joiningDate?: string;
  shift?: string;
  employmentType?: string;
  wardenDetails?: WardenRegistrationFormData;
}

// ============================================================
// SIMPLE 5-STATUS WORKFLOW
// New → Assigned → In Progress → Resolved → Closed
// ============================================================
// Physical Problem Status
export type IssueStatus =
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Work Completed'
  | 'Completed' // Only achieved when both Work Completed and Payment Completed
  | 'Closed'; // Issue closed completely

// Financial/Expense Status
export type FinancialStatus =
  | 'None'               // Initial state, no expense needed or submitted
  | 'Expense Submitted'  // Warden submitted expense, pending Admin approval
  | 'Correction Needed'  // Admin requested correction on expense
  | 'Expense Approved'   // Admin approved, ready for payment
  | 'Payment Processing' // Admin processing payment
  | 'Payment Completed'; // Payment is finalized

// Legacy statuses kept for backwards compatibility with old data
export type LegacyIssueStatus =
  | 'Submitted'
  | 'Under Warden Review'
  | 'Rejected'
  | 'Approved by Warden'
  | 'Waiting for Admin Approval'
  | 'Completed';

// Migrate legacy status to new status
export function migrateLegacyStatus(status: string): IssueStatus {
  switch (status) {
    case 'Submitted':
    case 'Under Warden Review':
    case 'Rejected':
      return 'New';
    case 'Approved by Warden':
    case 'Waiting for Admin Approval':
      return 'New';
    case 'Assigned':
      return 'Assigned';
    case 'In Progress':
      return 'In Progress';
    case 'Completed':
    case 'Resolved':
      return 'Work Completed';
    case 'Closed':
      return 'Completed';
    default:
      return 'New';
  }
}

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Urgent';

// Legacy compat
export type RequestStatus = IssueStatus;
export type RequestPriority = IssuePriority;
export type ServiceRequest = HostelIssue;

export type CategoryName =
  | 'Cleaning'
  | 'Canteen'
  | 'Furniture'
  | 'Electricity'
  | 'Washroom'
  | 'Water Supply'
  | 'Internet'
  | 'Security'
  | 'Other';

export interface CategoryStructure {
  name: CategoryName;
  icon: string;
  subcategories: string[];
}

export const ISSUE_CATEGORIES: CategoryStructure[] = [
  {
    name: 'Cleaning',
    icon: '🧹',
    subcategories: ['Room Cleaning', 'Corridor Cleaning', 'Dustbin Overflow', 'Garbage Collection'],
  },
  {
    name: 'Canteen',
    icon: '🍽',
    subcategories: ['Food Quality', 'Food Quantity', 'Hygiene', 'Water Problem', 'Delay in Service'],
  },
  {
    name: 'Furniture',
    icon: '🪑',
    subcategories: ['Broken Chair', 'Broken Table', 'Bed Repair', 'Cupboard Repair', 'Window Repair'],
  },
  {
    name: 'Electricity',
    icon: '⚡',
    subcategories: ['Fan Not Working', 'Light Not Working', 'Power Failure', 'Switch Board', 'Wiring Issue'],
  },
  {
    name: 'Washroom',
    icon: '🚿',
    subcategories: ['Water Leakage', 'Flush Not Working', 'Blocked Drain', 'Broken Tap', 'Dirty Washroom'],
  },
  {
    name: 'Water Supply',
    icon: '💧',
    subcategories: ['No Water', 'Low Pressure', 'Drinking Water Issue', 'Water Cooler Repair'],
  },
  {
    name: 'Internet',
    icon: '🌐',
    subcategories: ['WiFi Not Working', 'Slow Internet', 'LAN Issue'],
  },
  {
    name: 'Security',
    icon: '🔒',
    subcategories: ['Gate Issue', 'CCTV Problem', 'Unauthorized Entry'],
  },
  {
    name: 'Other',
    icon: '🏢',
    subcategories: ['Pest Control', 'Garden', 'Parking', 'Complaint Against Staff', 'Miscellaneous'],
  },
];

// Departments for staff assignment
export const DEPARTMENTS = [
  'Electrical & Maintenance',
  'Plumbing & Sanitation',
  'Carpentry & Furniture',
  'IT & Network Services',
  'Housekeeping & Hygiene',
  'Security & Safety',
  'General Maintenance',
];

export interface IssueHistoryEntry {
  status: string;
  updatedBy: string;
  role: UserRole;
  timestamp: string;
  remarks?: string;
}

export interface HostelIssue {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  userId?: string;
  userEmail?: string;
  hostelName: string;
  roomNumber: string;
  mobileNumber: string;
  category: CategoryName;
  subCategory: string;
  title?: string;
  description: string;
  priority: IssuePriority;
  photoUrl?: string;

  // ---- NEW SEPARATED STATUS WORKFLOW FIELDS ----
  status: IssueStatus;
  financialStatus: FinancialStatus;

  // Assignment info
  assignedStaffId?: string;
  assignedStaffName?: string;
  department?: string;
  assignmentNote?: string;        // Admin instruction to staff
  assignedAt?: string;
  assignedBy?: string;

  // Enhanced assignment fields
  slaTime?: string;              // Expected resolution time e.g. 'Within 6 Hours'
  priorityReason?: string;       // Required when priority is High or Urgent
  problemType?: string;          // e.g. 'Plumbing', 'Electrical'
  hostelBlock?: string;          // e.g. 'Block B'
  hostelFloor?: string;          // e.g. '2nd Floor'
  exactLocation?: string;        // e.g. 'Common Washroom near Room B-204'

  // Resolution info (set by staff/warden)
  resolvedNote?: string;
  resolvedPhotoUrl?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  materialsUsed?: string; // New: materials used text description

  // Expense Submission info (set by Warden)
  expenseCategory?: string;
  expenseMaterialName?: string;
  expenseQuantity?: number;
  expenseUnitPrice?: number;
  expenseTotalAmount?: number;
  expenseVendorName?: string;
  expenseInvoiceNumber?: string;
  expenseBillPhotoUrl?: string;
  expensePaymentMethod?: string;
  expenseNotes?: string;
  expenseSubmittedAt?: string;
  expenseSubmittedBy?: string;

  // Expense Review info (set by Admin)
  expenseApprovedAmount?: number;
  expenseAdminRemarks?: string;
  expenseReviewedAt?: string;
  expenseReviewedBy?: string;

  // Payment Processing info (set by Admin)
  paymentMethod?: string;
  paymentReferenceId?: string;
  paymentDate?: string;
  paymentProofUrl?: string;
  paymentProcessedAt?: string;
  paymentProcessedBy?: string;

  // Closure info (set by Admin or Warden)
  closedBy?: string;
  closedByRole?: UserRole;
  closedAt?: string;

  // Reopen info
  reopenReason?: string;
  reopenedAt?: string;
  reopenedBy?: string;

  // Legacy fields kept for compatibility
  wardenRemarks?: string;
  adminRemarks?: string;
  completionPhotoUrl?: string;

  // Feedback
  rating?: number; // 1 to 5 stars
  feedbackText?: string;

  createdAt: string;
  updatedAt: string;
  history?: IssueHistoryEntry[];
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export type NotificationEvent =
  | 'new_complaint'
  | 'staff_assigned'
  | 'work_started'
  | 'complaint_resolved'
  | 'complaint_closed'
  | 'complaint_reopened';

export interface AppNotification {
  id: string;
  userId: string;        // specific user ID
  role?: UserRole;       // OR broadcast to all users with this role
  title: string;
  message: string;
  read: boolean;
  issueId?: string;
  event?: NotificationEvent;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  role: UserRole;
  timestamp: string;
  details: string;
}
