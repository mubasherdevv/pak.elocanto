import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  StarIcon as StarOutline,
  FunnelIcon,
  EyeIcon,
  TagIcon,
  ShoppingBagIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  NoSymbolIcon,
  PencilIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  XMarkIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  PlusIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { generateAdSlug } from '../utils/urlUtils';
import { timeAgo, formatFullDate } from '../utils/timeUtils';
import { getOptimizedImageUrl, compressMultipleImages } from '../utils/imageUtils';

export default function AdminAdsPage() {
  const { token } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');
  const [categories, setCategories] = useState([]);
  const [editingAd, setEditingAd] = useState(null);
  const [view, setView] = useState('list');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState(null);
  const adsPerPage = 20;
  
  // Rejection Modal State
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [adToReject, setAdToReject] = useState(null);
  const [tempRejectionReason, setTempRejectionReason] = useState('Does not meet our community standards');

  // Bulk Selection State
  const [selectedAds, setSelectedAds] = useState([]);

  // Location State
  const [cities, setCities] = useState([]);
  const [cityAreas, setCityAreas] = useState([]);
  const [cityHotels, setCityHotels] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchData();
    fetchCities();

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchSettings();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(fetchSettings, 3000);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [token]);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchCities = async () => {
    try {
      const { data } = await api.get('/cities');
      setCities(data);
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  // Fetch areas and hotels when editingAd.city changes
  useEffect(() => {
    const fetchLocations = async () => {
      if (editingAd?.city) {
        try {
          const cityObj = cities.find(c => c.name === editingAd.city);
          if (cityObj?.slug) {
            const [areasRes, hotelsRes] = await Promise.all([
              api.get(`/areas?city=${cityObj.slug}`).catch(() => ({ data: [] })),
              api.get(`/hotels?city=${cityObj.slug}`).catch(() => ({ data: [] }))
            ]);
            setCityAreas(areasRes.data);
            setCityHotels(hotelsRes.data);
          }
        } catch (err) {
          console.error('Error fetching areas/hotels:', err);
        }
      } else {
        setCityAreas([]);
        setCityHotels([]);
      }
    };
    fetchLocations();
  }, [editingAd?.city, cities]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!token) return;
      const [adsRes, catRes] = await Promise.all([
        api.get('/ads/admin/all'),
        api.get('/categories')
      ]);


      setAds(Array.isArray(adsRes.data) ? adsRes.data : (adsRes.data.ads || []));
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async (id) => {
    if (window.confirm('Are you sure you want to delete this advertisement?')) {
      try {
        await api.delete(`/ads/${id}`);
        toast.success('Advertisement deleted');
        fetchData();
      } catch (err) {
        console.error('Error deleting ad:', err);
        toast.error('Failed to delete ad');
      }
    }
  };

  const renewAd = async (ad) => {
    if (!window.confirm('Renew this ad for the default duration?')) return;
    try {
      const duration = ad.isFeatured ? (settings?.featuredAdsDuration || 7) : (settings?.simpleAdsDuration || 30);
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + duration);
      await api.put(`/ads/${ad._id}`, { expiresAt: newExpiresAt, isActive: true });

      toast.success(`Ad renewed for ${duration} days!`);
      fetchData();
    } catch (err) {
      console.error('Error renewing ad:', err);
      toast.error('Failed to renew ad');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      const updateData = {
        title: editingAd.title,
        price: editingAd.price,
        description: editingAd.description,
        phone: editingAd.phone,
        category: editingAd.category._id || editingAd.category,
        adType: editingAd.adType,
        isActive: editingAd.isActive,
        isApproved: editingAd.isApproved,
        isFeatured: editingAd.isFeatured,
        expiresAt: editingAd.expiresAt,
        badges: editingAd.badges || [],
        images: editingAd.images || [],
        rejectionReason: editingAd.rejectionReason || '',
        website: editingAd.website || '',
        city: editingAd.city,
        area: editingAd.area?._id || editingAd.area || null,
        hotel: editingAd.hotel?._id || editingAd.hotel || null
      };
      await api.put(`/ads/${editingAd._id}`, updateData);


      setView('list');
      setEditingAd(null);
      toast.success('Advertisement updated successfully');
      fetchData();
    } catch (err) {
      console.error('Error updating ad:', err);
      toast.error(err.response?.data?.message || 'Failed to update ad');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAdminImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const maxImages = settings?.maxImagesPerAd || 10;
    if ((editingAd.images || []).length + files.length > maxImages) {
      return toast.error(`Maximum ${maxImages} images allowed`);
    }

    try {
      setUpdateLoading(true);
      const compressedFiles = await compressMultipleImages(files);

      const uploadData = new FormData();
      // Add context for potential auto-categorization/watermarking
      uploadData.append('title', editingAd.title);
      uploadData.append('admin_managed', 'true');

      compressedFiles.forEach(file => {
        const renamedFile = new File([file], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' });
        uploadData.append('images', renamedFile);
      });

      const { data } = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setEditingAd(prev => ({
        ...prev,
        images: [...(prev.images || []), ...data.urls]
      }));
    } catch (err) {
      console.error('Admin upload error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUpdateLoading(false);
    }
  };

  const toggleFeatured = async (id, currentStatus) => {
    try {
      await api.put(`/ads/${id}`, { isFeatured: !currentStatus });
      toast.success(currentStatus ? 'Removed from gallery' : 'Pinned to gallery');
      fetchData();
    } catch (err) {
      console.error('Error toggling featured status:', err);
      toast.error('Failed to update status');
    }
  };

  const toggleSelectAd = (id) => {
    setSelectedAds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action, value = true) => {
    if (selectedAds.length === 0) return;
    
    const confirmMsg = action === 'delete' 
      ? `Are you sure you want to delete ${selectedAds.length} advertisements?`
      : `Apply action to ${selectedAds.length} advertisements?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setUpdateLoading(true);
      if (action === 'delete') {
        await api.post('/ads/bulk-delete', { ids: selectedAds });
        toast.success(`${selectedAds.length} ads deleted`);
      } else {
        await api.post('/ads/bulk-update', { ids: selectedAds, update: { [action]: value } });
        toast.success(`Updated ${selectedAds.length} ads`);
      }
      setSelectedAds([]);
      fetchData();
    } catch (err) {
      toast.error('Bulk action failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  const stats = [
    { label: 'Total Listings', value: ads.length, icon: ShoppingBagIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Approval', value: ads.filter(a => !a.isApproved).length, icon: ExclamationCircleIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Featured Ads', value: ads.filter(a => a.adType === 'featured' || a.isFeatured).length, icon: StarSolid, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Bot Analysis', value: ads.filter(a => !a.isApproved).length > 0 ? 'Urgent' : 'Clear', icon: AdjustmentsHorizontalIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'featured' && (ad.adType === 'featured' || ad.isFeatured)) ||
      (filterStatus === 'simple' && (ad.adType !== 'featured' && !ad.isFeatured));
    const matchesCategory = filterCategory === 'all' || ad.category?._id === filterCategory || ad.category === filterCategory;
    const matchesApproval = filterApproval === 'all' ||
      (filterApproval === 'pending' && !ad.isApproved) ||
      (filterApproval === 'approved' && ad.isApproved);

    return matchesSearch && matchesStatus && matchesCategory && matchesApproval;
  });

  // Pagination logic
  const indexOfLastAd = currentPage * adsPerPage;
  const indexOfFirstAd = indexOfLastAd - adsPerPage;
  const currentAds = filteredAds.slice(indexOfFirstAd, indexOfLastAd);
  const totalPages = Math.ceil(filteredAds.length / adsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {view === 'list' ? (
        <>
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ads Management</h1>
              <p className="text-gray-500 font-medium mt-1">Manage, moderate and promote platform-wide listings.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="p-3 bg-white border-2 border-gray-100 rounded-2xl hover:border-orange-500 transition-all text-gray-400 hover:text-orange-500">
                <ArrowTopRightOnSquareIcon className="w-5 h-5 rotate-45" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Advanced Filter Bar */}
          <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or seller..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:outline-none transition-all font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="relative min-w-[150px]">
                <CheckBadgeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:outline-none appearance-none font-bold transition-all cursor-pointer"
                  value={filterApproval}
                  onChange={(e) => setFilterApproval(e.target.value)}
                >
                  <option value="all">All Approval</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </div>

              <div className="relative min-w-[150px]">
                <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:outline-none appearance-none font-bold transition-all cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="featured">Featured Only</option>
                  <option value="simple">Simple Only</option>
                </select>
              </div>

              <div className="relative min-w-[200px]">
                <AdjustmentsHorizontalIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:outline-none appearance-none font-bold transition-all cursor-pointer"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ads Table */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 italic">
                    <th className="px-4 py-4 w-10">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-2 border-gray-200 text-orange-500 focus:ring-orange-500 cursor-pointer"
                        checked={selectedAds.length === currentAds.length && currentAds.length > 0}
                        onChange={() => {
                          if (selectedAds.length === currentAds.length) setSelectedAds([]);
                          else setSelectedAds(currentAds.map(ad => ad._id));
                        }}
                      />
                    </th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Listing</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Details</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Seller</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right sticky right-0 bg-gray-50/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.03)] z-10 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentAds.map((ad) => (
                    <tr key={ad._id} className={`hover:bg-gray-50/40 transition-all group ${selectedAds.includes(ad._id) ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-5">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-2 border-gray-200 text-orange-500 focus:ring-orange-500 cursor-pointer"
                          checked={selectedAds.includes(ad._id)}
                          onChange={() => toggleSelectAd(ad._id)}
                        />
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                            <img
                              src={getOptimizedImageUrl(ad.images?.[0], 100)}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { 
                                if (e.target.src.includes('/images/')) {
                                  e.target.src = ad.images?.[0] || '/placeholder.png';
                                } else if (!e.target.src.includes('placeholder.png')) {
                                  e.target.src = '/placeholder.png';
                                }
                              }}
                            />
                            {ad.isFeatured && (
                              <div className="absolute top-0.5 right-0.5 bg-yellow-400 p-0.5 rounded-md">
                                <StarSolid className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 text-sm leading-tight truncate max-w-[150px]" title={ad.title}>{ad.title}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase bg-gray-100 px-1.5 py-0.5 rounded-full w-fit">
                              ID: {ad._id.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                              {ad.category?.name || 'Uncategorized'}
                            </span>
                          </div>
                          <p className="text-sm font-black text-gray-900">Rs {ad.price.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
                            Exp: {new Date(ad.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 overflow-hidden border border-orange-100 flex-shrink-0">
                            {ad.seller?.profilePhoto ? (
                              <img src={getOptimizedImageUrl(ad.seller.profilePhoto, 100)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-orange-600 font-black text-[10px]">
                                {ad.seller?.name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-gray-900 truncate max-w-[120px]">{ad.seller?.name || 'Deleted User'}</p>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <p className="text-[10px] text-gray-800 font-bold flex items-center gap-1.5 whitespace-nowrap">
                                <EnvelopeIcon className="w-3.5 h-3.5 text-blue-600" />
                                {ad.seller?.email || 'N/A'}
                              </p>
                              <p className="text-[10px] text-gray-800 font-bold flex items-center gap-1.5 whitespace-nowrap">
                                <PhoneIcon className="w-3.5 h-3.5 text-green-600" />
                                {ad.phone || ad.seller?.phone || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 font-black text-[8px] uppercase px-2 py-0.5 rounded-full w-fit ${ad.isApproved ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                            {ad.isApproved ? 'Approved' : 'Pending'}
                          </span>
                          <span className={`inline-flex items-center gap-1 font-black text-[8px] uppercase px-2 py-0.5 rounded-full w-fit ${ad.isActive && new Date(ad.expiresAt) > new Date() ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                            {ad.isActive && new Date(ad.expiresAt) > new Date() ? 'Live' : 'Hidden'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-right sticky right-0 bg-white group-hover:bg-gray-50 transition-all z-10 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-end gap-1.5">
                          {!ad.isApproved && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.put(`/ads/${ad._id}`, { isApproved: true });
                                  toast.success('Ad approved successfully');
                                  fetchData();
                                } catch (err) { toast.error('Failed to approve'); }
                              }}
                              className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 shadow-sm transition-all"
                              title="Quick Approve"
                            >
                              <CheckBadgeIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setAdToReject(ad);
                              setRejectionModalOpen(true);
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 shadow-sm transition-all"
                            title="Reject/Hide"
                          >
                            <NoSymbolIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.open(`/ads/${generateAdSlug(ad)}`, '_blank')}
                            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-500 hover:border-blue-100 shadow-sm transition-all"
                            title="View Public Page"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingAd({ ...ad });
                              setView('edit');
                            }}
                            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-green-500 hover:border-green-100 shadow-sm transition-all"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleFeatured(ad._id, ad.isFeatured)}
                            className={`p-2 rounded-xl border transition-all shadow-sm ${
                              ad.isFeatured 
                                ? 'bg-yellow-500 text-white border-yellow-500' 
                                : 'bg-white text-gray-400 border-gray-100 hover:text-yellow-500 hover:border-yellow-100'
                            }`}
                            title={ad.isFeatured ? "Unpin" : "Pin"}
                          >
                            {ad.isFeatured ? <StarSolid className="w-4 h-4" /> : <StarOutline className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteAd(ad._id)}
                            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-100 shadow-sm transition-all"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredAds.length > adsPerPage && (
              <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Showing {indexOfFirstAd + 1} to {Math.min(indexOfLastAd, filteredAds.length)} of {filteredAds.length} Listings
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-orange-500 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRightIcon className="w-5 h-5 rotate-180" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                          : 'bg-white border border-gray-100 text-gray-400 hover:border-orange-500 hover:text-orange-500'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-orange-500 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {filteredAds.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center bg-gray-50/30">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <NoSymbolIcon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-gray-900">No Advertisements Found</h3>
                <p className="text-gray-400 font-medium mt-2 max-w-xs text-center">We couldn't find any listings matching your current filtering criteria.</p>
                <button
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterCategory('all'); }}
                  className="mt-6 px-6 py-2 bg-white border-2 border-gray-100 rounded-xl text-sm font-black text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {selectedAds.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
              <div className="bg-gray-900 text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-10 border border-gray-800">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Selected Items</span>
                  <span className="text-lg font-black text-orange-500">{selectedAds.length} Ads</span>
                </div>
                
                <div className="h-10 w-px bg-gray-700" />
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleBulkAction('isActive', true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    title="Make Active"
                  >
                    <EyeIcon className="w-4 h-4" /> Live
                  </button>
                  <button 
                    onClick={() => handleBulkAction('isActive', false)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-800 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    title="Hide/Deactivate"
                  >
                    <NoSymbolIcon className="w-4 h-4" /> Hide
                  </button>
                  <button 
                    onClick={() => handleBulkAction('isApproved', true)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    <CheckBadgeIcon className="w-4 h-4" /> Approve
                  </button>
                  <button 
                    onClick={() => handleBulkAction('isFeatured', true)}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    <StarSolid className="w-4 h-4 text-white" /> Gallery
                  </button>
                  <button 
                    onClick={() => handleBulkAction('delete')}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    <TrashIcon className="w-4 h-4" /> Delete
                  </button>
                  
                  <div className="h-10 w-px bg-gray-700 mx-2" />
                  
                  <button 
                    onClick={() => setSelectedAds([])}
                    className="px-4 py-2 text-gray-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* In-Page Edit View */
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden animate-slide-up">
          <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setView('list')}
                className="p-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 hover:border-orange-500 transition-all shadow-sm"
              >
                <ChevronRightIcon className="w-6 h-6 rotate-180" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                  Edit Advertisement
                </h2>
                <p className="text-gray-400 font-bold mt-1">Refining Listing: <span className="text-orange-500">#{editingAd._id.slice(-8)}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('list')}
                className="px-8 py-4 rounded-2xl font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest text-xs"
              >
                Discard
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={updateLoading}
                className={`px-12 py-4 rounded-2xl font-black text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-200 transition-all uppercase tracking-widest text-sm ${updateLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="p-10">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              {/* Left Column: Form */}
              <div className="xl:col-span-2">
                <form onSubmit={handleEditSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Title</label>
                      <div className="relative">
                        <DocumentTextIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300" />
                        <input
                          type="text"
                          className="w-full pl-14 pr-6 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none transition-all font-black text-gray-900"
                          value={editingAd.title}
                          onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Price (PKR)</label>
                      <div className="relative">
                        <CurrencyDollarIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300" />
                        <input
                          type="number"
                          className="w-full pl-14 pr-6 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none transition-all font-black text-gray-900"
                          value={editingAd.price}
                          onChange={(e) => setEditingAd({ ...editingAd, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Category</label>
                      <div className="relative">
                        <TagIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 pointer-events-none" />
                        <select
                          className="w-full pl-14 pr-12 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none appearance-none font-black text-gray-900 transition-all cursor-pointer"
                          value={editingAd.category._id || editingAd.category}
                          onChange={(e) => setEditingAd({ ...editingAd, category: e.target.value })}
                          required
                        >
                          {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Ad Type</label>
                      <div className="relative">
                        <StarOutline className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 pointer-events-none" />
                        <select
                          className="w-full pl-14 pr-12 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none appearance-none font-black text-gray-900 transition-all cursor-pointer"
                          value={editingAd.adType || 'simple'}
                          onChange={(e) => setEditingAd({ ...editingAd, adType: e.target.value })}
                          required
                        >
                          <option value="simple">Simple Ad</option>
                          <option value="featured">Featured Ad</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Contact Phone</label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300" />
                        <input
                          type="text"
                          className="w-full pl-14 pr-6 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none transition-all font-black text-gray-900"
                          value={editingAd.phone || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Website (UGC)</label>
                      <div className="relative">
                        <ArrowTopRightOnSquareIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 pointer-events-none" />
                        <input
                          type="url"
                          className="w-full pl-14 pr-6 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none transition-all font-black text-gray-900"
                          value={editingAd.website || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, website: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Expiry Date</label>
                      <div className="relative">
                        <CalendarDaysIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300" />
                        <input
                          type="date"
                          className="w-full pl-14 pr-6 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none transition-all font-black text-gray-900"
                          value={new Date(editingAd.expiresAt).toISOString().split('T')[0]}
                          onChange={(e) => setEditingAd({ ...editingAd, expiresAt: e.target.value })}
                          required
                        />
                      </div>
                      <p className="px-1 text-[10px] font-bold text-gray-400 uppercase">Originally Posted: {formatFullDate(editingAd.createdAt)}</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">City</label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 pointer-events-none" />
                        <select
                          className="w-full pl-14 pr-12 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none appearance-none font-black text-gray-900 transition-all cursor-pointer"
                          value={editingAd.city || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, city: e.target.value, area: null, hotel: null })}
                          required
                        >
                          <option value="">Select City</option>
                          {cities.map(c => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Area</label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 pointer-events-none" />
                        <select
                          className="w-full pl-14 pr-12 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none appearance-none font-black text-gray-900 transition-all cursor-pointer"
                          value={editingAd.area?._id || editingAd.area || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, area: e.target.value, hotel: null })}
                        >
                          <option value="">No Area / Generic City</option>
                          {cityAreas.map(a => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Hotel (If Applicable)</label>
                      <div className="relative">
                        <BuildingStorefrontIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 pointer-events-none" />
                        <select
                          className="w-full pl-14 pr-12 py-4.5 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none appearance-none font-black text-gray-900 transition-all cursor-pointer"
                          value={editingAd.hotel?._id || editingAd.hotel || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, hotel: e.target.value, area: null })}
                        >
                          <option value="">No Hotel</option>
                          {cityHotels.map(h => (
                            <option key={h._id} value={h._id}>{h.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Special Badges (Multiple Select)</label>
                       <div className="flex flex-wrap gap-3">
                         {[
                           { val: 'High Demand', label: '🔥 High Demand', bg: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100', activeBg: 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200' },
                           { val: 'Popular', label: '⭐ Popular', bg: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100', activeBg: 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200' },
                           { val: 'Hot Premium', label: '💎 Hot Premium', bg: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100', activeBg: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-none shadow-md shadow-amber-200' },
                           { val: 'Trending Now', label: '📈 Trending Now', bg: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100', activeBg: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200' },
                           { val: 'Recommended', label: '✅ Recommended', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100', activeBg: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200' }
                         ].map(badge => {
                           const isActive = (editingAd.badges || []).includes(badge.val);
                           return (
                             <button
                               key={badge.val}
                               type="button"
                               onClick={() => {
                                 const currentBadges = editingAd.badges || [];
                                 let newBadges;
                                 if (isActive) {
                                   newBadges = currentBadges.filter(b => b !== badge.val);
                                 } else {
                                   newBadges = [...currentBadges, badge.val];
                                 }
                                 setEditingAd({ ...editingAd, badges: newBadges });
                               }}
                               className={`px-4 py-2 border rounded-[20px] font-black text-[11px] uppercase tracking-wider transition-all duration-300 ${isActive ? badge.activeBg : badge.bg}`}
                             >
                               {badge.label}
                             </button>
                           );
                         })}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Listing Description</label>
                    <textarea
                      className="w-full p-6 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-orange-500 focus:outline-none transition-all font-bold text-gray-900 min-h-[200px]"
                      value={editingAd.description}
                      onChange={(e) => setEditingAd({ ...editingAd, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="flex flex-wrap gap-10 pt-6">
                    <label className="flex items-center gap-4 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-8 h-8 rounded-xl border-2 border-gray-200 text-orange-500 focus:ring-orange-500 cursor-pointer transition-all"
                        checked={editingAd.isActive}
                        onChange={(e) => setEditingAd({ ...editingAd, isActive: e.target.checked })}
                      />
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900">Make Active</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Visible on marketplace</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-4 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-8 h-8 rounded-xl border-2 border-gray-200 text-green-500 focus:ring-green-500 cursor-pointer transition-all"
                        checked={editingAd.isApproved}
                        onChange={(e) => setEditingAd({ ...editingAd, isApproved: e.target.checked })}
                      />
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900">Admin Approval</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Verified listing</span>
                      </div>
                    </label>

                    {!editingAd.isApproved && (
                      <div className="md:col-span-2 space-y-3 animate-fade-in">
                        <label className="text-xs font-black text-red-500 uppercase tracking-widest px-1">Rejection Reason (Internal & Email)</label>
                        <textarea
                          className="w-full p-4 rounded-2xl border-2 border-red-50 bg-red-50/30 focus:bg-white focus:border-red-500 focus:outline-none transition-all font-bold text-gray-900"
                          placeholder="Why is this ad being rejected? (User will see this in their email)"
                          value={editingAd.rejectionReason || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, rejectionReason: e.target.value })}
                        ></textarea>
                      </div>
                    )}

                    <label className="flex items-center gap-4 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-8 h-8 rounded-xl border-2 border-gray-200 text-yellow-500 focus:ring-yellow-500 cursor-pointer transition-all"
                        checked={editingAd.isFeatured}
                        onChange={(e) => setEditingAd({ ...editingAd, isFeatured: e.target.checked })}
                      />
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900">Gallery Ad (Featured)</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Show in top circular carousel</span>
                      </div>
                    </label>
                  </div>

                  {/* Image Management Section */}
                  <div className="pt-8 border-t border-gray-100">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 block mb-4">Ad Images (Preview)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {editingAd.images && editingAd.images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 shadow-sm">
                          <img 
                            src={getOptimizedImageUrl(img, 300)} 
                            className="w-full h-full object-cover" 
                            alt={`Slide ${idx}`}
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const newImgs = editingAd.images.filter((_, i) => i !== idx);
                              setEditingAd({...editingAd, images: newImgs});
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-md"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm py-1 px-2 text-[8px] font-black text-white text-center uppercase tracking-widest">
                            Image {idx + 1}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => document.getElementById('adminFileInput').click()}
                        disabled={updateLoading}
                        className="aspect-square rounded-2xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center text-orange-500 hover:bg-orange-50 hover:border-orange-500 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <PlusIcon className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 text-center">Add Photos</span>
                        <input 
                          id="adminFileInput" 
                          type="file" 
                          multiple 
                          hidden 
                          accept="image/*" 
                          onChange={handleAdminImageUpload} 
                        />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Column: Seller Info Card */}
              <div className="space-y-8">
                <div className="bg-gray-50/50 rounded-[40px] border border-gray-100 p-8">
                  <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                      <CheckBadgeIcon className="w-4 h-4" />
                    </div>
                    Seller Profiles
                  </h3>

                  <div className="flex flex-col items-center text-center p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="w-32 h-32 rounded-[40px] bg-orange-50 overflow-hidden border-4 border-white shadow-xl mb-6">
                      {editingAd.seller?.profilePhoto ? (
                        <img src={getOptimizedImageUrl(editingAd.seller.profilePhoto, 200)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-600 font-black text-4xl">
                          {editingAd.seller?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <h4 className="text-2xl font-black text-gray-900">{editingAd.seller?.name || 'Deleted User'}</h4>
                    <p className="text-orange-500 font-bold text-sm mt-1 uppercase tracking-widest bg-orange-50 px-4 py-1 rounded-full">Seller Account</p>

                    <div className="w-full mt-8 space-y-4 border-t border-gray-100 pt-8">
                      <div className="flex items-center justify-between text-left">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                          <p className="font-bold text-gray-900 truncate max-w-[180px]">{editingAd.seller?.email || 'No email'}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                          <EnvelopeIcon className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-left">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Phone</p>
                          <p className="font-bold text-gray-900">{editingAd.seller?.phone || 'No phone'}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                          <PhoneIcon className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-left">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Location</p>
                          <p className="font-bold text-gray-900">{editingAd.seller?.city || 'No city'}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                          <MapPinIcon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-blue-50/50 rounded-[32px] border border-blue-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Internal Note</p>
                    <p className="text-xs text-blue-700 font-bold leading-relaxed">
                      This user has been a member since {editingAd.seller?.createdAt ? new Date(editingAd.seller.createdAt).toLocaleDateString() : 'recently'}.
                      Always verify the listing content for compliance with market policies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                  <NoSymbolIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Reject Listing</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">#{adToReject?._id.slice(-8)}</p>
                </div>
              </div>
              <button 
                onClick={() => setRejectionModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-all"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="p-5 bg-orange-50 rounded-3xl border border-orange-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
                  <img src={getOptimizedImageUrl(adToReject?.images?.[0], 100)} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-900 truncate">{adToReject?.title}</p>
                  <p className="text-xs font-bold text-orange-600 uppercase">Rs {adToReject?.price.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Rejection Reason</label>
                <textarea
                  className="w-full p-6 rounded-[24px] border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-red-500 focus:outline-none transition-all font-bold text-gray-900 min-h-[150px]"
                  placeholder="Enter reason for rejection..."
                  value={tempRejectionReason}
                  onChange={(e) => setTempRejectionReason(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 font-medium px-1 flex items-center gap-1.5">
                  <EnvelopeIcon className="w-3 h-3" /> This reason will be emailed to the seller immediately.
                </p>
              </div>
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex gap-4">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="flex-1 py-4.5 rounded-2xl font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setUpdateLoading(true);
                    await api.put(`/ads/${adToReject._id}`, { 
                      isApproved: false, 
                      isActive: false,
                      rejectionReason: tempRejectionReason 
                    });
                    toast.success('Ad rejected and seller notified');
                    setRejectionModalOpen(false);
                    fetchData();
                  } catch (err) {
                    toast.error('Failed to reject ad');
                  } finally {
                    setUpdateLoading(false);
                  }
                }}
                disabled={updateLoading || !tempRejectionReason.trim()}
                className="flex-[2] py-4.5 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-200 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
              >
                {updateLoading ? 'Processing...' : 'Send Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
