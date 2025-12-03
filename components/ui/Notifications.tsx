import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Notifications: React.FC = () => {
  const { notifications, removeNotification } = useStore();

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        removeNotification(notifications[0].id);
      }, 5000); // Auto dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map((note) => (
        <div
          key={note.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transform transition-all duration-300 translate-x-0
            ${note.type === 'success' ? 'bg-white dark:bg-dark-card border-green-500 text-green-600' : ''}
            ${note.type === 'error' ? 'bg-white dark:bg-dark-card border-red-500 text-red-600' : ''}
            ${note.type === 'warning' ? 'bg-white dark:bg-dark-card border-orange-500 text-orange-600' : ''}
            ${note.type === 'info' ? 'bg-white dark:bg-dark-card border-blue-500 text-blue-600' : ''}
          `}
        >
          {note.type === 'success' && <CheckCircle size={20} />}
          {note.type === 'error' && <AlertCircle size={20} />}
          {note.type === 'warning' && <AlertTriangle size={20} />}
          {note.type === 'info' && <Info size={20} />}
          
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{note.message}</p>
          
          <button 
            onClick={() => removeNotification(note.id)}
            className="ml-2 hover:bg-gray-100 dark:hover:bg-white/10 p-1 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;