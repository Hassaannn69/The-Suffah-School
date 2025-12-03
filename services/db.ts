import { supabase } from './supabase';
import { MOCK_STUDENTS, MOCK_TEACHERS, MOCK_CLASSES, MOCK_USERS, MOCK_EXAMS } from '../constants';
import { Student, Teacher, Class, User, Role, ExamResult, AuditLog, AttendanceRecord, FeeRecord, ExpenseRecord } from '../types';
import { useStore } from '../store/useStore';

// URL for the Node.js backend (required for Brevo SMTP)
const BACKEND_URL = 'http://localhost:5000/api';

class SupabaseDatabase {
  constructor() {
    this.init();
  }

  async init() {
    try {
        // Check if Users table is empty. If so, seed initial data.
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
        
        if (!error && count === 0) {
            console.log("Creating seed data in Supabase...");
            await supabase.from('users').insert(MOCK_USERS);
            
            // Map students to snake_case for insertion
            const studentsPayload = MOCK_STUDENTS.map(s => ({
                id: s.id, name: s.name, roll_no: s.rollNo, email: s.email, phone: s.phone,
                class_id: s.classId, section: s.section, gender: s.gender, attendance: s.attendance,
                fees_paid: s.feesPaid, photo: s.photo
            }));
            await supabase.from('students').insert(studentsPayload);
            await supabase.from('teachers').insert(MOCK_TEACHERS);
            
            const classesPayload = MOCK_CLASSES.map(c => ({
                id: c.id, name: c.name, section: c.section, teacher_id: c.teacherId
            }));
            await supabase.from('classes').insert(classesPayload);
            
            const examsPayload = MOCK_EXAMS.map(e => ({
                id: e.id, student_id: e.studentId, exam_name: e.examName, subject: e.subject,
                marks: e.marks, total_marks: e.totalMarks, date: e.date
            }));
            await supabase.from('exams').insert(examsPayload);
            
            // Initial Fees
            const mockFees = [{ 
                id: 'f1', student_id: 's1', student_name: 'Alice Johnson', type: 'Tuition', 
                amount: 500, paid_amount: 200, due_date: '2023-11-30', status: 'Partial', 
                transactions: [{id: 'tx1', amount: 200, date: '2023-11-01', method: 'Cash'}] 
            }];
            await supabase.from('fees').insert(mockFees);
        }
    } catch (e) {
        console.error("CRITICAL: Failed to initialize DB.", e);
    }
  }

  // --- Internal Helpers for Audit & Notification ---
  private async logAudit(action: string, details: string, meta?: any) {
    try {
        const currentUser = useStore.getState().user;
        const performedBy = currentUser ? currentUser.name : 'System';
        
        const newLog = {
          id: Math.random().toString(36).substr(2, 9),
          action,
          details,
          performed_by: performedBy,
          timestamp: new Date().toISOString()
        };
        
        await supabase.from('audit_logs').insert(newLog);
        console.log(`[AUDIT] ${action}: ${details}`, meta);
    } catch (e) {
        console.error("Failed to log audit", e);
    }
  }

