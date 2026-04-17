import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  CheckCircleIcon,
  TagIcon,
  GlobeAltIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UsersIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export default function AdminTitlesSeoPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [seoList, setSeoList] = useState([]);
  const [message, setMessage] = useState('');
  
  // Modal & Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    pageType: 'home',
    referenceId: '',
    title: '',
    metaDescription: '',
    keywords: '',
    whatsappNumber: '',
    isActive: true
  });

  // Dynamic Data
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [areas, setAreas] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCityId, setFilterCityId] = useState('');
  const [filterPageType, setFilterPageType] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');

  useEffect(() => {
    fetchSeoList();
    fetchBaseData();
  }, []);

  const fetchSeoList = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/seo-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSeoList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch SEO Error:', err);
      setSeoList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseData = async () => {
    try {
      const [cityRes, catRes] = await Promise.all([
        api.get('/cities'),
        api.get('/categories')
      ]);
      setCities(cityRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePageTypeChange = (e) => {
    const type = e.target.value;
    setFormData({ ...formData, pageType: type, referenceId: '' });
    setSelectedCityId('');
    setAreas([]);
    setHotels([]);
  };

  const handleCityChange = async (e) => {
    const cityId = e.target.value;
    setSelectedCityId(cityId);
    setFormData({ ...formData, referenceId: cityId }); // Default reference to city ID if city page
    
    if (!cityId) {
      setAreas([]);
      setHotels([]);
      return;
    }

    const city = cities.find(c => c._id === cityId);
    if (!city) return;

    try {
      setDataLoading(true);
      const [areaRes, hotelRes] = await Promise.all([
        api.get('/areas', { params: { city: city.slug } }),
        api.get('/hotels', { params: { city: city.slug } })
      ]);
      setAreas(areaRes.data);
      setHotels(hotelRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      
      // If we are on city pageType, referenceId should be the selectedCityId
      if (formData.pageType === 'city') {
        payload.referenceId = selectedCityId;
      }

      await api.post('/seo-settings', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(editingId ? 'SEO Updated!' : 'SEO Created!');
      setShowForm(false);
      resetForm();
      fetchSeoList();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save SEO');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      pageType: item.pageType,
      referenceId: item.referenceId || '',
      title: item.title,
      metaDescription: item.metaDescription,
      keywords: item.keywords,
      whatsappNumber: item.whatsappNumber || '',
      isActive: item.isActive
    });
    
    // If it's a dynamic item, we might need to pre-load the city/area lookup
    if (item.pageType === 'city') {
      setSelectedCityId(item.referenceId);
    } else if (item.pageType === 'area' || item.pageType === 'hotel') {
      // Find the item to get its city ID
      // This is a bit complex without ref mapping on frontend, 
      // but for now we let user select city again or leave it.
    }
    
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this SEO setting?')) return;
    try {
      await api.delete(`/seo-settings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSeoList();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      pageType: 'home',
      referenceId: '',
      title: '',
      metaDescription: '',
      keywords: '',
      whatsappNumber: '',
      isActive: true
    });
    setSelectedCityId('');
  };

  const getPageIcon = (type) => {
    switch(type) {
      case 'home': return <GlobeAltIcon className="w-5 h-5" />;
      case 'ads': return <TagIcon className="w-5 h-5" />;
      case 'ad': return <TagIcon className="w-5 h-5 text-orange-500" />;
      case 'profile': return <UsersIcon className="w-5 h-5" />;
      case 'city': return <MapPinIcon className="w-5 h-5" />;
      case 'city-hotels': return <BuildingOfficeIcon className="w-5 h-5 text-orange-500" />;
      case 'city-areas': return <MapPinIcon className="w-5 h-5 text-orange-500" />;
      case 'area': return <MagnifyingGlassIcon className="w-5 h-5" />;
      case 'hotel': return <BuildingOfficeIcon className="w-5 h-5" />;
      case 'category': return <FolderIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  // Filter Logic
  const filteredSeoList = Array.isArray(seoList) ? seoList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.pageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.keywords?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = !filterCityId || (item.pageType === 'city' && item.referenceId === filterCityId);
    const matchesType = !filterPageType || item.pageType === filterPageType;
    const matchesCategory = !filterCategoryId || (item.pageType === 'category' && item.referenceId === filterCategoryId);
    
    return matchesSearch && matchesCity && matchesType && matchesCategory;
  }) : [];

  // Get count of entries for a specific city
  const getCityEntryCount = (cityId) => {
    return seoList.filter(item => item.pageType === 'city' && item.referenceId === cityId).length;
  };

  // Get count of entries for a category
  const getCategoryEntryCount = (catId) => {
    return seoList.filter(item => item.pageType === 'category' && item.referenceId === catId).length;
  };

  // Get count of entries for a page type
  const getTypeEntryCount = (type) => {
    return seoList.filter(item => item.pageType === type).length;
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Titles & Meta Management</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Control SEO tags for all important pages.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black hover:bg-orange-500 transition-all shadow-xl shadow-gray-200"
          >
            <PlusIcon className="w-5 h-5" /> Add SEO Entry
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 shadow-xl shadow-orange-50/50 animate-slide-up relative">
          <h2 className="text-2xl font-black text-gray-900 italic mb-8">
            {editingId ? 'EDIT' : 'CREATE'} SEO TAGS
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Page Type</label>
                <select 
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50 appearance-none"
                  value={formData.pageType}
                  onChange={handlePageTypeChange}
                >
                  <option value="home">Homepage</option>
                  <option value="ads">All Ads Listing</option>
                  <option value="ad">Individual Ad Detail</option>
                  <option value="category">Category Page</option>
                  <option value="city">City Home Page</option>
                  <option value="city-hotels">City Hotels List</option>
                  <option value="city-areas">City Areas List</option>
                  <option value="area">Specific Area Page</option>
                  <option value="hotel">Specific Hotel Page</option>
                  <option value="profile">User Profile Page</option>
                </select>
              </div>

              {(['city', 'area', 'hotel', 'city-areas', 'city-hotels'].includes(formData.pageType)) && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Select City</label>
                  <select 
                    className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50 appearance-none"
                    value={selectedCityId}
                    onChange={handleCityChange}
                    required
                  >
                    <option value="">Select City...</option>
                    {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {formData.pageType === 'area' && selectedCityId && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Select Area</label>
                  <select 
                    className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50 appearance-none"
                    value={formData.referenceId}
                    onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                    required
                  >
                    <option value="">Select Area...</option>
                    {areas.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              {formData.pageType === 'hotel' && selectedCityId && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Select Hotel</label>
                  <select 
                    className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50 appearance-none"
                    value={formData.referenceId}
                    onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                    required
                  >
                    <option value="">Select Hotel...</option>
                    {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
              )}

              {formData.pageType === 'category' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Select Category</label>
                  <select 
                    className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50 appearance-none"
                    value={formData.referenceId}
                    onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                    required
                  >
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Meta Title</label>
                <input 
                  type="text"
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50"
                  placeholder="Focus keyword should be here..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">WhatsApp Number (e.g. 923xxxxxxxx)</label>
                <input 
                  type="text"
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50"
                  placeholder="Only for city pages..."
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Meta Description</label>
                <textarea 
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50 h-32 resize-none"
                  placeholder="Compelling description for search results..."
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Keywords (Comma separated)</label>
                <input 
                  type="text"
                  className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-50 focus:border-orange-500 outline-none font-bold bg-gray-50/50"
                  placeholder="e.g. buy online, sell free, lahore marketplace"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 ml-2">
                <input 
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded-lg text-orange-500"
                />
                <span className="text-sm font-black text-gray-700 uppercase tracking-tighter">Active / Published</span>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-orange-500 shadow-xl transition-all active:scale-[0.98]">
                  Save SEO Setting
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 border-2 border-gray-100 rounded-[1.5rem] font-black text-gray-400 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {message && (
        <div className="p-4 bg-green-50 text-green-600 rounded-2xl text-xs font-black animate-slide-up border border-green-100 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" /> {message}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by title, keyword or page type..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-sm transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Page Type Filter */}
          <div className="relative">
            <GlobeAltIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <select 
              className="w-full pl-12 pr-10 py-3.5 bg-gray-50/50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-xs appearance-none cursor-pointer tracking-tight"
              value={filterPageType}
              onChange={(e) => setFilterPageType(e.target.value)}
            >
              <option value="">All Page Types</option>
              <option value="home">Homepage ({getTypeEntryCount('home')})</option>
              <option value="ads">Ads Listing ({getTypeEntryCount('ads')})</option>
              <option value="ad">Individual Ads ({getTypeEntryCount('ad')})</option>
              <option value="category">Categories ({getTypeEntryCount('category')})</option>
              <option value="city">Cities ({getTypeEntryCount('city')})</option>
              <option value="city-hotels">City Hotels ({getTypeEntryCount('city-hotels')})</option>
              <option value="city-areas">City Areas ({getTypeEntryCount('city-areas')})</option>
              <option value="area">Areas ({getTypeEntryCount('area')})</option>
              <option value="hotel">Hotels ({getTypeEntryCount('hotel')})</option>
              <option value="profile">Profiles ({getTypeEntryCount('profile')})</option>
            </select>
            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* City Filter */}
          <div className="relative">
            <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <select 
              className="w-full pl-12 pr-10 py-3.5 bg-gray-50/50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-xs appearance-none cursor-pointer tracking-tight"
              value={filterCityId}
              onChange={(e) => setFilterCityId(e.target.value)}
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city._id} value={city._id}>
                  {city.name} ({getCityEntryCount(city._id)})
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <FolderIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <select 
              className="w-full pl-12 pr-10 py-3.5 bg-gray-50/50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-xs appearance-none cursor-pointer tracking-tight"
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name} ({getCategoryEntryCount(cat._id)})
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {(searchQuery || filterCityId || filterPageType || filterCategoryId) && (
          <div className="flex justify-end">
            <button 
              onClick={() => { 
                setSearchQuery(''); 
                setFilterCityId(''); 
                setFilterPageType('');
                setFilterCategoryId('');
              }}
              className="px-6 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] hover:bg-red-100 transition-all uppercase tracking-widest border border-red-100"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Page Source</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta Title</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSeoList.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500">
                      {getPageIcon(item.pageType)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.pageType}</div>
                      <div className="text-[10px] font-bold text-gray-400 mt-0.5">Custom Content</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-sm font-bold text-gray-900 line-clamp-1 max-w-md">{item.title}</div>
                  <div className="text-[10px] text-gray-400 italic line-clamp-1">{item.metaDescription}</div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
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
            {seoList.length === 0 && !loading && (
              <tr>
                <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-black italic">No Custom SEO Tags set yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
