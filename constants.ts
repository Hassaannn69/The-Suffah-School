import { User, Student, Teacher, Class, ExamResult, AttendanceRecord } from './types';

// Seed Data for "Backend"
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@school.com', role: 'ADMIN', avatar: 'https://picsum.photos/200' },
  { id: 'u2', name: 'John Teacher', email: 'teacher@school.com', role: 'TEACHER', avatar: 'https://picsum.photos/201' },
  { id: 'u3', name: 'Alice Student', email: 'student@school.com', role: 'STUDENT', avatar: 'https://picsum.photos/202' },
];

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Alice Johnson', rollNo: '101', email: 'alice@school.com', phone: '123-456-7890', classId: 'c1', section: 'A', gender: 'Female', attendance: 92, feesPaid: true },
  { id: 's2', name: 'Bob Smith', rollNo: '102', email: 'bob@school.com', phone: '123-456-7891', classId: 'c1', section: 'A', gender: 'Male', attendance: 85, feesPaid: false },
  { id: 's3', name: 'Charlie Brown', rollNo: '103', email: 'charlie@school.com', phone: '123-456-7892', classId: 'c2', section: 'B', gender: 'Male', attendance: 95, feesPaid: true },
  { id: 's4', name: 'Diana Prince', rollNo: '104', email: 'diana@school.com', phone: '123-456-7893', classId: 'c2', section: 'B', gender: 'Female', attendance: 98, feesPaid: true },
  { id: 's5', name: 'Evan Wright', rollNo: '105', email: 'evan@school.com', phone: '123-456-7894', classId: 'c1', section: 'A', gender: 'Male', attendance: 78, feesPaid: true },
];

export const MOCK_TEACHERS: Teacher[] = [
  { id: 't1', name: 'John Teacher', email: 'teacher@school.com', subject: 'Mathematics', phone: '555-0101' },
  { id: 't2', name: 'Sarah Connor', email: 'sarah@school.com', subject: 'Science', phone: '555-0102' },
];

export const MOCK_CLASSES: Class[] = [
  { id: 'c1', name: 'Grade 10', section: 'A', teacherId: 't1' },
  { id: 'c2', name: 'Grade 10', section: 'B', teacherId: 't2' },
];

export const MOCK_EXAMS: ExamResult[] = [
  { id: 'e1', studentId: 's1', examName: 'Midterm', subject: 'Math', marks: 95, totalMarks: 100, date: '2023-10-15' },
  { id: 'e2', studentId: 's2', examName: 'Midterm', subject: 'Math', marks: 78, totalMarks: 100, date: '2023-10-15' },
  { id: 'e3', studentId: 's1', examName: 'Midterm', subject: 'Science', marks: 88, totalMarks: 100, date: '2023-10-17' },
];

export const APP_NAME = "The Suffah School";
export const API_SIMULATION_DELAY = 600; // ms to simulate network