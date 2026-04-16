import React, { useState, useEffect } from 'react';
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

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = keywordInput.trim().replace(',', '');
      if (value && !keywords.includes(value)) {
        setKeywords([...keywords, value]);
      }
      setKeywordInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return alert('Title and Description are required');

    const payload = { title, description, pageType, targetSlug: pageType === 'home' ? '' : targetSlug, isActive };

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
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setPageType('home');
    setTargetSlug('');
    setIsActive(true);
    setDescription('');
  };

  if (loading && contents.length === 0) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">SEO Content Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage optimized sections above website footers.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all text-sm"
        >
          <PlusIcon className="w-5 h-5" /> Add Content
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" /> {success}
        </div>
      )}

      {!isModalOpen ? (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs uppercase font-black tracking-wider">
              <th className="p-4">Title</th>
              <th className="p-4">Targeting</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((item) => (
              <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-4 font-bold text-gray-900">{item.title}</td>
                <td className="p-4">
                  <span className="text-xs font-bold uppercase py-1 px-2 rounded-lg bg-gray-100 text-gray-600">
                    {item.pageType} {item.targetSlug ? `(${item.targetSlug})` : ''}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold uppercase py-1 px-2 rounded-lg ${item.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><PencilSquareIcon className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(item._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in">
          <div className="w-full">
            <h2 className="text-xl font-black text-gray-900 mb-6">{editingId ? 'Edit SEO Content' : 'Add SEO Content'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-2">Section Heading (Visible on Page)</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-orange-500" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-2">Page Type</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-orange-500" value={pageType} onChange={e => setPageType(e.target.value)}>
                    <option value="home">Homepage</option>
                    <option value="category">Category</option>
                    <option value="subcategory">Subcategory</option>
                    <option value="ad_detail">Ad Detail Page</option>
                    <option value="login">Login Page</option>
                    <option value="register">Register Page</option>
                    <option value="profile">Profile Page</option>
                  </select>
                </div>
                {pageType !== 'home' && (
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase mb-2">Target Slug (e.g. mobiles)</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-orange-500" value={targetSlug} onChange={e => setTargetSlug(e.target.value)} required />
                  </div>
                )}
              </div>



              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-2">Description (Rich Text)</label>
                <RichTextEditor value={description} onChange={setDescription} />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded text-orange-500" />
                <label className="text-sm font-bold text-gray-700">Active / Published</label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button type="submit" className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all">
                  {editingId ? 'Save Edits' : 'Create Content'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black transition-all">
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
