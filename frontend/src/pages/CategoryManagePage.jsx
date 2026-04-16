import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChevronRightIcon,
  ChartBarIcon,
  TagIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageUtils';

export default function CategoryManagePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [stats, setStats] = useState({
    totalAds: 0,
    totalSubcategories: 0,
    activeAds: 0,
    inactiveAds: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(''); // Category ID for filtering subcategories

  // Inline Form state
  const [showForm, setShowForm] = useState(false);
  const [modalType, setModalType] = useState('category'); // 'category' or 'subcategory'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: '',
    category: '', // Used for subcategory parent
    subcategory: '' // Used for sub-subcategory parent
  });

  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, subRes, subSubRes] = await Promise.all([
        api.get('/categories'),
        api.get('/subcategories'),
        api.get('/categories/subsub')
      ]);
      setCategories(catRes.data);
      setSubcategories(subRes.data);
      setSubSubCategories(subSubRes.data);
    } catch (err) {
      console.error('Error fetching taxonomy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/analytics');
      if (data.stats) {
        setStats({
          totalAds: data.stats.totalAds,
          totalSubcategories: data.stats.totalSubcategories,
          activeAds: data.stats.activeAds,
          inactiveAds: data.stats.inactiveAds
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleOpenForm = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (item) {
      setFormData({
        name: item.name,
        image: item.image || '',
        description: item.description || '',
        category: type === 'subcategory' ? (item.category?._id || item.category) : '',
        subcategory: type === 'subSubCategory' ? (item.subcategory?._id || item.subcategory) : ''
      });
    } else {
      setFormData({ name: '', image: '', description: '', category: '', subcategory: '' });
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const compressedFile = await compressImage(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });
      const upData = new FormData();
      upData.append('images', compressedFile);
      
      const { data } = await api.post('/upload', upData);
      setFormData(prev => ({ ...prev, image: data.urls[0] }));
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = modalType === 'category' ? '/categories' : (modalType === 'subcategory' ? '/subcategories' : '/categories/subsub');
      const itemLabel = modalType === 'category' ? 'Category' : (modalType === 'subcategory' ? 'Subcategory' : 'Sub-subcategory');

      if (editingItem) {
        await api.put(`${endpoint}/${editingItem._id}`, formData);
        setMessage(`${itemLabel} updated!`);
      } else {
        await api.post(endpoint, formData);
        setMessage(`${itemLabel} created!`);
      }

      setShowForm(false);
      fetchData();
      fetchStats();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving item:', err);
      alert(err.response?.data?.message || 'Failed to save.');
    }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm(`Delete this ${type}? This action cannot be undone.`)) {
      try {
        const endpoint = type === 'category' ? '/categories' : (type === 'subcategory' ? '/subcategories' : '/categories/subsub');
        await api.delete(`${endpoint}/${id}`);
        fetchData();
        fetchStats();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed.');
      }
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubcategories = subcategories.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? (s.category?._id === categoryFilter || s.category === categoryFilter) : true;
    return matchesSearch && matchesCategory;
  });

  const filteredSubSubCategories = subSubCategories.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subcategory?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Category Management</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Manage categories and subcategories.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search taxonomy..."
              className="pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl w-64 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none font-bold text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!showForm && (
            <button
              onClick={() => handleOpenForm(activeTab === 'categories' ? 'category' : (activeTab === 'subcategories' ? 'subcategory' : 'subSubCategory'))}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black hover:bg-orange-500 transition-all shadow-xl shadow-gray-200 active:scale-95"
            >
              <PlusIcon className="w-5 h-5" />
              Add {activeTab === 'categories' ? 'Category' : (activeTab === 'subcategories' ? 'Subcategory' : 'Sub-subcategory')}
            </button>
          )}
        </div>
      </div>

      {/* Analysis Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Ads', value: stats.totalAds, icon: ChartBarIcon, color: 'blue' },
          { label: 'Subcategories', value: stats.totalSubcategories, icon: TagIcon, color: 'purple' },
          { label: 'Active Ads', value: stats.activeAds, icon: CheckBadgeIcon, color: 'green' },
          { label: 'Inactive Ads', value: stats.inactiveAds, icon: ExclamationCircleIcon, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-500`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
              <div className="text-2xl font-black text-gray-900 tabular-nums">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Inline Form Section */}
      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 shadow-xl shadow-orange-50/50 animate-slide-up relative">
          <button
            onClick={() => setShowForm(false)}
            className="absolute top-6 right-6 p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-black text-gray-900 italic mb-8">
            {editingItem ? 'EDIT' : 'ADD'} {modalType.toUpperCase()}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Name</label>
                <input
                  type="text"
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 focus:outline-none transition-all font-bold bg-gray-50/50"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {modalType === 'subcategory' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Parent Category</label>
                  <select
                    className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 focus:outline-none transition-all font-bold bg-gray-50/50 appearance-none"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {modalType === 'subSubCategory' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Parent Subcategory</label>
                  <select
                    className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 focus:outline-none transition-all font-bold bg-gray-50/50 appearance-none"
                    required
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  >
                    <option value="">Select Subcategory...</option>
                    {subcategories.map(s => <option key={s._id} value={s._id}>{s.name} ({s.category?.name})</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Category Image</label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <PhotoIcon className="w-8 h-8 text-gray-200" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="file" id="cat-image" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <label htmlFor="cat-image" className="cursor-pointer px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl text-xs font-black shadow-sm flex items-center gap-2 hover:border-orange-500 transition-colors">
                      <PhotoIcon className="w-4 h-4" />
                      {uploading ? 'Compressing...' : (formData.image ? 'Change Image' : 'Upload Image')}
                    </label>
                    <input
                      type="text"
                      className="w-full mt-3 px-4 py-2 rounded-xl border border-gray-100 focus:border-orange-500 focus:outline-none transition-all font-bold bg-white text-xs"
                      placeholder="Or paste image URL here..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                    <p className="text-[10px] text-gray-400 font-bold mt-2 ml-1">Auto-compressed & WebP converted</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Description</label>
                <textarea
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 focus:outline-none transition-all font-bold bg-gray-50/50 h-[10.5rem] resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-orange-500 shadow-lg transition-all active:scale-[0.98]"
                >
                  {editingItem ? 'Update now' : 'Save taxonomy'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 py-4 border-2 border-gray-100 rounded-[1.5rem] font-black text-gray-400 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tabs UI & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 p-1.5 bg-gray-100/50 rounded-2xl w-fit border border-gray-100">
          <button
            onClick={() => { setActiveTab('categories'); setShowForm(false); setCategoryFilter(''); }}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => { setActiveTab('subcategories'); setShowForm(false); }}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'subcategories' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            Subcategories ({subcategories.length})
          </button>
          <button
            onClick={() => { setActiveTab('subSubCategories'); setShowForm(false); }}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'subSubCategories' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            Sub-subs ({subSubCategories.length})
          </button>
        </div>

        {activeTab === 'subcategories' && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter by Category:</span>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {message && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-600 rounded-2xl text-xs font-black animate-slide-up border border-green-100">
          <CheckCircleIcon className="w-5 h-5" /> {message}
        </div>
      )}

      {/* Tables Section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {activeTab === 'categories' ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subcategories</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ad Impact</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCategories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                        <img src={cat.image || 'https://via.placeholder.com/150'} alt={cat.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-base font-black text-gray-900 leading-tight">{cat.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1 italic truncate w-40">{cat.description || 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform cursor-pointer" onClick={() => { setActiveTab('subcategories'); setSearchTerm(cat.name); }}>
                      <span className="text-sm font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg tabular-nums">
                        {cat.subcategoryCount || 0}
                      </span>
                      <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full">
                      {cat.adCount || 0} ADS
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenForm('category', cat)} className="p-2.5 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-blue-500 shadow-sm transition-all"><PencilSquareIcon className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete('category', cat._id)} className="p-2.5 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-red-500 shadow-sm transition-all"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'subcategories' ? (
          <table className="w-full text-left font-bold">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subcategory</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ad Volume</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSubcategories.map((sub) => (
                <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-gray-900 group-hover:text-orange-500 transition-colors">{sub.name}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg tracking-widest border border-gray-200">
                      {sub.category?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-gray-400 italic">
                      <span className="text-gray-900 not-italic font-black tabular-nums mr-1">{sub.adCount || 0}</span> ads
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/subcategories/${sub._id}/ads`)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-white text-[10px] text-gray-500 font-black uppercase tracking-widest rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-all"
                      >
                        <EyeIcon className="w-4 h-4 text-orange-500" /> View Ads
                      </button>
                      <button onClick={() => handleOpenForm('subcategory', sub)} className="p-2.5 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-blue-500 shadow-sm transition-all"><PencilSquareIcon className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete('subcategory', sub._id)} className="p-2.5 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-red-500 shadow-sm transition-all"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left font-bold">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sub-subcategory</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent Sub</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSubSubCategories.map((subSub) => (
                <tr key={subSub._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-gray-900 group-hover:text-orange-500 transition-colors">{subSub.name}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg tracking-widest border border-gray-200">
                      {subSub.subcategory?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => handleOpenForm('subSubCategory', subSub)} className="p-2.5 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-blue-500 shadow-sm transition-all"><PencilSquareIcon className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete('subSubCategory', subSub._id)} className="p-2.5 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-red-500 shadow-sm transition-all"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) }

        {((activeTab === 'categories' && filteredCategories.length === 0) ||
          (activeTab === 'subcategories' && filteredSubcategories.length === 0) ||
          (activeTab === 'subSubCategories' && filteredSubSubCategories.length === 0)) && (
            <div className="p-20 text-center bg-gray-50/30">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-100 mx-auto mb-4" />
              <p className="text-gray-400 font-black italic">No records found matching your search criteria.</p>
            </div>
          )}
      </div>
    </div>
  );
}
