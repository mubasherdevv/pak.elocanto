import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  TrashIcon,
  UserIcon,
  MegaphoneIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

import { useAuth } from '../context/AuthContext';

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-blue-100 text-blue-700',
  contact: 'bg-purple-100 text-purple-700',
  view: 'bg-gray-100 text-gray-700',
  report: 'bg-orange-100 text-orange-700',
  favorite: 'bg-pink-100 text-pink-700',
  ban: 'bg-red-100 text-red-700',
  settings: 'bg-indigo-100 text-indigo-700'
};

const getActionColor = (actionType) => {
  const createActions = ['CREATE_AD', 'CREATE_CATEGORY', 'CREATE_SUBCATEGORY', 'POST_AD', 'USER_REGISTER'];
  const updateActions = ['EDIT_AD', 'EDIT_USER_AD', 'EDIT_CATEGORY', 'EDIT_SUBCATEGORY', 'ASSIGN_BADGE', 'UPDATE_SETTINGS', 'UPDATE_SEO'];
  const deleteActions = ['DELETE_AD', 'DELETE_CATEGORY', 'DELETE_SUBCATEGORY', 'DELETE_USER_AD'];
  const loginActions = ['ADMIN_LOGIN', 'ADMIN_LOGOUT', 'USER_LOGIN'];
  const contactActions = ['CONTACT_SELLER_CALL', 'CONTACT_SELLER_WHATSAPP'];
  const viewActions = ['VIEW_AD'];
  const reportActions = ['REPORT_AD'];
  const favoriteActions = ['ADD_FAVORITE', 'REMOVE_FAVORITE'];
  const banActions = ['BAN_USER', 'UNBAN_USER'];
  const settingsActions = ['UPDATE_SETTINGS', 'UPDATE_SEO'];

  if (createActions.includes(actionType)) return ACTION_COLORS.create;
  if (updateActions.includes(actionType)) return ACTION_COLORS.update;
  if (deleteActions.includes(actionType)) return ACTION_COLORS.delete;
  if (loginActions.includes(actionType)) return ACTION_COLORS.login;
  if (contactActions.includes(actionType)) return ACTION_COLORS.contact;
  if (viewActions.includes(actionType)) return ACTION_COLORS.view;
  if (reportActions.includes(actionType)) return ACTION_COLORS.report;
  if (favoriteActions.includes(actionType)) return ACTION_COLORS.favorite;
  if (banActions.includes(actionType)) return ACTION_COLORS.ban;
  if (settingsActions.includes(actionType)) return ACTION_COLORS.settings;
  return 'bg-gray-100 text-gray-700';
};

const formatAction = (actionType) => {
  return actionType.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
};

