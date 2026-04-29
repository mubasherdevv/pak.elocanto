import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageUtils';

// ============ Reusable Inline Form ============
function InlineForm({ fields, formData, setFormData, onSubmit, onCancel, editingItem, title, onFileUpload, uploading }) {
  return (
    <div style={{ background: 'white', padding: 32, borderRadius: 24, border: '2px solid #fed7aa', boxShadow: '0 10px 40px rgba(249,115,22,0.08)', marginBottom: 24, position: 'relative' }}>
      <button onClick={onCancel} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
        <XMarkIcon style={{ width: 22, height: 22, color: '#9ca3af' }} />
      </button>
      <h2 style={{ fontSize: 20, fontWeight: 900, fontStyle: 'italic', marginBottom: 24, color: '#111' }}>
        {editingItem ? 'EDIT' : 'ADD'} {title}
      </h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {fields.map((field) => (
          <div key={field.key} style={{ gridColumn: field.fullWidth ? 'span 2' : 'auto' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{field.label}</label>
            {field.type === 'select' ? (
              <select
                style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: '2px solid #f3f4f6', fontWeight: 700, fontSize: 14, background: '#fafafa', outline: 'none' }}
                required={field.required}
                value={formData[field.key] || ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              >
                <option value="">Select {field.label}</option>
                {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : field.type === 'checkbox' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={formData[field.key] || false}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.checked })}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>{field.checkLabel}</span>
              </div>
            ) : field.type === 'file' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    {formData[field.key] ? <img src={formData[field.key]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PhotoIcon style={{ width: 24, height: 24, color: '#d1d5db' }} />}
                  </div>
                  <label style={{ flex: 1, padding: '12px 20px', background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
                    <PhotoIcon style={{ width: 18, height: 18 }} />
                    {uploading ? 'Compressing...' : 'Upload Image'}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileUpload(e, field.key)} />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Or paste image URL here..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', outline: 'none' }}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                />
              </div>
            ) : (
              <input
                type={field.type || 'text'}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: '2px solid #f3f4f6', fontWeight: 700, fontSize: 14, background: '#fafafa', outline: 'none' }}
                required={field.required}
                placeholder={field.placeholder || ''}
                value={formData[field.key] || ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              />
            )}
          </div>
        ))}
        <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" style={{ flex: 1, padding: '16px 0', background: '#111827', color: 'white', borderRadius: 16, fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer' }}>
            {editingItem ? 'UPDATE' : 'CREATE'}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: '16px 32px', border: '2px solid #e5e7eb', borderRadius: 16, fontWeight: 900, color: '#9ca3af', background: 'none', cursor: 'pointer' }}>
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}

// ============ Reusable Data Table ============
function DataTable({ columns, data, onEdit, onDelete, emptyMessage, selectedIds = [], onSelect, onSelectAll }) {
  if (data.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <MagnifyingGlassIcon style={{ width: 48, height: 48, color: '#e5e7eb', margin: '0 auto 16px' }} />
        <p style={{ color: '#9ca3af', fontWeight: 900, fontStyle: 'italic' }}>{emptyMessage || 'No data found.'}</p>
      </div>
    );
  }

  const allSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
          <th style={{ padding: '18px 24px', width: 40 }}>
            <input 
              type="checkbox" 
              checked={allSelected} 
              onChange={onSelectAll}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </th>
          {columns.map(col => (
            <th key={col.key} style={{ padding: '18px 24px', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, textAlign: col.align || 'left' }}>{col.label}</th>
          ))}
          <th style={{ padding: '18px 24px', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row._id} style={{ borderBottom: '1px solid #f9fafb', background: selectedIds.includes(row._id) ? '#fff7ed' : 'transparent' }}>
            <td style={{ padding: '16px 24px' }}>
              <input 
                type="checkbox" 
                checked={selectedIds.includes(row._id)} 
                onChange={() => onSelect(row._id)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
            </td>
            {columns.map(col => (
              <td key={col.key} style={{ padding: '16px 24px', fontWeight: 700, color: '#111', textAlign: col.align || 'left' }}>
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => onEdit(row)} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, background: 'white', cursor: 'pointer', color: '#6b7280' }}>
                  <PencilSquareIcon style={{ width: 18, height: 18 }} />
                </button>
                <button onClick={() => onDelete(row._id)} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10, background: 'white', cursor: 'pointer', color: '#ef4444' }}>
                  <TrashIcon style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============ Main Component ============
