import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Student } from '../types';
import Card from '../components/ui/Card';
import { Search, Plus, Filter, Trash2, Edit, Loader2, Upload, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Mock Modal Component
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const studentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  classId: z.string().min(1, "Class required"),
  phone: z.string().min(10, "Phone required"),
  gender: z.enum(["Male", "Female", "Other"]),
});

type StudentFormValues = z.infer<typeof studentSchema>;

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema)
  });

  const fetchStudents = async () => {
    setLoading(true);
    const data = await db.getStudents();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: StudentFormValues) => {
    await db.addStudent({
      ...data,
      section: 'A',
      attendance: 0,
      feesPaid: false,
      photo: photoPreview || undefined
    });
    setIsModalOpen(false);
    reset();
    setPhotoPreview(null);
    fetchStudents();
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.rollNo.includes(search)
  );

  const inputClass = "w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage student records</p>
        </div>
        <button 
          onClick={() => {
            setPhotoPreview(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          <Plus size={20} />
          Add Student
        </button>
      </div>

      <Card className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-white/5 border-none">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search by name or roll no..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors">
          <Filter size={20} />
          <span>Filters</span>
        </button>
      </Card>

      <Card noPadding className="overflow-hidden">
        {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID / Roll</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {student.photo ? (
                        <img 
                            src={student.photo} 
                            alt={student.name} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary-100 dark:border-primary-900"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                            {student.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    #{student.rollNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                      Grade 10-A
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {student.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      student.feesPaid 
                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300' 
                        : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'
                    }`}>
                      {student.feesPaid ? 'Active' : 'Fees Due'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-primary-600 transition-colors mx-2"><Edit size={18} /></button>
                    <button 
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      onClick={async () => {
                        await db.deleteStudent(student.id);
                        fetchStudents();
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Student">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <label className="relative cursor-pointer group">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-primary-500 transition-colors">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={32} className="text-gray-400" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full text-white shadow-lg">
                <Upload size={14} />
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            <span className="text-xs text-gray-500 mt-2">Upload Photo</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input {...register('name')} className={inputClass} placeholder="John Doe" />
            {errors.name?.message && <span className="text-xs text-red-500">{errors.name.message as string}</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class ID</label>
                <input {...register('classId')} defaultValue="c1" className={inputClass} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
               <select {...register('gender')} className={inputClass}>
                 <option value="Male">Male</option>
                 <option value="Female">Female</option>
                 <option value="Other">Other</option>
               </select>
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input {...register('email')} type="email" className={inputClass} placeholder="student@example.com" />
            {errors.email?.message && <span className="text-xs text-red-500">{errors.email.message as string}</span>}
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input {...register('phone')} className={inputClass} placeholder="123-456-7890" />
            {errors.phone?.message && <span className="text-xs text-red-500">{errors.phone.message as string}</span>}
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Student'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Students;