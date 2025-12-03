import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { ExamResult, Student } from '../types';
import Card from '../components/ui/Card';
import { Plus, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

const Exams: React.FC = () => {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchData = async () => {
    setLoading(true);
    const [examsData, studentsData] = await Promise.all([
      db.getExams(),
      db.getStudents()
    ]);
    setExams(examsData);
    setStudents(studentsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Unknown';

  const onSubmit = async (data: any) => {
    const result = {
        studentId: data.studentId,
        examName: data.examName,
        subject: data.subject,
        marks: parseInt(data.marks),
        totalMarks: parseInt(data.totalMarks),
        date: new Date().toISOString().split('T')[0]
    };
    await db.publishExamResult(result);
    setIsModalOpen(false);
    reset();
    fetchData();
  };

  const inputClass = "w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-colors";

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exams & Results</h1>
          <p className="text-gray-500 dark:text-gray-400">View and publish student grades</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          <Plus size={20} />
          Publish Result
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-200">
                      <FileText size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-indigo-600 dark:text-indigo-300">Total Exams Published</p>
                      <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{exams.length}</h3>
                  </div>
              </div>
          </Card>
           <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-200">
                      <TrendingUp size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-300">Average Score</p>
                      <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                          {exams.length > 0 ? Math.round(exams.reduce((acc, curr) => acc + (curr.marks/curr.totalMarks)*100, 0) / exams.length) : 0}%
                      </h3>
                  </div>
              </div>
          </Card>
      </div>

      <Card noPadding className="overflow-hidden">
        {loading ? (
             <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary-500" /></div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Exam Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {exams.map((exam) => {
                const percentage = Math.round((exam.marks / exam.totalMarks) * 100);
                return (
                  <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {getStudentName(exam.studentId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{exam.examName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{exam.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                           percentage >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                           percentage >= 50 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                           'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                       }`}>
                           {exam.marks} / {exam.totalMarks} ({percentage}%)
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Publish Result</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500">✕</button>
                </div>
                <div className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
                        <select {...register('studentId', { required: true })} className={inputClass}>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Name</label>
                        <input {...register('examName', { required: true })} className={inputClass} placeholder="Midterm, Finals..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                        <input {...register('subject', { required: true })} className={inputClass} placeholder="Mathematics" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marks Obtained</label>
                            <input type="number" {...register('marks', { required: true })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Marks</label>
                            <input type="number" {...register('totalMarks', { required: true })} defaultValue={100} className={inputClass} />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">Publish</button>
                </form>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Exams;