export default function CityManagePage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('cities');
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkData, setBulkData] = useState({ city: '', names: '' });

  const [selectedIds, setSelectedIds] = useState([]);
  const [cityFilter, setCityFilter] = useState(''); // Filter Areas/Hotels by City ID
  const [showBulkEditForm, setShowBulkEditForm] = useState(false);
  const [bulkEditData, setBulkEditData] = useState([]);

  useEffect(() => {
    fetchAll();
    setSelectedIds([]); // Clear selection on tab change
    setCityFilter(''); // Clear filter on tab change
    setShowBulkEditForm(false);
  }, [token, activeTab]);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const compressedFile = await compressImage(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200 });
      const upData = new FormData();
      upData.append('images', compressedFile);
      
      const { data } = await api.post('/upload', upData);
      setFormData(prev => ({ ...prev, [field]: data.urls[0] }));
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [citiesRes, areasRes, hotelsRes] = await Promise.all([
        api.get('/cities'),
        api.get('/areas'),
        api.get('/hotels'),
      ]);
      setCities(citiesRes.data);
      setAreas(areasRes.data);
      setHotels(hotelsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (item = null) => {
    setEditingItem(item);
    if (activeTab === 'cities') {
      setFormData(item ? { 
        name: item.name, 
        image: item.image || '', 
        isPopular: item.isPopular || false,
        showOnHome: item.showOnHome || false,
        whatsappNumber: item.whatsappNumber || '',
        slug: item.slug || ''
      } : { name: '', image: '', isPopular: false, showOnHome: false, whatsappNumber: '', slug: '' });
    } else if (activeTab === 'areas') {
      setFormData(item ? { name: item.name, city: item.city?._id || item.city || '', showOnHome: item.showOnHome || false, slug: item.slug || '', customCitySlug: item.customCitySlug || '' } : { name: '', city: '', showOnHome: false, slug: '', customCitySlug: '' });
    } else {
      setFormData(item ? { name: item.name, city: item.city?._id || item.city || '', showOnHome: item.showOnHome || false, slug: item.slug || '', customCitySlug: item.customCitySlug || '' } : { name: '', city: '', showOnHome: false, slug: '', customCitySlug: '' });
    }

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkEditClick = () => {
    const dataToEdit = selectedIds.map(id => {
      const item = activeTab === 'cities' ? cities.find(c => c._id === id) : activeTab === 'areas' ? areas.find(a => a._id === id) : hotels.find(h => h._id === id);
      return { 
        _id: id, 
        name: item?.name || '', 
        slug: item?.slug || '',
        customCitySlug: item?.customCitySlug || ''
      };
    });
    setBulkEditData(dataToEdit);
    setShowBulkEditForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'cities' ? '/cities' : activeTab === 'areas' ? '/areas' : '/hotels';
      if (editingItem) {
        await api.put(`${endpoint}/${editingItem._id}`, formData);
        setMessage(`${activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)} updated!`);
      } else {
        await api.post(endpoint, formData);
        setMessage(`${activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)} created!`);
      }
      setShowForm(false);
      setEditingItem(null);
      fetchAll();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save.');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const names = bulkData.names.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length === 0) return alert('Please enter at least one name');
    if ((activeTab === 'areas' || activeTab === 'hotels') && !bulkData.city) {
      return alert('Please select a city');
    }

    try {
      setLoading(true);
      const endpoint = activeTab === 'cities' ? '/cities/bulk' : activeTab === 'areas' ? '/areas/bulk' : '/hotels/bulk';
      const payload = activeTab === 'cities' ? { names } : { names, cityId: bulkData.city };
      
      const { data } = await api.post(endpoint, payload);
      setMessage(data.message);
      setShowBulkForm(false);
      setBulkData({ city: '', names: '' });
      fetchAll();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item? This action cannot be undone.')) {
      try {
        const endpoint = activeTab === 'cities' ? '/cities' : activeTab === 'areas' ? '/areas' : '/hotels';
        await api.delete(`${endpoint}/${id}`);
        fetchAll();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed.');
      }
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAll = (data) => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item._id));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} items? This cannot be undone.`)) {
      try {
        setLoading(true);
        const endpoint = activeTab === 'cities' ? '/cities/bulk' : activeTab === 'areas' ? '/areas/bulk' : '/hotels/bulk';
        await api.delete(endpoint, { data: { ids: selectedIds } });
        setMessage(`Successfully deleted ${selectedIds.length} items.`);
        setSelectedIds([]);
        fetchAll();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        alert(err.response?.data?.message || 'Bulk delete failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkTogglePopular = async (val) => {
    try {
      setLoading(true);
      await api.put('/cities/bulk', { ids: selectedIds, updateData: { isPopular: val } });
      setMessage(`Successfully updated ${selectedIds.length} cities.`);
      setSelectedIds([]);
      fetchAll();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEditSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const endpoint = activeTab === 'cities' ? '/cities' : activeTab === 'areas' ? '/areas' : '/hotels';
      
      // Update each item individually to ensure slug generation/validation
      await Promise.all(
        bulkEditData.map(item => api.put(`${endpoint}/${item._id}`, { 
          name: item.name, 
          slug: item.slug, 
          customCitySlug: item.customCitySlug 
        }))
      );


      setMessage(`Successfully updated ${bulkEditData.length} items.`);
      setShowBulkEditForm(false);
      setSelectedIds([]);
      fetchAll();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk update failed. Some items might not have saved.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCleanSlugs = async () => {
    if (window.confirm(`Clean slugs for ${selectedIds.length} items? This will auto-generate them from their names.`)) {
      try {
        setLoading(true);
        const endpoint = activeTab === 'areas' ? '/areas/bulk' : '/hotels/bulk';
        await api.put(endpoint, { ids: selectedIds, pattern: 'clean-name' });
        setMessage(`Cleaned slugs for ${selectedIds.length} items.`);
        setSelectedIds([]);
        fetchAll();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        alert(err.response?.data?.message || 'Bulk clean failed.');
      } finally {
        setLoading(false);
      }
    }
  };


  const tabs = [
    { key: 'cities', label: 'Cities', icon: <GlobeAltIcon style={{ width: 18, height: 18 }} />, count: cities.length },
    { key: 'areas', label: 'Areas', icon: <MapPinIcon style={{ width: 18, height: 18 }} />, count: areas.length },
    { key: 'hotels', label: 'Hotels', icon: <BuildingOffice2Icon style={{ width: 18, height: 18 }} />, count: hotels.length },
  ];

  // ---------- Form fields for each tab ----------
  const cityFields = [
    { key: 'name', label: 'City Name', required: true, fullWidth: false },
    { key: 'slug', label: 'URL Slug (Optional Override)', required: false, fullWidth: false, placeholder: 'e.g. karachi-city' },
    { key: 'image', label: 'City Image', type: 'file', required: false, fullWidth: false },
    { key: 'whatsappNumber', label: 'WhatsApp Number (Optional Override)', required: false, fullWidth: false, placeholder: 'e.g. 923001234567' },
    { key: 'isPopular', label: '', type: 'checkbox', checkLabel: 'Mark as Popular (Browse Section)', fullWidth: false },
    { key: 'showOnHome', label: '', type: 'checkbox', checkLabel: 'Show on Homepage Section', fullWidth: false },
  ];

  const cityOptions = cities.map(c => ({ value: c._id, label: c.name }));

  const areaFields = [
    { key: 'name', label: 'Area Name', required: true, fullWidth: false },
    { key: 'slug', label: 'URL Slug (Optional Override)', required: false, fullWidth: false, placeholder: 'e.g. johar-town-vips' },
    { key: 'customCitySlug', label: 'City Slug Override (Optional)', required: false, fullWidth: true, placeholder: 'e.g. lahore-escorts' },
    { key: 'city', label: 'Target City (Relation)', type: 'select', required: true, options: cityOptions, fullWidth: false },

    { key: 'showOnHome', label: '', type: 'checkbox', checkLabel: 'Show on Homepage Section', fullWidth: true },
  ];

  const hotelFields = [
    { key: 'name', label: 'Hotel Name', required: true, fullWidth: false },
    { key: 'slug', label: 'URL Slug (Optional Override)', required: false, fullWidth: false, placeholder: 'e.g. pc-hotel-lahore' },
    { key: 'customCitySlug', label: 'City Slug Override (Optional)', required: false, fullWidth: true, placeholder: 'e.g. lahore-escorts' },
    { key: 'city', label: 'Target City (Relation)', type: 'select', required: true, options: cityOptions, fullWidth: false },

    { key: 'showOnHome', label: '', type: 'checkbox', checkLabel: 'Show on Homepage Section', fullWidth: true },
  ];


  const currentFields = activeTab === 'cities' ? cityFields : activeTab === 'areas' ? areaFields : hotelFields;
  const currentTitle = activeTab === 'cities' ? 'CITY' : activeTab === 'areas' ? 'AREA' : 'HOTEL';

  // ---------- Data for current tab ----------
  const filteredCities = cities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const filteredAreas = areas.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter ? (a.city?._id === cityFilter || a.city === cityFilter) : true;
    return matchesSearch && matchesCity;
  });

  const filteredHotels = hotels.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter ? (h.city?._id === cityFilter || h.city === cityFilter) : true;
    return matchesSearch && matchesCity;
  });

  const cityColumns = [
    {
      key: 'image', label: 'Image',
      render: (row) => (
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {row.image ? <img src={row.image} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PhotoIcon style={{ width: 20, height: 20, color: '#d1d5db' }} />}
        </div>
      )
    },
    { key: 'name', label: 'City Name', render: (row) => <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{row.name}</span> },
    { key: 'slug', label: 'Slug', render: (row) => <span style={{ color: '#6b7280', fontSize: 13, fontFamily: 'monospace' }}>/{row.slug || '—'}</span> },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {row.isPopular && <span style={{ padding: '4px 12px', background: '#fff7ed', color: '#ea580c', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', borderRadius: 20 }}>Popular</span>}
          {row.showOnHome && <span style={{ padding: '4px 12px', background: '#f0fdf4', color: '#16a34a', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', borderRadius: 20 }}>On Home</span>}
        </div>
      )
    },
  ];

  const areaColumns = [
    { key: 'name', label: 'Area Name', render: (row) => <span style={{ fontWeight: 900 }}>{row.name}</span> },
    { key: 'slug', label: 'Slug', render: (row) => <span style={{ color: '#6b7280', fontSize: 13, fontFamily: 'monospace' }}>/{row.slug || '—'}</span> },
    {
      key: 'city',
      label: 'City',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><MapPinIcon style={{ width: 14, height: 14 }} />{row.city?.name || '—'}</span>
          {row.customCitySlug && (
            <span style={{ fontSize: 9, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 900, textTransform: 'uppercase', width: 'fit-content' }}>
              Override: {row.customCitySlug}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'showOnHome', label: 'Status',
      render: (row) => row.showOnHome ? (
        <span style={{ padding: '4px 12px', background: '#f0fdf4', color: '#16a34a', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', borderRadius: 20 }}>On Home</span>
      ) : null
    },
  ];

  const hotelColumns = [
    { key: 'name', label: 'Hotel Name', render: (row) => <span style={{ fontWeight: 900 }}>{row.name}</span> },
    { key: 'slug', label: 'Slug', render: (row) => <span style={{ color: '#6b7280', fontSize: 13, fontFamily: 'monospace' }}>/{row.slug || '—'}</span> },
    {
      key: 'city',
      label: 'City',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><MapPinIcon style={{ width: 14, height: 14 }} />{row.city?.name || '—'}</span>
          {row.customCitySlug && (
            <span style={{ fontSize: 9, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 900, textTransform: 'uppercase', width: 'fit-content' }}>
              Override: {row.customCitySlug}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'showOnHome', label: 'Status',
      render: (row) => row.showOnHome ? (
        <span style={{ padding: '4px 12px', background: '#f0fdf4', color: '#16a34a', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', borderRadius: 20 }}>On Home</span>
      ) : null
    },
  ];


  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ width: 48, height: 48, border: '3px solid #f3f4f6', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic', color: '#111', letterSpacing: '-0.02em' }}>Location Management</h1>
          <p style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600, marginTop: 4 }}>Manage cities, areas, and hotels for your marketplace.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              style={{ paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, border: '1px solid #e5e7eb', borderRadius: 16, width: 220, fontWeight: 700, fontSize: 13, outline: 'none' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!showForm && (
            <button
              onClick={() => handleOpenForm()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#111827', color: 'white', borderRadius: 16, fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              <PlusIcon style={{ width: 18, height: 18 }} />
              Add {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
            </button>
          )}
          {!showForm && !showBulkForm && (
            <button
              onClick={() => { setShowBulkForm(true); setShowForm(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#f97316', color: 'white', borderRadius: 16, fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              <GlobeAltIcon style={{ width: 18, height: 18 }} />
              Bulk Add
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, background: '#f9fafb', padding: 6, borderRadius: 18, flex: 1 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowForm(false); setSearchTerm(''); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 13,
                transition: 'all 0.2s',
                background: activeTab === tab.key ? 'white' : 'transparent',
                color: activeTab === tab.key ? '#111' : '#9ca3af',
                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {tab.icon}
              {tab.label}
              <span style={{
                background: activeTab === tab.key ? '#111' : '#e5e7eb',
                color: activeTab === tab.key ? 'white' : '#6b7280',
                fontSize: 10,
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: 8,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {(activeTab === 'areas' || activeTab === 'hotels') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Filter by City:</span>
            <select
              style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 700, background: 'white', outline: 'none' }}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city._id} value={city._id}>{city.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Success Message */}
      {message && (
        <div style={{ padding: 16, background: '#f0fdf4', color: '#16a34a', borderRadius: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircleIcon style={{ width: 20, height: 20 }} />
          {message}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div style={{ 
          position: 'sticky', 
          top: 20, 
          zIndex: 50, 
          background: '#111827', 
          color: 'white', 
          padding: '16px 24px', 
          borderRadius: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          marginBottom: 24,
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <style>{`@keyframes slide-down { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#f97316', padding: '4px 12px', borderRadius: 10, fontSize: 12, fontWeight: 900 }}>{selectedIds.length} SELECTED</div>
            <button 
              onClick={() => setSelectedIds([])}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
            >
              Deselect All
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {activeTab === 'cities' ? (
              <>
                <button 
                  onClick={handleBulkEditClick}
                  style={{ padding: '10px 16px', background: '#3e6fe1', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  Bulk Edit Details
                </button>
                <button 
                  onClick={() => handleBulkTogglePopular(true)}
                  style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  Mark Popular
                </button>
                <button 
                  onClick={() => handleBulkTogglePopular(false)}
                  style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  Remove Popular
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleBulkEditClick}
                  style={{ padding: '10px 16px', background: '#3e6fe1', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  Bulk Edit Slugs
                </button>
                <button 
                  onClick={handleBulkCleanSlugs}
                  style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  Clean Slugs (Auto)
                </button>
              </>
            )}

            <button 
              onClick={handleBulkDelete}
              style={{ padding: '10px 20px', background: '#ef4444', color: 'white', borderRadius: 12, fontSize: 13, fontWeight: 900, border: 'none', cursor: 'pointer' }}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Bulk Edit Form */}
      {showBulkEditForm && (
        <div style={{ background: 'white', padding: 32, borderRadius: 24, border: '2px solid #3e6fe1', boxShadow: '0 10px 40px rgba(62,111,225,0.08)', marginBottom: 24, position: 'relative' }}>
          <button onClick={() => setShowBulkEditForm(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <XMarkIcon style={{ width: 22, height: 22, color: '#9ca3af' }} />
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 900, fontStyle: 'italic', marginBottom: 24, color: '#111' }}>
            BULK EDIT {currentTitle} DETAILS & SLUGS
          </h2>

          <form onSubmit={handleBulkEditSave}>
            <div style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '0 10px', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase' }}>{currentTitle} Name</th>
                    <th style={{ padding: '0 10px', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase' }}>URL Slug</th>
                    {activeTab !== 'cities' && (
                      <th style={{ padding: '0 10px', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase' }}>City Slug Override</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bulkEditData.map((item, idx) => (
                    <tr key={item._id}>
                      <td style={{ padding: '0 5px' }}>
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => {
                            const newData = [...bulkEditData];
                            newData[idx].name = e.target.value;
                            setBulkEditData(newData);
                          }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 700 }}
                          required
                        />
                      </td>
                      <td style={{ padding: '0 5px' }}>
                        <input 
                          type="text" 
                          value={item.slug} 
                          onChange={(e) => {
                            const newData = [...bulkEditData];
                            newData[idx].slug = e.target.value;
                            setBulkEditData(newData);
                          }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}
                          required
                        />
                      </td>
                      {activeTab !== 'cities' && (
                        <td style={{ padding: '0 5px' }}>
                          <input 
                            type="text" 
                            value={item.customCitySlug} 
                            placeholder="e.g. lahore-escorts"
                            onChange={(e) => {
                              const newData = [...bulkEditData];
                              newData[idx].customCitySlug = e.target.value;
                              setBulkEditData(newData);
                            }}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600 }}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Bulk Action for all selected rows */}
            {activeTab !== 'cities' && bulkEditData.length > 1 && (
              <div style={{ marginTop: 20, marginBottom: 32, padding: 20, background: '#f8fafc', borderRadius: 16, border: '2px dashed #cbd5e1' }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>⚡ Quick Apply to All Rows</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="text" 
                    placeholder="Enter City Slug Override for all..."
                    id="bulk-city-override-input"
                    style={{ flex: 1, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 600 }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const val = document.getElementById('bulk-city-override-input').value;
                      const newData = bulkEditData.map(d => ({ ...d, customCitySlug: val }));
                      setBulkEditData(newData);
                    }}
                    style={{ background: '#475569', color: 'white', border: 'none', padding: '0 24px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                  >
                    APPLY TO ALL
                  </button>
                </div>
                <p style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>This will set the same City Slug Override for every item in the table above.</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" style={{ flex: 1, padding: '16px 0', background: '#3e6fe1', color: 'white', borderRadius: 16, fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(62,111,225,0.2)' }}>
                SAVE {bulkEditData.length} {currentTitle} CHANGES
              </button>

              <button type="button" onClick={() => setShowBulkEditForm(false)} style={{ padding: '16px 32px', border: '2px solid #e5e7eb', borderRadius: 16, fontWeight: 900, color: '#9ca3af', background: 'none', cursor: 'pointer' }}>
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <InlineForm
          fields={currentFields}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          editingItem={editingItem}
          title={currentTitle}
          onFileUpload={handleFileUpload}
          uploading={uploading}
        />
      )}

      {/* Bulk Form */}
      {showBulkForm && (
        <div style={{ background: 'white', padding: 32, borderRadius: 24, border: '2px solid #fdba74', boxShadow: '0 10px 40px rgba(249,115,22,0.08)', marginBottom: 24, position: 'relative' }}>
          <button onClick={() => setShowBulkForm(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <XMarkIcon style={{ width: 22, height: 22, color: '#9ca3af' }} />
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 900, fontStyle: 'italic', marginBottom: 24, color: '#111' }}>
            BULK ADD {currentTitle}S
          </h2>
          <form onSubmit={handleBulkSubmit}>
            {(activeTab === 'areas' || activeTab === 'hotels') && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Select Target City</label>
                <select
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: '2px solid #f3f4f6', fontWeight: 700, fontSize: 14, background: '#fafafa', outline: 'none' }}
                  required
                  value={bulkData.city}
                  onChange={(e) => setBulkData({ ...bulkData, city: e.target.value })}
                >
                  <option value="">Select City</option>
                  {cityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{currentTitle} Names (One per line)</label>
              <textarea
                style={{ width: '100%', minHeight: 200, padding: '14px 18px', borderRadius: 16, border: '2px solid #f3f4f6', fontWeight: 600, fontSize: 14, background: '#fafafa', outline: 'none', resize: 'vertical' }}
                placeholder={activeTab === 'cities' ? `Example:\nKarachi | karachi-city\nLahore | lahore-pk\nMultan` : `Example:\nName 1\nName 2\nName 3`}
                required
                value={bulkData.names}
                onChange={(e) => setBulkData({ ...bulkData, names: e.target.value })}
              />
              <p style={{ marginTop: 8, fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
                {activeTab === 'cities' 
                  ? 'Tip: You can use the format "Name | Slug" to set a custom URL. If slug is omitted, it will be auto-generated.' 
                  : 'Tip: Paste a list from Excel or text file. Each line will be created as a new ' + activeTab.slice(0, -1) + '.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" style={{ flex: 1, padding: '16px 0', background: '#f97316', color: 'white', borderRadius: 16, fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer' }}>
                CREATE {activeTab.toUpperCase()} IN BULK
              </button>
              <button type="button" onClick={() => setShowBulkForm(false)} style={{ padding: '16px 32px', border: '2px solid #e5e7eb', borderRadius: 16, fontWeight: 900, color: '#9ca3af', background: 'none', cursor: 'pointer' }}>
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Data Table */}
      <div style={{ background: 'white', borderRadius: 24, border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {activeTab === 'cities' && (
          <DataTable 
            columns={cityColumns} 
            data={filteredCities} 
            onEdit={handleOpenForm} 
            onDelete={handleDelete} 
            emptyMessage="No cities found." 
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={() => handleSelectAll(filteredCities)}
          />
        )}
        {activeTab === 'areas' && (
          <DataTable 
            columns={areaColumns} 
            data={filteredAreas} 
            onEdit={handleOpenForm} 
            onDelete={handleDelete} 
            emptyMessage="No areas found. Add your first area!" 
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={() => handleSelectAll(filteredAreas)}
          />
        )}
        {activeTab === 'hotels' && (
          <DataTable 
            columns={hotelColumns} 
            data={filteredHotels} 
            onEdit={handleOpenForm} 
            onDelete={handleDelete} 
            emptyMessage="No hotels found. Add your first hotel!" 
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={() => handleSelectAll(filteredHotels)}
          />
        )}
      </div>
    </div>
  );
}
