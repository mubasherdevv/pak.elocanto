import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  MagnifyingGlassIcon, 
  UserGroupIcon, 
  CheckBadgeIcon, 
  NoSymbolIcon, 
  PauseCircleIcon,
  EllipsisHorizontalIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  StarIcon,
  BoltIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';


import { useAuth } from '../context/AuthContext';
import { getOptimizedImageUrl } from '../utils/imageUtils';


const BADGE_STYLES = {
  verified: { label: 'Verified Seller', color: 'bg-green-50 text-green-700 border-green-100', icon: CheckBadgeIcon },
  topSeller: { label: 'Top Seller', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: SparklesIcon },
  premium: { label: 'Premium Seller', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: StarIcon },
  business: { label: 'Business Seller', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: BuildingStorefrontIcon },
  quickResponder: { label: 'Quick Responder', color: 'bg-teal-50 text-teal-700 border-teal-100', icon: BoltIcon }
};

export default function AdminUsersPage() {

  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [typeFilter, setTypeFilter] = useState('All Users');

  // UI States
  const [view, setView] = useState('list'); // 'list' or 'details'
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeUser, setBadgeUser] = useState(null);
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [userAds, setUserAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    isAdmin: false,
    permissions: []
  });

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.get('/users/admin/all'); 
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAds = async (userId) => {
    try {
      setAdsLoading(true);
      const { data } = await api.get(`/ads/admin/user/${userId}`);
      setUserAds(data);
    } catch (err) {
      console.error('Error fetching user ads:', err);
    } finally {
      setAdsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/admin/${editingUser._id}`, formData);
      } else {
        await api.post('/users/admin/create', formData);
      }
      
      setView('list');
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', phone: '', city: '', isAdmin: false, permissions: [] });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/admin/${id}`);
        fetchUsers();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  const toggleBan = async (id) => {
    try {
      await api.put(`/users/admin/${id}/ban`, {});
      fetchUsers();
    } catch (err) {
      console.error('Error toggling ban:', err);
    }
  };

  const getStats = () => {
    const total = users.length;
    const active = users.filter(u => !u.isBanned).length;
    const suspended = users.filter(u => u.isBanned).length;
    return { total, active, suspended, banned: suspended }; 
  };

  const stats = getStats();
  const cities = ['All Cities', ...new Set(users.map(u => u.city).filter(Boolean))];

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(term) || 
                         user.email.toLowerCase().includes(term) ||
                         (user.phone && user.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'All Status' || 
                         (statusFilter === 'ACTIVE' && !user.isBanned) ||
                         (statusFilter === 'SUSPENDED' && user.isBanned);
    
    const matchesCity = cityFilter === 'All Cities' || user.city === cityFilter;
    
    const matchesType = typeFilter === 'All Users' || 
                       (typeFilter === 'Admins' && user.isAdmin) ||
                       (typeFilter === 'Regular' && !user.isAdmin);

    return matchesSearch && matchesStatus && matchesCity && matchesType;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f95e26]"></div>
    </div>
  );

  return (
    <div className="relative space-y-6 animate-fade-in p-4 lg:p-6 bg-[#f8fafc] min-h-screen">
      {view === 'list' ? (
        <>
          {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">User Management</h1>
          <p className="text-gray-500 text-sm font-medium mt-0.5">Manage all registered users</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl border border-gray-200 text-sm font-bold hover:bg-gray-50 shadow-sm transition-all">
            <ArrowDownTrayIcon className="w-5 h-5 text-gray-400" />
            Export CSV
          </button>
          <button 
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', password: '', phone: '', city: '', isAdmin: false, permissions: [] });
              setView('details');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#f95e26] text-white rounded-xl text-sm font-bold hover:bg-[#e8541f] shadow-lg shadow-orange-100 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Add Admin
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border-2 border-red-100 p-8 rounded-3xl text-center flex flex-col items-center">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <ExclamationCircleIcon className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-red-900 mb-2">Connection Issues</h2>
          <p className="text-red-700 font-bold mb-6 max-w-md">{error}</p>
          <button 
            onClick={fetchUsers}
            className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.total, icon: <UserGroupIcon className="w-6 h-6 text-indigo-500" />, bg: 'bg-white' },
              { label: 'Active Users', value: stats.active, icon: <CheckBadgeIcon className="w-6 h-6 text-green-500" />, bg: 'bg-white' },
              { label: 'Suspended', value: stats.suspended, icon: <PauseCircleIcon className="w-6 h-6 text-blue-500" />, bg: 'bg-white' },
              { label: 'Banned', value: stats.banned, icon: <NoSymbolIcon className="w-6 h-6 text-red-500" />, bg: 'bg-white' },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-3xl border border-gray-100 shadow-sm bg-white flex flex-col justify-between h-36 relative overflow-hidden group">
                 <div className="bg-gray-50/50 w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1e293b]">{stat.value.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                type="text" 
                placeholder="Search by name, email or phone..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-[#f95e26] focus:outline-none transition-all font-semibold text-gray-700 bg-gray-50/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <select 
                className="px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-[#f95e26] focus:outline-none font-bold text-gray-500 text-xs min-w-[120px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Status</option>
                <option>ACTIVE</option>
                <option>SUSPENDED</option>
              </select>
              
              <select 
                className="px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-[#f95e26] focus:outline-none font-bold text-gray-500 text-xs min-w-[120px]"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>

              <select 
                className="px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-[#f95e26] focus:outline-none font-bold text-gray-500 text-xs min-w-[120px]"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option>All Users</option>
                <option>Admins</option>
                <option>Regular</option>
              </select>

              <button className="px-6 py-3 bg-[#f95e26] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#e8541f] transition-all">
                Search
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/30 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">City</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Ads</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Joined</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Badges</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              ['bg-blue-50 text-blue-500', 'bg-green-50 text-green-500', 'bg-orange-50 text-orange-500', 'bg-purple-50 text-purple-500'][user.name.length % 4]
                            }`}>
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            {user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 5 * 60 * 1000) && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1e293b] text-sm flex items-center gap-1">
                              {user.name}
                              {user.isAdmin && <ShieldCheckIcon className="w-3.5 h-3.5 text-orange-500" />}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">{user.phone || '—'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">{user.city || '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => { 
                            setSelectedUser(user); 
                            setEditingUser(user);
                            setFormData({ name: user.name, email: user.email, phone: user.phone || '', city: user.city || '', isAdmin: user.isAdmin, permissions: user.permissions || [], password: '' });
                            fetchUserAds(user._id); 
                            setView('details');
                          }}
                          className="text-[10px] font-black text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors"
                        >
                          {user.adCount || 0} ads
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {user.badges?.slice(0, 3).map(badge => {
                            const style = BADGE_STYLES[badge] || { label: badge, color: 'bg-gray-50 text-gray-600 border-gray-100', icon: CheckBadgeIcon };
                            const Icon = style.icon;
                            return (
                              <span key={badge} className={`px-2 py-0.5 ${style.color} rounded-md text-[9px] font-bold border flex items-center gap-1`}>
                                <Icon className="w-3 h-3" />
                                {style.label}
                              </span>
                            );
                          })}

                          {user.badges?.length > 3 && <span className="text-[9px] text-gray-400 flex items-center">+{user.badges.length - 3}</span>}
                          {(!user.badges || user.badges.length === 0) && <span className="text-gray-300 text-[10px]">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          user.isBanned ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                        }`}>
                          {user.isBanned ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => {
                              setBadgeUser(user);
                              setSelectedBadges(user.badges || []);
                              setShowBadgeModal(true);
                            }}
                            className="p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                            title="Assign Badges"
                          >
                            <CheckBadgeIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setEditingUser(user);
                              setFormData({ name: user.name, email: user.email, phone: user.phone || '', city: user.city || '', isAdmin: user.isAdmin, permissions: user.permissions || [], password: '' });
                              fetchUserAds(user._id);
                              setView('details');
                            }}
                            className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-500 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => toggleBan(user._id)}
                            className={`p-1.5 rounded-lg transition-colors ${user.isBanned ? 'text-green-500 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`}
                            title={user.isBanned ? 'Activate' : 'Suspend'}
                          >
                            {user.isBanned ? <CheckBadgeIcon className="w-5 h-5" /> : <PauseCircleIcon className="w-5 h-5" />}
                          </button>
                          <button 
                            onClick={() => deleteUser(user._id)}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="bg-gray-100 p-4 rounded-full mb-3">
                            <UserGroupIcon className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No users found in directory</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/10 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <p>Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {users.length} users</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white disabled:opacity-50"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      currentPage === i + 1 ? 'bg-[#f95e26] text-white shadow-lg shadow-orange-100' : 'border border-gray-200 hover:bg-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white disabled:opacity-50"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
              </div>
            </div>
          </>
        )}
      </>
    ) : (
        /* In-Page Detail & Edit View */
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden animate-slide-up">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setView('list')}
                className="p-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-[#f95e26] hover:border-[#f95e26] transition-all shadow-sm"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                  {editingUser ? 'User Profile' : 'New Administrator'}
                </h2>
                <p className="text-gray-400 font-bold mt-1">
                  {editingUser ? `Managing identity of ${editingUser.name}` : 'Provisioning new system access'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('list')}
                className="px-8 py-4 rounded-2xl font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest text-xs"
              >
                Go Back
              </button>
              <button 
                onClick={handleCreateOrUpdate}
                className="px-12 py-4 rounded-2xl font-black text-white bg-[#f95e26] hover:bg-[#e8541f] shadow-xl shadow-orange-100 transition-all uppercase tracking-widest text-sm"
              >
                {editingUser ? 'Update Profile' : 'Create Admin'}
              </button>
            </div>
          </div>
          
          <div className="p-10">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              {/* Left Column: Form Section */}
              <div className="space-y-10">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4" />
                    Core Identity Details
                  </h3>
                  
                  <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                        <div className="relative group">
                          <UserGroupIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f95e26]" />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#f95e26] focus:outline-none transition-all font-bold text-gray-900"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                        <div className="relative group">
                          <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f95e26]" />
                          <input 
                            type="email" 
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#f95e26] focus:outline-none transition-all font-bold text-gray-900"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                        <div className="relative group">
                          <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f95e26]" />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#f95e26] focus:outline-none transition-all font-bold text-gray-900"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Location / City</label>
                        <div className="relative group">
                          <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f95e26]" />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#f95e26] focus:outline-none transition-all font-bold text-gray-900"
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Security: {editingUser ? 'Reset Password (Leave blank to keep)' : 'Access Password'}</label>
                      <div className="relative group">
                        <ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f95e26]" />
                        <input 
                          type="password" 
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#f95e26] focus:outline-none transition-all font-bold text-gray-900"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          required={!editingUser}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-6 bg-gray-50/50 border border-gray-100 rounded-3xl">
                      <input 
                        type="checkbox" 
                        id="isAdminDetail" 
                        className="w-6 h-6 rounded-lg text-[#f95e26] focus:ring-[#f95e26] border-2 border-gray-200 cursor-pointer"
                        checked={formData.isAdmin}
                        onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
                      />
                      <div className="flex flex-col">
                        <label htmlFor="isAdminDetail" className="font-black text-gray-900 cursor-pointer">Administrative Privileges</label>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Grant access to internal dashboard & systems</span>
                      </div>
                    </div>

                    {formData.isAdmin && (
                      <div className="space-y-3 p-6 bg-gray-50/50 border border-gray-100 rounded-3xl animate-fade-in">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Admin Roles & Permissions</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { id: 'superadmin', label: 'Master Access', desc: 'Can see & do everything' },
                            { id: 'manage_users', label: 'Manage Users', desc: 'Create/Edit users & admins' },
                            { id: 'manage_ads', label: 'Manage Ads', desc: 'Approve or delete ads' },
                            { id: 'manage_categories', label: 'Manage Categories', desc: 'Edit system categories' },
                            { id: 'manage_cities', label: 'Manage Cities', desc: 'Edit locations' },
                            { id: 'view_reports', label: 'View Reports', desc: 'Access platform stats' },
                            { id: 'manage_seo', label: 'Manage SEO', desc: 'Update meta tags' },
                            { id: 'manage_settings', label: 'Manage Settings', desc: 'Update website config' }
                          ].map(perm => (
                            <label key={perm.id} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-[#f95e26]/30 transition-all">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded-md text-[#f95e26] focus:ring-[#f95e26] border-2 border-gray-200 mt-0.5 relative"
                                checked={formData.permissions.includes(perm.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setFormData({ ...formData, permissions: [...formData.permissions, perm.id] });
                                  else setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm.id) });
                                }}
                              />
                              <div>
                                <span className="font-bold text-gray-900 text-xs block">{perm.label}</span>
                                <span className="text-[9px] text-gray-400 font-bold max-w-full block leading-snug tracking-wider">{perm.desc}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                </div>
                
                {editingUser && (
                  <div className="p-8 bg-blue-50/30 border border-blue-100 rounded-[32px] flex items-start gap-5">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-blue-200">
                      <CalendarDaysIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-1">Account History</h4>
                      <p className="text-sm text-blue-700 font-bold mb-4 leading-relaxed">
                        User joined the platform on <span className="text-blue-900">{new Date(editingUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>. 
                        They have created <span className="text-blue-900 font-black">{editingUser.adCount || 0} listings</span> to date.
                      </p>
                      <button 
                        onClick={() => toggleBan(editingUser._id)}
                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                          editingUser.isBanned 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {editingUser.isBanned ? 'Restore Account Access' : 'Suspend Account'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: User Ads Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <EyeIcon className="w-4 h-4" />
                    Marketplace Inventory
                  </h3>
                  <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase">
                    {userAds.length} Listings Total
                  </span>
                </div>

                <div className="bg-gray-50/50 rounded-[40px] border border-gray-100 p-8 min-h-[500px] flex flex-col">
                  {adsLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f95e26]"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retrieving Listings...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userAds.map(ad => (
                        <div key={ad._id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:border-[#f95e26]/30 transition-all group">
                          <div className="w-20 h-20 bg-gray-50 rounded-[20px] overflow-hidden border border-gray-100 flex-shrink-0 shadow-inner">
                            {ad.images?.[0] ? (
                              <img src={getOptimizedImageUrl(ad.images[0], 200)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-200">
                                <PlusIcon className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1e293b] text-sm truncate">{ad.title}</h4>
                            <p className="text-[#f95e26] font-black text-xs mt-1">PKR {ad.price.toLocaleString()}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${
                                ad.isApproved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {ad.isApproved ? 'Live' : 'Hidden'}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">{ad.category?.name}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 text-[10px] font-black text-gray-400">
                             #{ad._id.slice(-6).toUpperCase()}
                             <div className="flex gap-2">
                               <button aria-label="View listing details" className="p-2 hover:bg-gray-50 rounded-xl text-gray-300 hover:text-[#f95e26] transition-all"><EyeIcon className="w-4 h-4" /></button>
                             </div>
                          </div>
                        </div>
                      ))}
                      
                      {userAds.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
                            <NoSymbolIcon className="w-12 h-12 text-gray-200" />
                          </div>
                          <h4 className="font-black text-gray-900 mb-1">No Listings Found</h4>
                          <p className="text-gray-400 font-bold text-xs max-w-[200px]">This user hasn't posted any advertisements yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Badge Modal */}
      {showBadgeModal && badgeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl space-y-5 animate-scale-up mx-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-900">Assign Badges</h3>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">Managing accolades for {badgeUser.name}</p>
              </div>
              <button onClick={() => setShowBadgeModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { id: 'verified', desc: 'Identity has been manually verified' },
                { id: 'topSeller', desc: 'High performance based on activities' },
                { id: 'premium', desc: 'Paid tier or exclusive accounts' },
                { id: 'business', desc: 'Registered enterprise account' },
                { id: 'quickResponder', desc: 'Replies quickly to customer inquiries' }
              ].map(badgeItem => {
                const style = BADGE_STYLES[badgeItem.id] || { label: badgeItem.id, color: 'text-gray-600', icon: CheckBadgeIcon };
                const Icon = style.icon;
                const badgeTextColorClass = style.color.split(' ').find(c => c.startsWith('text-')) || 'text-gray-800';
                return (
                  <label key={badgeItem.id} className="flex items-start gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-md text-[#f95e26] focus:ring-[#f95e26] border-2 border-gray-200 mt-0.5"
                      checked={selectedBadges.includes(badgeItem.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedBadges([...selectedBadges, badgeItem.id]);
                        else setSelectedBadges(selectedBadges.filter(b => b !== badgeItem.id));
                      }}
                    />
                    <div>
                      <span className={`font-bold ${badgeTextColorClass} text-sm flex items-center gap-1`}>
                        <Icon className="w-4 h-4" />
                        {style.label}
                      </span>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{badgeItem.desc}</p>
                    </div>
                  </label>
                );
              })}

            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowBadgeModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await api.put(`/users/admin/${badgeUser._id}`, { badges: selectedBadges });
                    setShowBadgeModal(false);
                    fetchUsers();
                  } catch (err) {
                    alert('Failed to update badges');
                  }
                }}
                className="flex-1 py-3 bg-[#f95e26] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#e8541f] shadow-lg shadow-orange-100 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
