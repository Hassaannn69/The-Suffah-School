import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from '../store/useStore';
import { db } from '../services/db';
import { useNavigate } from 'react-router-dom';
import { Role } from '../types';
import { Loader2, Sun, Moon } from 'lucide-react';
import { APP_NAME } from '../constants';

const Login: React.FC = () => {
  const { login, addNotification, theme, toggleTheme } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, getValues } = useForm<{ email: string, role: Role }>();

  const onSubmit = async (data: { email: string, role: Role }) => {
    setLoading(true);
    setError('');
    try {
      const { user } = await db.login(data.email, data.role);
      login(user);
      navigate('/');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues('email');
    if (!email) {
      setError("Please enter your email address to reset password.");
      return;
    }
    
    setLoading(true);
    try {
      await db.resetPassword(email);
      // Feedback to user (Notification state would handle the email toast, but here we show a UI message too)
      addNotification({ type: 'success', message: 'Password reset link sent to your email.' });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-white/10 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all text-gray-600 dark:text-gray-300"
        aria-label="Toggle Theme"
      >
        {theme === 'light' ? (
          <Moon size={20} className="text-gray-600" />
        ) : (
          <Sun size={20} className="text-yellow-400" />
        )}
      </button>

      <div className="bg-white dark:bg-dark-card p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
              {/* Large School Logo */}
              <img 
                src="/logo.png" 
                alt="School Logo" 
                className="w-32 h-32 object-contain"
                onError={(e) => {
                    // Fallback
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-20 h-20 bg-primary-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-500/30">
                S
              </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{APP_NAME}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Please sign in to your portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Email Address</label>
            <input 
              {...register('email')}
              defaultValue="admin@school.com"
              type="email" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Role</label>
             <select 
               {...register('role')}
               className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
             >
               <option value="ADMIN">Admin</option>
               <option value="TEACHER">Teacher</option>
               <option value="STUDENT">Student</option>
             </select>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-500 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded text-primary-600 focus:ring-primary-500" />
              Remember me
            </label>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-primary-500/30 transition-all flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Demo Credentials:</p>
          <p>Admin: admin@school.com</p>
          <p>Teacher: teacher@school.com</p>
        </div>
      </div>
    </div>
  );
};

export default Login;