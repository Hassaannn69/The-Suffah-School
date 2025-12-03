import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Class, Teacher } from '../types';
import Card from '../components/ui/Card';
import { Plus, Users, BookOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchData = async () => {
    const [c, t] = await Promise.all([db.getClasses(), db.getTeachers()]);
    setClasses(c);
    setTeachers(t);
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data: any) => {
      await db.addClass(data);
      setIsModalOpen(false);
      reset();
      fetchData();
  };

  const getTeacherName = (id?: string) => teachers.find(t => t.id === id)?.name || 'Unassigned';

  const inputClass = "w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-colors";

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classes</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage grades and sections</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors">
            <Plus size={20} /> Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
            <Card key={cls.id} className="border-l-4 border-l-primary-500">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cls.name}</h3>
                        <p className="text-gray-500">Section {cls.section}</p>
                    </div>
                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600">
                        <BookOpen size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-4">
                    <Users size={16} />
                    <span>Class Teacher: <span className="font-semibold">{getTeacherName(cls.teacherId)}</span></span>
                </div>
            </Card>
        ))}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-md shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-white">Create Class</h3>
                    <button onClick={() => setIsModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Class Name</label>
                        <input {...register('name', { required: true })} className={inputClass} placeholder="Grade 11" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Section</label>
                        <input {...register('section', { required: true })} className={inputClass} placeholder="A" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Class Teacher</label>
                        <select {...register('teacherId')} className={inputClass}>
                            <option value="">Select Teacher</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg">Create</button>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};

export default Classes;