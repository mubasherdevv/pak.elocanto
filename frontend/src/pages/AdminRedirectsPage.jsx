import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  LinkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function AdminRedirectsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [redirects, setRedirects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [formData, setFormData] = useState({
    fromPath: '',
    toPath: '',
    statusCode: 301,
    description: '',
    isActive: true
  });

  const fetchRedirects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/redirects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRedirects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch Redirects Error:', err);
      toast.error('Failed to load redirects');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/redirects', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(editingId ? 'Redirect Updated!' : 'Redirect Created!');
      setShowForm(false);
      resetForm();
      fetchRedirects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save redirect');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      fromPath: item.fromPath,
      toPath: item.toPath,
      statusCode: item.statusCode || 301,
      description: item.description || '',
      isActive: item.isActive
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this redirect mapping?')) return;
    try {
      await api.delete(`/admin/redirects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Redirect removed');
      fetchRedirects();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      fromPath: '',
      toPath: '',
      statusCode: 301,
      description: '',
      isActive: true
    });
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredRedirects.map(item => item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} redirects?`)) return;
    
    try {
      await api.post('/admin/redirects/bulk-delete', { ids: selectedIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Redirects deleted successfully');
      setSelectedIds([]);
      fetchRedirects();
    } catch (error) {
      toast.error('Bulk delete failed');
    }
  };

  const filteredRedirects = redirects.filter(item => 
    item.fromPath.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.toPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">URL Redirect Manager</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Manage 301/302 redirects for your website pages.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black hover:bg-orange-500 transition-all shadow-xl shadow-gray-200"
          >
            <PlusIcon className="w-5 h-5" /> Add Redirect
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 shadow-xl shadow-orange-50/50 animate-slide-up">
          <h2 className="text-2xl font-black text-gray-900 italic mb-8 uppercase">
            {editingId ? 'Edit' : 'Create'} Redirect Rule
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">From Path (Old URL)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">/</span>
                  <input 
                    type="text"
                    className="w-full pl-8 pr-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50"
                    placeholder="old-page-url"
                    value={formData.fromPath.startsWith('/') ? formData.fromPath.substring(1) : formData.fromPath}
                    onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith('/')) val = '/' + val;
                        setFormData({ ...formData, fromPath: val });
                    }}
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 ml-2 italic">Example: /old-category-name</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">To Path (New URL)</label>
                <input 
                  type="text"
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50"
                  placeholder="/new-page-url or https://..."
                  value={formData.toPath}
                  onChange={(e) => setFormData({ ...formData, toPath: e.target.value })}
                  required
                />
                <p className="text-[10px] text-gray-400 mt-2 ml-2 italic">Relative path starts with / EX: /new-name</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Status Code</label>
                <select 
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50 appearance-none"
                  value={formData.statusCode}
                  onChange={(e) => setFormData({ ...formData, statusCode: Number(e.target.value) })}
                >
                  <option value={301}>301 - Permanent Redirect (Recommended)</option>
                  <option value={302}>302 - Temporary Redirect</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Internal Note (Optional)</label>
                <input 
                  type="text"
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50"
                  placeholder="Why is this redirecting?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 ml-2">
                <input 
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded-lg text-orange-500"
                />
                <span className="text-sm font-black text-gray-700 uppercase tracking-tighter">Active</span>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-orange-500 shadow-xl transition-all active:scale-[0.98]">
                  Save Redirect
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 border-2 border-gray-100 rounded-[1.5rem] font-black text-gray-400 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by old path, new path or description..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-10">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedIds.length === filteredRedirects.length && filteredRedirects.length > 0}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
              </th>
              <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Redirect Rule</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Type</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredRedirects.map((item) => (
              <tr key={item._id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(item._id) ? 'bg-orange-50/30' : ''}`}>
                <td className="px-8 py-6">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(item._id)}
                    onChange={() => handleToggleSelect(item._id)}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                </td>
                <td className="px-4 py-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 tracking-tight bg-gray-100 px-2 py-0.5 rounded-lg">{item.fromPath}</span>
                        <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-black text-orange-600 tracking-tight">{item.toPath}</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 mt-1 max-w-sm truncate italic">
                        {item.description || 'No internal notes added.'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    {item.statusCode}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(item)} className="p-2.5 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-blue-500 shadow-sm transition-all"><PencilSquareIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(item._id)} className="p-2.5 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-red-500 shadow-sm transition-all"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {redirects.length === 0 && !loading && (
              <tr>
                <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-black italic">No Redirects found. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 z-50 animate-slide-up border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 pr-8 border-r border-white/10">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-black text-sm">
              {selectedIds.length}
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-gray-400">Rules Selected</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black text-xs transition-all uppercase tracking-widest border border-red-500/20"
            >
              <TrashIcon className="w-4 h-4" /> Delete All
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 hover:bg-white/5 rounded-xl font-black text-xs transition-all uppercase tracking-widest text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
