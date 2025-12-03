
export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  phone: string;
  classId: string;
  section: string;
  gender: 'Male' | 'Female' | 'Other';
  attendance: number; // Percentage
  feesPaid: boolean;
  photo?: string; // Base64 string
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  phone: string;
}

export interface Class {
  id: string;
  name: string; // e.g., "Grade 10"
  section: string; // e.g., "A"
  teacherId?: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examName: string;
  subject: string;
  marks: number;
  totalMarks: number;
  date: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'Online' | 'Check';
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string; 
  type: 'Tuition' | 'Transport' | 'Exam' | 'Library';
  amount: number; // Total amount due
  paidAmount: number; // Amount actually paid
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  paidDate?: string;
  paymentMethod?: 'Cash' | 'Online' | 'Check';
  transactions: any[]; // Changed to any[] to support flexible JSONB from Supabase
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'Salary' | 'Maintenance' | 'Utilities' | 'Equipment' | 'Other';
  amount: number;
  date: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  totalClasses: number;
  totalArrears: number;
  pendingFeesCurrent: number;
}