function AdminLogsTab() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ actionType: '', adminName: '', startDate: '', endDate: '' });
  const [actionTypes, setActionTypes] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchActionTypes();
  }, [token, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      const { data } = await api.get(`/admin/logs/admin?${params}`);
      setLogs(data.logs);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Error fetching admin logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActionTypes = async () => {
    try {
      if (!token) return;
      const { data } = await api.get('/admin/logs/types?type=admin');
      setActionTypes(data);
    } catch (err) {
      console.error('Error fetching action types:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Search Admin</label>
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by admin name..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-orange-500 focus:outline-none bg-gray-50/50"
              value={filters.adminName}
              onChange={(e) => handleFilterChange('adminName', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Action Type</label>
          <select
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-orange-500 focus:outline-none bg-gray-50/50"
            value={filters.actionType}
            onChange={(e) => handleFilterChange('actionType', e.target.value)}
          >
            <option value="">All Actions</option>
            {actionTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Start Date</label>
          <input
            type="date"
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-orange-500 focus:outline-none bg-gray-50/50"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        <div className="w-40">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">End Date</label>
          <input
            type="date"
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-orange-500 focus:outline-none bg-gray-50/50"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
        <button
          onClick={applyFilters}
          className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-black hover:bg-orange-600 transition-colors"
        >
          <FunnelIcon className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : logs.length > 0 ? (
        <>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <ShieldCheckIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{log.adminId?.name || 'Admin'}</p>
                          <p className="text-xs text-gray-400">{log.adminId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getActionColor(log.actionType)}`}>
                        {formatAction(log.actionType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-400">{log.targetType}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-700">{new Date(log.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 font-mono">{log.ipAddress || '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <span className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-black text-gray-900">No Admin Activity</h2>
          <p className="text-gray-400 mt-2">No admin activity logs found.</p>
        </div>
      )}
    </div>
  );
}

function UserLogsTab() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ actionType: '', userName: '', startDate: '', endDate: '', suspicious: '' });
  const [actionTypes, setActionTypes] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchActionTypes();
  }, [token, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      const { data } = await api.get(`/admin/logs/user?${params}`);
      setLogs(data.logs);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Error fetching user logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActionTypes = async () => {
    try {
      if (!token) return;
      const { data } = await api.get('/admin/logs/types?type=user');
      setActionTypes(data);
    } catch (err) {
      console.error('Error fetching action types:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Search User</label>
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-orange-500 focus:outline-none bg-gray-50/50"
              value={filters.userName}
              onChange={(e) => handleFilterChange('userName', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Action Type</label>
          <select
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-orange-500 focus:outline-none bg-gray-50/50"
            value={filters.actionType}
            onChange={(e) => handleFilterChange('actionType', e.target.value)}
          >
            <option value="">All Actions</option>
            {actionTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Start Date</label>
          <input
            type="date"
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-orange-500 focus:outline-none bg-gray-50/50"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        <div className="w-40">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">End Date</label>
          <input
            type="date"
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-orange-500 focus:outline-none bg-gray-50/50"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
        <button
          onClick={applyFilters}
          className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-black hover:bg-orange-600 transition-colors"
        >
          <FunnelIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 accent-orange-500 rounded"
            checked={filters.suspicious === 'true'}
            onChange={(e) => handleFilterChange('suspicious', e.target.checked ? 'true' : '')}
          />
          <span className="text-sm font-bold text-gray-700">Show Suspicious Activity Only</span>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : logs.length > 0 ? (
        <>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Location/IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserCircleIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{log.userId?.name || 'User'}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-400">{log.userId?.email || ''}</p>
                            {log.userId?.isBanned && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-full">Banned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getActionColor(log.actionType)}`}>
                        {formatAction(log.actionType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-400">{log.targetType}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-700">{new Date(log.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 font-mono">{log.location || log.ipAddress || '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <span className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-xl font-black text-gray-900">No User Activity</h2>
          <p className="text-gray-400 mt-2">No user activity logs found.</p>
        </div>
      )}
    </div>
  );
}

function ReportsContent() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [token]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!token) return;
      const { data } = await api.get('/admin/reports');
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      if (!token) return;
      await api.put(`/admin/reports/${id}`, { status });
      fetchReports();
    } catch (err) {
      console.error('Error updating report status:', err);
      alert('Failed to update status');
    }
  };

  const deleteAd = async (adId, reportId) => {
    if (window.confirm('Delete this reported ad? This will also resolve the report.')) {
      try {
        if (!token) return;
        await api.delete(`/ads/${adId}`);
        await api.put(`/admin/reports/${reportId}`, { status: 'resolved', adminNotes: 'Ad deleted by admin.' });
        fetchReports();
      } catch (err) {
        console.error('Error deleting ad from report:', err);
        alert('Failed to delete ad');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Review and manage flags raised by the community.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.length > 0 ? reports.map((report) => (
          <div key={report._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-6 md:w-1/3">
              <div className="flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest mb-4">
                <MegaphoneIcon className="w-4 h-4" />
                Reported Content
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0">
                  {report.ad?.images?.[0] ? (
                    <img src={report.ad.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                      <ExclamationTriangleIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{report.ad?.title || 'Ad Removed/Missing'}</h3>
                  <p className="text-sm font-black text-orange-500 mt-1">Rs {report.ad?.price.toLocaleString()}</p>
                  <button onClick={() => window.open(`/ads/${report.ad?._id}`, '_blank')} className="text-xs font-bold text-blue-500 hover:underline mt-2 flex items-center gap-1">
                    <EyeIcon className="w-3 h-3" /> View Listing
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 md:w-1/3">
              <div className="flex items-center gap-2 text-xs font-black text-blue-500 uppercase tracking-widest mb-4">
                <UserIcon className="w-4 h-4" />
                Reporter Detail
              </div>
              <p className="font-bold text-gray-900">{report.reporter?.name}</p>
              <p className="text-xs text-gray-500 font-medium">{report.reporter?.email}</p>
              <div className="mt-4 p-4 bg-red-50 rounded-2xl">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">Reason for report</p>
                <p className="text-sm text-gray-700 font-medium leading-relaxed italic">"{report.reason}"</p>
              </div>
            </div>

            <div className="p-6 md:w-1/3 bg-gray-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                  <CheckCircleIcon className="w-4 h-4" />
                  Accountability
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    report.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                    report.status === 'resolved' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {report.status}
                  </span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase py-1">{new Date(report.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => handleStatusChange(report._id, 'resolved')}
                  className="flex-1 bg-white border border-gray-100 py-3 rounded-2xl px-4 text-xs font-black text-green-600 hover:bg-green-50 transition-colors shadow-sm"
                >
                  Resolve
                </button>
                <button 
                  onClick={() => handleStatusChange(report._id, 'dismissed')}
                  className="flex-1 bg-white border border-gray-100 py-3 rounded-2xl px-4 text-xs font-black text-gray-400 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => deleteAd(report.ad?._id, report._id)}
                  className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm border border-red-100"
                  title="Delete Ad"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="text-xl font-black text-gray-900">All clear!</h2>
            <p className="text-gray-400 mt-2">There are no pending reports for moderation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('admin-logs');

  const tabs = [
    { id: 'admin-logs', name: 'Admin Activity Logs', icon: ShieldCheckIcon },
    { id: 'user-logs', name: 'User Activity Logs', icon: UserCircleIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-100/50 p-1.5 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-orange-500' : 'text-gray-400'}`} />
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'admin-logs' && <AdminLogsTab />}
      {activeTab === 'user-logs' && <UserLogsTab />}
    </div>
  );
}
