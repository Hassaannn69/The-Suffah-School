import { create } from 'zustand';
import { User, Student, Teacher, DashboardStats, Notification } from '../types';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;

  students: Student[];
  setStudents: (students: Student[]) => void;
  
  dashboardStats: DashboardStats | null;
  setDashboardStats: (stats: DashboardStats) => void;

  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),

  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),

  students: [],
  setStudents: (students) => set({ students }),

  dashboardStats: null,
  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Math.random().toString(36).substr(2, 9) }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}));