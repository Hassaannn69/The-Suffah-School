import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  FileText, 
  Settings, 
  LogOut,
  X,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { APP_NAME } from '../../constants';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useStore();

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', allowed: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { to: '/students', icon: <Users size={20} />, label: 'Students', allowed: ['ADMIN', 'TEACHER'] },
    { to: '/teachers', icon: <GraduationCap size={20} />, label: 'Teachers', allowed: ['ADMIN'] },
    { to: '/classes', icon: <BookOpen size={20} />, label: 'Classes', allowed: ['ADMIN'] },
    { to: '/attendance', icon: <CalendarCheck size={20} />, label: 'Attendance', allowed: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { to: '/exams', icon: <FileText size={20} />, label: 'Exams & Results', allowed: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { to: '/fees', icon: <DollarSign size={20} />, label: 'Accounts & Fees', allowed: ['ADMIN'] },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings', allowed: ['ADMIN'] },
  ];

  const filteredNav = navItems.filter(item => item.allowed.includes(user?.role || ''));

  const linkClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
    ${isActive 
      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
    }
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* School Logo - Expects logo.png in public folder */}
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback if image not found
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback Icon */}
            <div className="hidden w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{APP_NAME}</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={linkClass}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;