import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Teachers from './pages/Teachers';
import Exams from './pages/Exams';
import Classes from './pages/Classes';
import Settings from './pages/Settings';
import Fees from './pages/Fees';
import Login from './pages/Login';
import Notifications from './components/ui/Notifications';
import { useStore } from './store/useStore';
import { Loader2 } from 'lucide-react';

// Global Loader Component
const GlobalLoader: React.FC = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 500); // 500ms transition effect
        return () => clearTimeout(timer);
    }, [location.pathname]);

    if (!loading) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center animate-fade-in">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-primary-600" size={48} />
                <span className="text-primary-800 dark:text-white font-medium">Loading...</span>
            </div>
        </div>
    );
};

// Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans flex">
      <GlobalLoader />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useStore();

  return (
    <HashRouter>
      {/* Notifications rendered at root level to work everywhere */}
      <Notifications /> 
      
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
        <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;