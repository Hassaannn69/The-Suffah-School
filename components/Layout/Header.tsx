import React from 'react';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { theme, toggleTheme, user } = useStore();

  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 md:hidden"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 hidden md:block">
          Welcome back, {user?.name.split(' ')[0]} 👋
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 relative">
          <Bell size={20} className="text-gray-600 dark:text-gray-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-dark-card"></span>
        </button>
        
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          {theme === 'light' ? (
            <Moon size={20} className="text-gray-600" />
          ) : (
            <Sun size={20} className="text-yellow-400" />
          )}
        </button>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role.toLowerCase()}</p>
          </div>
          <img 
            src={user?.avatar} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;