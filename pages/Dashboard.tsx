import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { db } from '../services/db';
import { Users, GraduationCap, Calendar, BookOpen, Loader2, Activity, Clock, AlertCircle, DollarSign } from 'lucide-react';
import Card from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AuditLog } from '../types';

const Dashboard: React.FC = () => {
  const { dashboardStats, setDashboardStats, user } = useStore();
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await db.getStats();
        setDashboardStats(stats);
        const logs = await db.getAuditLogs();
        setRecentLogs(logs.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setDashboardStats]);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;

  const stats = [
    { label: 'Total Students', value: dashboardStats?.totalStudents, icon: <Users size={24} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Teachers', value: dashboardStats?.totalTeachers, icon: <GraduationCap size={24} className="text-purple-500" />, bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Attendance Rate', value: `${dashboardStats?.attendanceRate}%`, icon: <Calendar size={24} className="text-green-500" />, bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Classes', value: dashboardStats?.totalClasses, icon: <BookOpen size={24} className="text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  const financialStats = [
      { label: 'Total Arrears (Past)', value: `$${dashboardStats?.totalArrears.toLocaleString()}`, icon: <AlertCircle size={24} className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-900/20' },
      { label: 'Pending (Current Month)', value: `$${dashboardStats?.pendingFeesCurrent.toLocaleString()}`, icon: <DollarSign size={24} className="text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-900/20' }
  ];

  // Mock data for charts
  const attendanceData = [
    { name: 'Mon', present: 85 },
    { name: 'Tue', present: 88 },
    { name: 'Wed', present: 92 },
    { name: 'Thu', present: 89 },
    { name: 'Fri', present: 84 },
  ];

  const genderData = [
    { name: 'Male', value: 55 },
    { name: 'Female', value: 45 },
  ];
  const COLORS = ['#3b82f6', '#ec4899'];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Overview of school performance</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Financial Stats Grid (Admin Only) */}
      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {financialStats.map((stat, idx) => (
                <Card key={idx} className="flex items-center gap-4 border-l-4 border-l-gray-300 dark:border-l-gray-600">
                    <div className={`p-4 rounded-xl ${stat.bg}`}>
                    {stat.icon}
                    </div>
                    <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    </div>
                </Card>
            ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Weekly Attendance</h3>
          <div className="h-64 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="present" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Student Distribution</h3>
          <div className="h-64 min-h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {genderData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity / Audit Log Section */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-primary-600" size={20} />
          <h3 className="font-bold text-gray-900 dark:text-white">Recent System Activity</h3>
        </div>
        
        <div className="space-y-4">
          {recentLogs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No recent activity logs found.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800/50">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                    {log.performedBy.charAt(0)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{log.action.replace(/_/g, ' ')}</h4>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.details}</p>
                  <p className="text-xs text-gray-400 mt-1">by {log.performedBy}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;