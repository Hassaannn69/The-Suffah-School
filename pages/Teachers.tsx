import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Teacher } from '../types';
import Card from '../components/ui/Card';
import { Search, Plus, Trash2, Mail, Phone, BookOpen, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const teacherSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(2, "Subject is required"),
  phone: z.string().min(5, "Phone is required"),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema)
  });

  const fetchTeachers = async () => {
    setLoading(true);
    const data = await db.getTeachers();
    setTeachers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const onSubmit = async (data: TeacherFormValues) => {
    await db.addTeacher(data);
    setIsModalOpen(false);
    reset();
    fetchTeachers();
  };

  const handleDelete = async (id: string) => {
    if(confirm('Are you sure you want to remove this teacher?')) {
        await db.deleteTeacher(id);
        fetchTeachers();
    }
  };

  const inputClass = "w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-colors";

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage faculty members</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          <Plus size={20} />
          Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
             <div className="col-span-full flex justify-center py-10"><Loader2 className="animate-spin text-primary-500" /></div>
        ) : teachers.map((teacher) => (
            <Card key={teacher.id} className="relative group hover:-translate-y-1 transition-transform duration-300">
                <button 
                    onClick={() => handleDelete(teacher.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={18} />
                </button>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-lg">
                        {teacher.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{teacher.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.subject} Department</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Mail size={16} className="text-gray-400" />
                        {teacher.email}
                    </div>
                     <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Phone size={16} className="text-gray-400" />
                        {teacher.phone}
                    </div>
                     <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <BookOpen size={16} className="text-gray-400" />
                        {teacher.subject}
                    </div>
                </div>
            </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Teacher">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input {...register('name')} className={inputClass} placeholder="Dr. Sarah Smith" />
                {errors.name?.message && <span className="text-xs text-red-500">{errors.name.message as string}</span>}
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input {...register('email')} type="email" className={inputClass} placeholder="teacher@school.com" />
                {errors.email?.message && <span className="text-xs text-red-500">{errors.email.message as string}</span>}
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input {...register('subject')} className={inputClass} placeholder="Physics" />
                {errors.subject?.message && <span className="text-xs text-red-500">{errors.subject.message as string}</span>}
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input {...register('phone')} className={inputClass} placeholder="555-0123" />
                {errors.phone?.message && <span className="text-xs text-red-500">{errors.phone.message as string}</span>}
            </div>
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Teacher'}
            </button>
        </form>
      </Modal>
    </div>
  );
};

export default Teachers;