  public async sendMockEmail(to: string, subject: string, body: string) {
    console.log(`[Email Service] 📨 Attempting to send to: ${to}`);
    try {
        // Try Real Backend (Node.js + Brevo)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${BACKEND_URL}/email/general`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, body }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            useStore.getState().addNotification({ type: 'success', message: `Email sent to ${to}` });
            await this.logAudit('EMAIL_SENT_SMTP', `Sent email to ${to} via backend`);
            return;
        } else {
            console.warn("Backend returned error:", await response.text());
        }
    } catch (e) {
        console.warn("Backend unreachable (Node server might be down). Falling back to simulation.", e);
    }
    await this.logAudit('NOTIFICATION_QUEUED', `Email queued for ${to} (Simulation)`, { subject });
    useStore.getState().addNotification({ type: 'info', message: `Email simulated to ${to} (Check Console)` });
  }

  // --- Auth ---
  async login(email: string, role: Role): Promise<{ user: User, token: string }> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', role)
        .single();
    
    if (error || !data) throw new Error('Invalid credentials');
    
    await this.logAudit('USER_LOGIN', `User ${email} logged in successfully`);
    return { user: data as User, token: 'supabase-session-token' };
  }

  async resetPassword(email: string): Promise<void> {
    const { data } = await supabase.from('users').select('email').eq('email', email).single();
    if (data) {
      await this.logAudit('PASSWORD_RESET', `Password reset requested for ${email}`);
      await this.sendMockEmail(email, 'Password Reset Instructions', 'Click link to reset...');
    }
  }

  // --- Students ---
  async getStudents(): Promise<Student[]> {
    const { data, error } = await supabase.from('students').select('*');
    if (error) return [];
    return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        rollNo: s.roll_no,
        email: s.email,
        phone: s.phone,
        classId: s.class_id,
        section: s.section,
        gender: s.gender,
        attendance: s.attendance,
        feesPaid: s.fees_paid,
        photo: s.photo
    }));
  }

  async addStudent(student: Omit<Student, 'id' | 'rollNo'>): Promise<Student> {
    // Generate Roll No
    const students = await this.getStudents();
    const maxRoll = students.reduce((max, s) => {
      const num = parseInt(s.rollNo, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 100);
    const newRollNo = (maxRoll + 1).toString();
    const id = Math.random().toString(36).substr(2, 9);

    const payload = {
        id,
        name: student.name,
        roll_no: newRollNo,
        email: student.email,
        phone: student.phone,
        class_id: student.classId,
        section: student.section,
        gender: student.gender,
        attendance: 0,
        fees_paid: false,
        photo: student.photo
    };

    const { error } = await supabase.from('students').insert(payload);
    if(error) throw error;

    // Add Initial Fee
    await this.addFee({
      studentId: id,
      studentName: student.name,
      type: 'Tuition',
      amount: 500,
      paidAmount: 0,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
      status: 'Pending',
      transactions: []
    });

    await this.logAudit('CREATE_STUDENT', `Added student ${student.name}`);
    await this.sendMockEmail(student.email, 'Welcome', `Your Roll Number is ${newRollNo}.`);

    return { ...student, id, rollNo: newRollNo, attendance: 0, feesPaid: false };
  }

  async deleteStudent(id: string): Promise<void> {
    await supabase.from('students').delete().eq('id', id);
    await this.logAudit('DELETE_STUDENT', `Deleted student ID: ${id}`);
  }

  // --- Teachers ---
  async getTeachers(): Promise<Teacher[]> {
    const { data, error } = await supabase.from('teachers').select('*');
    if (error) return [];
    return data as Teacher[];
  }

  async addTeacher(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    const id = Math.random().toString(36).substr(2, 9);
    const { error } = await supabase.from('teachers').insert({ ...teacher, id });
    if(error) throw error;
    await this.logAudit('CREATE_TEACHER', `Added teacher ${teacher.name}`);
    return { ...teacher, id };
  }

  async deleteTeacher(id: string): Promise<void> {
    await supabase.from('teachers').delete().eq('id', id);
    await this.logAudit('DELETE_TEACHER', `Deleted teacher ${id}`);
  }

  // --- Classes ---
  async getClasses(): Promise<Class[]> {
    const { data, error } = await supabase.from('classes').select('*');
    if(error) return [];
    return data.map((c: any) => ({
        id: c.id, name: c.name, section: c.section, teacherId: c.teacher_id
    }));
  }

  async addClass(newClass: Omit<Class, 'id'>): Promise<Class> {
    const id = Math.random().toString(36).substr(2, 9);
    const payload = { id, name: newClass.name, section: newClass.section, teacher_id: newClass.teacherId };
    await supabase.from('classes').insert(payload);
    await this.logAudit('CREATE_CLASS', `Added class ${newClass.name}`);
    return { ...newClass, id };
  }

  // --- Attendance ---
  async getAttendanceRecords(date: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from('attendance_records').select('*').eq('date', date);
    if(error) return [];
    return data.map((r: any) => ({
        id: r.id, studentId: r.student_id, date: r.date, status: r.status
    }));
  }

  async markAttendance(studentId: string, date: string, status: 'Present' | 'Absent' | 'Late'): Promise<void> {
    // Upsert attendance record
    const { data: existing } = await supabase.from('attendance_records').select('id, status').eq('student_id', studentId).eq('date', date).single();
    
    let recordId = existing ? existing.id : Math.random().toString(36).substr(2, 9);
    
    if (existing) {
        await supabase.from('attendance_records').update({ status }).eq('id', recordId);
    } else {
        await supabase.from('attendance_records').insert({ id: recordId, student_id: studentId, date, status });
    }

    // Update Student Aggregate Score
    const { data: student } = await supabase.from('students').select('*').eq('id', studentId).single();
    if (student) {
        let newScore = parseFloat(student.attendance) || 0;
        if (status === 'Absent') newScore = Math.max(0, newScore - 2);
        if (status === 'Present') newScore = Math.min(100, newScore + 0.5);
        if (status === 'Late') newScore = Math.max(0, newScore - 0.5);
        
        await supabase.from('students').update({ attendance: newScore }).eq('id', studentId);

        if (!existing || existing.status !== status) {
            const body = status === 'Absent' 
                ? `Your child ${student.name} is marked ABSENT on ${date}.` 
                : `Attendance recorded: ${status}`;
            await this.sendMockEmail(student.email, `Attendance Alert: ${status}`, body);
        }
    }
  }

  // --- Exams ---
  async getExams(): Promise<ExamResult[]> {
    const { data } = await supabase.from('exams').select('*');
    return (data || []).map((e: any) => ({
        id: e.id, studentId: e.student_id, examName: e.exam_name, subject: e.subject,
        marks: e.marks, totalMarks: e.total_marks, date: e.date
    }));
  }

  async publishExamResult(result: Omit<ExamResult, 'id'>): Promise<ExamResult> {
    const id = Math.random().toString(36).substr(2, 9);
    const payload = {
        id, student_id: result.studentId, exam_name: result.examName, subject: result.subject,
        marks: result.marks, total_marks: result.totalMarks, date: result.date
    };
    await supabase.from('exams').insert(payload);
    
    const { data: student } = await supabase.from('students').select('email, name').eq('id', result.studentId).single();
    if(student) {
        await this.sendMockEmail(student.email, 'Exam Result Published', `You scored ${result.marks} in ${result.examName}.`);
    }
    return { ...result, id };
  }

  // --- Fees ---
  async getFees(): Promise<FeeRecord[]> {
    const { data } = await supabase.from('fees').select('*').order('created_at', { ascending: false });
    return (data || []).map((f: any) => ({
        id: f.id, studentId: f.student_id, studentName: f.student_name, type: f.type,
        amount: f.amount, paidAmount: f.paid_amount, dueDate: f.due_date, status: f.status,
        transactions: f.transactions // JSONB returns object/array automatically in supabase-js
    }));
  }

  async addFee(fee: Omit<FeeRecord, 'id'>): Promise<FeeRecord> {
    const id = Math.random().toString(36).substr(2, 9);
    const payload = {
        id, student_id: fee.studentId, student_name: fee.studentName, type: fee.type,
        amount: fee.amount, paid_amount: 0, due_date: fee.dueDate, status: 'Pending',
        transactions: [] // Pass array directly for JSONB
    };
    await supabase.from('fees').insert(payload);
    return { ...fee, id, transactions: [] };
  }

  async markFeePaid(feeId: string, paidAmount: number, method: 'Cash' | 'Online' | 'Check'): Promise<void> {
    const { data: fee } = await supabase.from('fees').select('*').eq('id', feeId).single();
    if(!fee) return;

    const newPaid = (fee.paid_amount || 0) + paidAmount;
    const status = newPaid >= fee.amount ? 'Paid' : 'Partial';
    
    let txs = fee.transactions || [];
    if (typeof txs === 'string') txs = JSON.parse(txs); // Safety check for legacy data
    
    txs.push({ id: Math.random().toString(36).substr(2,9), date: new Date().toISOString().split('T')[0], amount: paidAmount, method });

    await supabase.from('fees').update({ 
        paid_amount: newPaid, 
        status, 
        transactions: txs 
    }).eq('id', feeId);

    if (status === 'Paid') {
        // Update student flag if all fees paid (simplified check)
        await supabase.from('students').update({ fees_paid: true }).eq('id', fee.student_id);
    }

    await this.logAudit('FEE_PAYMENT', `Received $${paidAmount} from ${fee.student_name}`);
  }

  async generateMonthlyFees(): Promise<void> {
    const { data: students } = await supabase.from('students').select('*');
    if (!students) return;

    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    for (const s of students) {
        await this.addFee({
            studentId: s.id, studentName: s.name, type: 'Tuition', amount: 500,
            paidAmount: 0, dueDate, status: 'Pending', transactions: []
        });
        await supabase.from('students').update({ fees_paid: false }).eq('id', s.id);
    }
  }

  async sendFeeReminder(feeId: string): Promise<void> {
      const { data: fee } = await supabase.from('fees').select('*').eq('id', feeId).single();
      if(fee) {
           const { data: s } = await supabase.from('students').select('email').eq('id', fee.student_id).single();
           if(s) await this.sendMockEmail(s.email, 'Fee Reminder', `Please pay $${fee.amount - fee.paid_amount}`);
      }
  }

  // --- Expenses ---
  async getExpenses(): Promise<ExpenseRecord[]> {
    const { data } = await supabase.from('expenses').select('*');
    return data as ExpenseRecord[];
  }

  async addExpense(expense: Omit<ExpenseRecord, 'id'>): Promise<ExpenseRecord> {
    const id = Math.random().toString(36).substr(2, 9);
    await supabase.from('expenses').insert({ ...expense, id });
    await this.logAudit('ADD_EXPENSE', `Added expense ${expense.title}`);
    return { ...expense, id };
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50);
    return (data || []).map((l: any) => ({
        id: l.id, action: l.action, details: l.details, performedBy: l.performed_by, timestamp: l.timestamp
    }));
  }

  async getStats() {
    const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: teachers } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
    const { count: classes } = await supabase.from('classes').select('*', { count: 'exact', head: true });
    const { data: fees } = await supabase.from('fees').select('*');
    const { data: studData } = await supabase.from('students').select('attendance');
    
    const totalAttendance = (studData || []).reduce((acc: number, s: any) => acc + (s.attendance || 0), 0) / ((studData?.length || 1));
    
    // Financials
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1); 
    const pendingCurrent = (fees || []).filter((f: any) => new Date(f.due_date) >= currentMonthStart && f.status !== 'Paid')
        .reduce((acc: number, f: any) => acc + (f.amount - (f.paid_amount || 0)), 0);
    
    const arrears = (fees || []).filter((f: any) => new Date(f.due_date) < currentMonthStart && f.status !== 'Paid')
        .reduce((acc: number, f: any) => acc + (f.amount - (f.paid_amount || 0)), 0);

    return {
        totalStudents: students || 0,
        totalTeachers: teachers || 0,
        totalClasses: classes || 0,
        attendanceRate: Math.round(totalAttendance),
        totalArrears: arrears,
        pendingFeesCurrent: pendingCurrent
    };
  }
  
  async clearData() {
      // DANGER: clear all
      await supabase.from('students').delete().neq('id', '0');
      await supabase.from('teachers').delete().neq('id', '0');
      await supabase.from('fees').delete().neq('id', '0');
      await this.init(); // Reseed
  }
}

export const db = new SupabaseDatabase();