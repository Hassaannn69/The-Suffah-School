
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { db } from '../services/db';
import { Trash2, Shield, Bell, Moon, Mail, Send } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useForm } from 'react-hook-form';

const Settings: React.FC = () => {
  const { toggleTheme, theme, user, addNotification } = useStore();
  const [resetting, setResetting] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [customEmailLoading, setCustomEmailLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const handleReset = async () => {
    if(confirm("DANGER: This will delete ALL data (Students, Teachers, Records) and reset to factory defaults. Are you sure?")) {
        setResetting(true);
        await db.clearData();
        window.location.reload();
    }
  };

  const handleTestEmail = async () => {
      if(!user?.email) return;
      setTestingEmail(true);
      await db.sendMockEmail(user.email, 'Test Notification', 'This is a test to verify the notification system is working.');
      setTimeout(() => setTestingEmail(false), 2000);
  };

  const handleCustomTestEmail = async (data: any) => {
      setCustomEmailLoading(true);
      try {
        await db.sendMockEmail(data.email, 'Custom Test Email', 'This email was triggered from the Settings panel.');
        addNotification({ type: 'success', message: 'Test email request sent.' });
        reset();
      } catch (e) {
          console.error(e);
      } finally {
        setCustomEmailLoading(false);
      }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                    <Moon size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h3>
                    <p className="text-sm text-gray-500">Customize how the app looks</p>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                <button 
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </Card>

        <Card>
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                    <Mail size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Integration</h3>
                    <p className="text-sm text-gray-500">SMTP Server & Notifications</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <button 
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-2 rounded-lg transition-colors border border-blue-200 dark:border-blue-900/50"
                >
                    <Bell size={18} />
                    {testingEmail ? 'Sending...' : 'Send Test to My Email'}
                </button>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                     <p className="text-xs font-bold uppercase text-gray-500 mb-2">Send Custom Test</p>
                     <form onSubmit={handleSubmit(handleCustomTestEmail)} className="flex gap-2">
                        <input 
                            {...register('email', {required: true})}
                            type="email" 
                            placeholder="enter.email@test.com" 
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-sm"
                        />
                        <button disabled={customEmailLoading} className="bg-primary-600 text-white p-2 rounded-lg">
                            <Send size={16} />
                        </button>
                     </form>
                </div>
            </div>
        </Card>

        <Card>
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                    <Shield size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Danger Zone</h3>
                    <p className="text-sm text-gray-500">System maintenance</p>
                </div>
            </div>
            <button 
                onClick={handleReset}
                disabled={resetting}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 py-2 rounded-lg transition-colors border border-red-200 dark:border-red-900/50"
            >
                <Trash2 size={18} />
                {resetting ? 'Resetting...' : 'Reset System Data'}
            </button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
