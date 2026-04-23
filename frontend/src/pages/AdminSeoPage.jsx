import React, { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { PlusIcon, PencilSquareIcon, TrashIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange }) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange} 
        modules={modules}
        className="prose max-w-none min-h-[180px]"
      />
    </div>
  );
};

export default function AdminSeoPage() {
  const { token } = useAuth();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Entity data for dropdowns
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [hotels, setHotels] = useState([]);

  // Selection states
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [pageType, setPageType] = useState('home');
  const [targetSlug, setTargetSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchContents();
    fetchEntities();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/seo');
      setContents(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch contents');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const [catRes, subRes, cityRes, areaRes, hotelRes] = await Promise.all([
        api.get('/categories'),
        api.get('/subcategories'),
        api.get('/cities'),
        api.get('/areas'),
        api.get('/hotels')
      ]);
      setCategories(catRes.data);
      setSubcategories(subRes.data);
      setCities(cityRes.data);
      setAreas(areaRes.data);
      setHotels(hotelRes.data);
    } catch (err) {
      console.error('Failed to fetch entities', err);
    }
  };

  // Filtered lists
  const filteredSubcategories = useMemo(() => {
    if (!selectedCategoryId) return subcategories;
    return subcategories.filter(s => s.category?._id === selectedCategoryId || s.category === selectedCategoryId);
  }, [subcategories, selectedCategoryId]);

  const filteredAreas = useMemo(() => {
    if (!selectedCityId) return areas;
    return areas.filter(a => a.city?._id === selectedCityId || a.city === selectedCityId);
  }, [areas, selectedCityId]);

  const filteredHotels = useMemo(() => {
    if (!selectedCityId) return hotels;
    return hotels.filter(h => h.city?._id === selectedCityId || h.city === selectedCityId);
  }, [hotels, selectedCityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return alert('Title and Description are required');

    const payload = { 
      title, 
      description, 
      pageType, 
      targetSlug: pageType === 'home' ? '' : targetSlug, 
      isActive 
    };

    try {
      if (editingId) {
        await api.put(`/seo/${editingId}`, payload);
        setSuccess('Content updated successfully!');
      } else {
        await api.post('/seo', payload);
        setSuccess('Content created successfully!');
      }
      setIsModalOpen(false);
      resetForm();
      fetchContents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    try {
      await api.delete(`/seo/${id}`);
      setSuccess('Deleted successfully');
      fetchContents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setTitle(item.title);
    setPageType(item.pageType);
    setTargetSlug(item.targetSlug || '');
    setIsActive(item.isActive);
    setDescription(item.description || '');
    
    // Try to pre-select parents if editing
    if (item.pageType === 'subcategory') {
        const sub = subcategories.find(s => s.slug === item.targetSlug);
        if (sub) setSelectedCategoryId(sub.category?._id || sub.category);
    }
    if (item.pageType === 'area' || item.pageType === 'hotel') {
        const entity = (item.pageType === 'area' ? areas : hotels).find(e => e.slug === item.targetSlug);
        if (entity) setSelectedCityId(entity.city?._id || entity.city);
    }

    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setPageType('home');
    setTargetSlug('');
    setIsActive(true);
    setDescription('');
    setSelectedCityId('');
    setSelectedCategoryId('');
  };

  if (loading && contents.length === 0) return <div className="text-center p-8 text-gray-500 font-bold">Loading SEO Content...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">SEO Content Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage optimized sections above website footers.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 text-sm"
        >
          <PlusIcon className="w-5 h-5" /> Add Content
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl flex items-center gap-2 animate-bounce-short">
          <CheckCircleIcon className="w-5 h-5" /> {success}
        </div>
      )}

      {!isModalOpen ? (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] uppercase font-black tracking-widest">
              <th className="p-4">Section Title</th>
              <th className="p-4">Target Page</th>
              <th className="p-4">Slug</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((item) => (
              <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-bold text-gray-900">{item.title}</td>
                <td className="p-4">
                  <span className="text-[10px] font-black uppercase py-1 px-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {item.pageType.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-gray-500">{item.targetSlug || '---'}</td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] font-black uppercase py-1 px-2.5 rounded-lg ${item.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {item.isActive ? 'Live' : 'Hidden'}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-1">
                  <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit"><PencilSquareIcon className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
            {contents.length === 0 && (
                <tr>
                    <td colSpan="5" className="p-12 text-center text-gray-400 font-medium">No SEO content found. Create your first section!</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl animate-fade-in max-w-4xl mx-auto">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center">
                    {editingId ? <PencilSquareIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
                </div>
                {editingId ? 'Edit SEO Section' : 'Create New SEO Section'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Section Heading (Visible to Users)</label>
                <input 
                    type="text" 
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-orange-500 transition-all font-bold text-gray-800" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Best Classifieds in Pakistan"
                    required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Page Type</label>
                  <select 
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-orange-500 transition-all font-bold text-gray-800" 
                    value={pageType} 
                    onChange={e => {
                        setPageType(e.target.value);
                        setTargetSlug('');
                    }}
                  >
                    <option value="home">Homepage</option>
                    <option value="category">Category Page</option>
                    <option value="subcategory">Subcategory Page</option>
                    <option value="city">City Page</option>
                    <option value="area">Area (Location) Page</option>
                    <option value="hotel">Hotel Page</option>
                    <option value="ad_detail">Individual Ad Detail</option>
                    <option value="login">Auth - Login</option>
                    <option value="register">Auth - Register</option>
                    <option value="profile">User Profile</option>
                  </select>
                </div>

                {/* Conditional Targeting Dropdowns */}
                {pageType === 'category' && (
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Select Category</label>
                        <select 
                            className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-orange-500 transition-all font-bold text-gray-800"
                            value={targetSlug}
                            onChange={e => setTargetSlug(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Category --</option>
                            {categories.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
                        </select>
                    </div>
                )}

                {pageType === 'subcategory' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1">1. Filter by Category</label>
                            <select 
                                className="w-full px-5 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-orange-500 text-sm font-bold"
                                value={selectedCategoryId}
                                onChange={e => setSelectedCategoryId(e.target.value)}
                            >
                                <option value="">Show All Subcategories</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">2. Select Subcategory</label>
                            <select 
                                className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-orange-500 transition-all font-bold text-gray-800"
                                value={targetSlug}
                                onChange={e => setTargetSlug(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Subcategory --</option>
                                {filteredSubcategories.map(s => <option key={s._id} value={s.slug}>{s.name} ({s.category?.name || 'Uncategorized'})</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {pageType === 'city' && (
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Select City</label>
                        <select 
                            className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-orange-500 transition-all font-bold text-gray-800"
                            value={targetSlug}
                            onChange={e => setTargetSlug(e.target.value)}
                            required
                        >
                            <option value="">-- Choose City --</option>
                            {cities.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
                        </select>
                    </div>
                )}

                {(pageType === 'area' || pageType === 'hotel') && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1">1. Filter by City</label>
                            <select 
                                className="w-full px-5 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:outline-orange-500 text-sm font-bold"
                                value={selectedCityId}
                                onChange={e => setSelectedCityId(e.target.value)}
                            >
                                <option value="">Show All Locations</option>
                                {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">2. Select {pageType === 'area' ? 'Area' : 'Hotel'}</label>
                            <select 
                                className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-orange-500 transition-all font-bold text-gray-800"
                                value={targetSlug}
                                onChange={e => setTargetSlug(e.target.value)}
                                required
                            >
                                <option value="">-- Choose {pageType === 'area' ? 'Area' : 'Hotel'} --</option>
                                {(pageType === 'area' ? filteredAreas : filteredHotels).map(e => (
                                    <option key={e._id} value={e.slug}>{e.name} ({e.city?.name || 'N/A'})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {(pageType === 'ad_detail') && (
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Specific Ad Slug (e.g. toyota-corolla-2022)</label>
                    <input 
                        type="text" 
                        className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-orange-500 transition-all font-bold text-gray-800" 
                        value={targetSlug} 
                        onChange={e => setTargetSlug(e.target.value)} 
                        placeholder="Leave blank for ALL ads"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Description (Rich SEO Content)</label>
                <RichTextEditor value={description} onChange={setDescription} />
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <input 
                    type="checkbox" 
                    id="published"
                    checked={isActive} 
                    onChange={e => setIsActive(e.target.checked)} 
                    className="w-5 h-5 rounded-lg text-orange-500 focus:ring-orange-500 cursor-pointer" 
                />
                <label htmlFor="published" className="text-sm font-black text-gray-700 cursor-pointer uppercase tracking-tight">Active / Published on Site</label>
              </div>

              <div className="flex gap-4 pt-8 border-t border-gray-100">
                <button type="submit" className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-orange-500/25">
                  {editingId ? 'Save Content Edits' : 'Publish SEO Content'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-[0.5] py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

