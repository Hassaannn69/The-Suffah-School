import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Student, AttendanceRecord } from '../types';
import Card from '../components/ui/Card';
import { Calendar as CalendarIcon, Check, X, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

const Attendance: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsData, attendanceData] = await Promise.all([
        db.getStudents(),
        db.getAttendanceRecords(date)
      ]);
      setStudents(studentsData);
      setRecords(attendanceData);
      
      // Calculate Summary
      let p = 0, a = 0, l = 0;
      attendanceData.forEach(r => {
        if (r.status === 'Present') p++;
        if (r.status === 'Absent') a++;
        if (r.status === 'Late') l++;
      });
      setSummary({ present: p, absent: a, late: l, total: studentsData.length });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  const handleMark = async (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    // Optimistic Update
    const newRecords = [...records];
    const existingIndex = newRecords.findIndex(r => r.studentId === studentId);
    if (existingIndex !== -1) {
      newRecords[existingIndex] = { ...newRecords[existingIndex], status };
    } else {
      newRecords.push({ id: 'temp', studentId, date, status });
    }
    setRecords(newRecords);

    // Update Summary Locally
    const p = newRecords.filter(r => r.status === 'Present').length;
    const a = newRecords.filter(r => r.status === 'Absent').length;
    const l = newRecords.filter(r => r.status === 'Late').length;
    setSummary({ present: p, absent: a, late: l, total: students.length });

    // Call DB
    await db.markAttendance(studentId, date, status);
  };

  const getStatus = (studentId: string) => {
    return records.find(r => r.studentId === studentId)?.status;
  };

  const changeDate = (days: number) => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(currentDate.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Attendance</h1>
          <p className="text-gray-500 dark:text-gray-400">Mark and view attendance records</p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-dark-card p-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-2">
            <CalendarIcon size={18} className="text-primary-500" />
            <span className="font-medium text-gray-900 dark:text-white">{date}</span>
          </div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card noPadding className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50">
          <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Total Students</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summary.total}</p>
        </Card>
        <Card noPadding className="p-4 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50">
          <p className="text-sm text-green-600 dark:text-green-300 font-medium">Present</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{summary.present}</p>
        </Card>
        <Card noPadding className="p-4 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50">
          <p className="text-sm text-red-600 dark:text-red-300 font-medium">Absent</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{summary.absent}</p>
        </Card>
        <Card noPadding className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/50">
          <p className="text-sm text-orange-600 dark:text-orange-300 font-medium">Late</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{summary.late}</p>
        </Card>
      </div>

      <Card noPadding>
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-primary-500" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Roll No</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Current Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map((student) => {
                  const status = getStatus(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.attendance}% Aggregate</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        #{student.rollNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {status ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            status === 'Present' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                            status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                            'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                          }`}>
                            {status === 'Present' && <Check size={12} />}
                            {status === 'Absent' && <X size={12} />}
                            {status === 'Late' && <Clock size={12} />}
                            {status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not Marked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleMark(student.id, 'Present')}
                            className={`p-2 rounded-lg transition-colors ${status === 'Present' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400'}`}
                            title="Present"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => handleMark(student.id, 'Absent')}
                            className={`p-2 rounded-lg transition-colors ${status === 'Absent' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400'}`}
                            title="Absent"
                          >
                            <X size={18} />
                          </button>
                          <button 
                            onClick={() => handleMark(student.id, 'Late')}
                            className={`p-2 rounded-lg transition-colors ${status === 'Late' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400'}`}
                            title="Late"
                          >
                            <Clock size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Attendance;