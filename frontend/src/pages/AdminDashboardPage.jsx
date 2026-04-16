import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  UsersIcon, 
  TagIcon, 
  StarIcon, 
  PauseCircleIcon, 
  ExclamationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart,
  Pie
} from 'recharts';

import { useAuth } from '../context/AuthContext';
import AdminAnalytics from '../components/AdminAnalytics';

export default function AdminDashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (!token) {
          setError('Session expired. Please login again.');
          setLoading(false);
          return;
        }
        const { data } = await api.get('/admin/analytics');
        setData(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-2 border-red-100 p-8 rounded-3xl text-center flex flex-col items-center animate-fade-in">
      <div className="bg-red-100 p-4 rounded-full mb-4">
        <ExclamationCircleIcon className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-xl font-black text-red-900 mb-2">Sync Error</h2>
      <p className="text-red-700 font-bold mb-6 max-w-md">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all font-sans"
      >
        Retry Sync
      </button>
    </div>
  );


  const stats = [
    { label: 'Total Users', value: data?.stats.totalUsers || 0, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50', path: '/admin/users', permission: 'manage_users' },
    { label: 'Total Ads', value: data?.stats.totalAds || 0, icon: TagIcon, color: 'text-orange-600', bg: 'bg-orange-50', path: '/admin/ads', permission: 'manage_ads' },
    { label: 'Pending Ads', value: data?.stats.pendingAds || 0, icon: PauseCircleIcon, color: 'text-purple-600', bg: 'bg-purple-50', path: '/admin/ads?filterApproval=pending', permission: 'manage_ads' },
    { label: 'Featured Ads', value: data?.stats.featuredAds || 0, icon: StarIcon, color: 'text-yellow-600', bg: 'bg-yellow-50', path: '/admin/ads?listingType=featured', permission: 'manage_ads' },
    { label: 'Gallery Ads', value: data?.stats.galleryAds || 0, icon: SparklesIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/admin/ads?listingType=gallery', permission: 'manage_ads' },
  ];

  const canAccess = (permission) => {
    if (!permission) return true;
    if (user?.permissions?.includes('superadmin')) return true;
    return user?.permissions?.includes(permission);
  };

  const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor your marketplace activity and performance at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat) => {
          const hasAccess = canAccess(stat.permission);
          return (
            <div 
              key={stat.label} 
              className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all ${
                hasAccess ? 'hover:shadow-md cursor-pointer hover:border-orange-100' : 'opacity-75 cursor-default'
              }`}
              onClick={() => hasAccess && navigate(stat.path)}
            >
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-gray-900">Activity Trends</h2>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> <span>Ads</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> <span>Users</span></div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.activityData}>
                <defs>
                  <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="ads" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorAds)" />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-8">Popular Categories</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.categoryData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AdminAnalytics />

      {/* Recent Activity / Quick Actions table could go here */}
    </div>
  );
}
