import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import {
  UserCircleIcon, ShoppingBagIcon, HeartIcon,
  ChatBubbleLeftRightIcon, Cog6ToothIcon, PencilIcon,
  TrashIcon, EyeIcon, ChevronRightIcon, ArrowTopRightOnSquareIcon, CalendarIcon, ChartBarIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import AdCard from '../components/AdCard';
import { generateAdSlug } from '../utils/urlUtils';
import { compressImage } from '../utils/imageUtils';
import { timeAgo } from '../utils/timeUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { PhotoIcon } from '@heroicons/react/24/outline';

export default function UserDashboardPage() {
  const { user, updateProfile, logout, fetchUserProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'ads';

  const [myAds, setMyAds] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);


  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    bio: user?.bio || '',
    profilePhoto: user?.profilePhoto || '',
    email: user?.email || '',
    password: ''
  });

  useEffect(() => {
    if (fetchUserProfile) fetchUserProfile(false);
    fetchSettings();
    if (activeTab === 'ads') fetchMyAds();
    if (activeTab === 'favorites') fetchFavorites();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSettings();
        if (activeTab === 'ads') fetchMyAds();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (activeTab === 'ads') fetchMyAds();
    if (activeTab === 'favorites') fetchFavorites();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const { data } = await api.get('/ads/my/analytics');
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchMyAds = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/ads/my');
      setMyAds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/favorites');
      setFavorites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const success = await updateProfile(profileData);
    if (success) alert('Profile updated!');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const compressedFile = await compressImage(file, { maxSizeMB: 0.5, maxWidthOrHeight: 500 });
      const upData = new FormData();
      upData.append('images', compressedFile);
      const { data } = await api.post('/upload', upData);
      setProfileData(prev => ({ ...prev, profilePhoto: data.urls[0] }));
    } catch (err) {
      console.error('Photo Upload Error:', err);
      alert('Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (id) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await api.delete(`/ads/${id}`);
        setMyAds(myAds.filter(ad => ad._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleRenewAd = async (ad) => {
    if (!window.confirm('Renew this ad for the default duration?')) return;
    try {
      const duration = ad.isFeatured ? (settings?.featuredAdsDuration || 7) : (settings?.simpleAdsDuration || 30);
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + duration);
      await api.put(`/ads/${ad._id}`, { expiresAt: newExpiresAt, isActive: true });
      alert(`Ad renewed for ${duration} days!`);
      fetchMyAds();
    } catch (err) {
      alert('Failed to renew ad');
    }
  };

  const tabs = [
    { id: 'ads', label: 'My Ads', icon: <ShoppingBagIcon className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="w-5 h-5" /> },
    { id: 'favorites', label: 'Favorites', icon: <HeartIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Cog6ToothIcon className="w-5 h-5" /> },
  ];

  if (!user) return <div className="flex justify-center items-center min-vh-80"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper container-custom bg-[#f7f8fa] min-h-screen">
      <div className="dashboard-layout flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-8 py-6">
        
        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          {/* Profile Card */}
          <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm group">
            <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
            <div className="p-6 text-center relative z-10">
              <div className="relative inline-block mb-4">
                {user.profilePhoto ? (
                  <img 
                    key={user.profilePhoto}
                    src={getOptimizedImageUrl(user.profilePhoto, 200)} 
                    className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white mx-auto transition-transform group-hover:scale-105" 
                    onError={(e) => { 
                      // Phase 1: Try raw if optimized fails
                      if (e.target.src.includes('/images/')) {
                        e.target.src = user.profilePhoto;
                      } 
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center text-4xl font-black mx-auto shadow-lg border-4 border-white">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
              <h3 className="font-black text-xl text-gray-900 tracking-tight">{user.name}</h3>
              <p className="text-sm font-medium text-gray-500 mt-0.5">{user.email}</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="bg-orange-50 text-orange-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-orange-100">Verified Seller</span>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-100">Since {new Date(user.createdAt).getFullYear()}</span>
              </div>
            </div>
            {/* Mobile Stats */}
            <div className="lg:hidden grid grid-cols-3 border-t border-gray-50 bg-gray-50/50">
              <div className="p-4 text-center border-r border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total</p>
                <p className="font-black text-gray-900">{myAds.length}</p>
              </div>
              <div className="p-4 text-center border-r border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Active</p>
                <p className="font-black text-green-600">{myAds.filter(a => a.isApproved).length}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Saved</p>
                <p className="font-black text-orange-500">{favorites.length}</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="sticky top-4 z-40 bg-[#f7f8fa] lg:bg-transparent -mx-4 lg:mx-0 px-4 lg:px-0">
            <div className="grid grid-cols-3 lg:flex lg:flex-col p-1.5 lg:p-0 bg-white shadow-xl lg:shadow-none lg:bg-transparent rounded-2xl border border-gray-100 lg:border-none gap-1.5 lg:gap-3">
              {tabs.map(tab => (
                <Link
                  key={tab.id}
                  to={`/dashboard?tab=${tab.id}`}
                  className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-1 lg:px-6 py-3 lg:py-4 rounded-xl text-[10px] lg:text-sm font-black transition-all group ${activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-xl'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 lg:bg-white lg:border lg:border-gray-100'
                  }`}
                >
                  <span className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                  {activeTab !== tab.id && (
                    <ChevronRightIcon className="w-4 h-4 ml-auto hidden lg:block text-gray-300" />
                  )}
                </Link>
              ))}
            </div>

            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-black text-red-500 bg-white border border-gray-100 hover:bg-red-50 transition-all w-full mt-4 lg:mt-6 group hidden lg:flex"
            >
              <span>Logout Account</span>
              <ChevronRightIcon className="w-4 h-4 ml-auto text-red-200" />
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="min-w-0">
          {activeTab === 'ads' && (
            <div className="fade-in">
              <div className="hidden lg:flex justify-between items-center gap-4 mb-8">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Account Overview</h1>
                <Link to="/post-ad" className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">+ Post New Ad</Link>
              </div>

              {/* Desktop Stats */}
              <div className="hidden lg:grid grid-cols-5 gap-4 mb-10">
                {[
                  { label: 'Total Ads', value: myAds.length, bg: 'bg-blue-50/50', text: 'text-blue-600' },
                  { label: 'Approved', value: myAds.filter(a => a.isApproved).length, bg: 'bg-emerald-50/50', text: 'text-emerald-600' },
                  { label: 'Pending', value: myAds.filter(a => !a.isApproved).length, bg: 'bg-amber-50/50', text: 'text-amber-600' },
                  { label: 'Featured', value: myAds.filter(a => a.isFeatured).length, bg: 'bg-purple-50/50', text: 'text-purple-600' },
                  { label: 'Expired', value: myAds.filter(a => a.expiresAt && new Date(a.expiresAt) < new Date()).length, bg: 'bg-rose-50/50', text: 'text-rose-600' }
                ].map(stat => (
                  <div key={stat.label} className={`${stat.bg} p-5 rounded-[24px] border border-gray-100 shadow-sm`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.text}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Mobile Header */}
              <div className="lg:hidden flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900">My Ads</h2>
                <Link to="/post-ad" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg">+ New Ad</Link>
              </div>

              {loading ? <div className="py-20 flex justify-center"><div className="spinner"></div></div> : (
                myAds.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                    <ShoppingBagIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">You haven't posted any ads yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {myAds.map(ad => (
                      <div key={ad._id} className="bg-white rounded-[32px] border border-gray-100 p-4 lg:p-5 flex gap-5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all group relative overflow-hidden">
                        {/* Status Ribbon for Mobile/Desktop */}
                        <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest border-l border-b ${
                          ad.isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {ad.isApproved ? 'Active' : 'Pending'}
                        </div>

                        <div className="w-24 h-24 lg:w-44 lg:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-50">
                          <img
                            key={ad.images?.[0]}
                            src={getOptimizedImageUrl(ad.images?.[0], 400)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { 
                              // Phase 1: Try raw if optimized fails
                              if (e.target.src.includes('/images/')) {
                                e.target.src = ad.images?.[0];
                              } 
                              // Phase 2: Show generic icon state
                              else {
                                e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-50 text-gray-200"><svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>`;
                              }
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col py-0.5">
                          <div className="mb-auto">
                            <Link to={`/ads/${generateAdSlug(ad)}`} className="block group/title">
                              <h4 className="font-black text-base lg:text-xl text-gray-900 group-hover/title:text-orange-500 transition-colors truncate leading-tight">
                                {ad.title}
                              </h4>
                            </Link>
                            <p className="text-[11px] lg:text-xs text-gray-400 font-medium line-clamp-2 mt-1.5 leading-relaxed max-w-2xl">
                              {ad.description || 'No description provided.'}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              <p className="text-lg lg:text-xl font-black text-orange-500">
                                PKR {Number(ad.price).toLocaleString()}
                              </p>
                              {ad.isFeatured && (
                                <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">Featured</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                            <div className="flex items-center gap-2">
                              <Link to={`/edit-ad/${ad._id}`} className="p-2 bg-gray-50 rounded-xl hover:bg-orange-100 text-gray-400 hover:text-orange-600 transition-all">
                                <PencilIcon className="w-4 h-4" />
                              </Link>
                              <button onClick={() => handleDeleteAd(ad._id)} className="p-2 bg-gray-50 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                <EyeIcon className="w-3.5 h-3.5" /> 
                                <span>{ad.views || 0} Views</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-300">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                <span>{timeAgo(ad.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="fade-in">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-8">Saved Items</h2>
              {loading ? <div className="py-20 flex justify-center"><div className="spinner"></div></div> : (
                favorites.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                    <HeartIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">No favorite ads yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {favorites.map(ad => (
                      <AdCard key={ad._id} ad={ad} initialFav={true} onFavToggle={(id, fav) => !fav && setFavorites(favorites.filter(f => f._id !== id))} />
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="fade-in">
              <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm">
                <div className="mb-10">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Profile Settings</h2>
                  <p className="text-sm font-medium text-gray-500 mt-1">Manage your public information and account security.</p>
                </div>
                <form onSubmit={handleUpdate} className="space-y-12">
                  <div className="flex flex-col md:flex-row gap-10">
                    <div className="relative mx-auto md:mx-0">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-xl">
                        {profileData.profilePhoto ? (
                          <img src={getImageUrl(profileData.profilePhoto)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center text-4xl font-black">
                            {profileData.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <label htmlFor="p-upload" className="absolute -bottom-1 -right-1 bg-white p-2.5 rounded-full shadow-lg border border-gray-100 cursor-pointer hover:scale-110 transition-all">
                        <PhotoIcon className="w-5 h-5 text-orange-500" />
                        <input type="file" id="p-upload" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                    <div className="flex-1 space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Full Name</label>
                        <input type="text" className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-900 focus:bg-white focus:border-orange-500 transition-all outline-none" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Short Bio</label>
                        <textarea className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-900 focus:bg-white focus:border-orange-500 transition-all outline-none min-h-[120px] resize-none" value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} placeholder="Tell us about yourself..." />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                        <input type="text" className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-900 focus:bg-white focus:border-orange-500 transition-all outline-none" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Location</label>
                        <select className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-900 focus:bg-white focus:border-orange-500 transition-all outline-none" value={profileData.city} onChange={e => setProfileData({ ...profileData, city: e.target.value })}>
                          <option value="">Select City</option>
                          {['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Email (Read-only)</label>
                        <input type="email" className="w-full bg-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-400 cursor-not-allowed" value={profileData.email} disabled />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Change Password</label>
                        <input type="password" className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-900 focus:bg-white focus:border-orange-500 transition-all outline-none" value={profileData.password} onChange={e => setProfileData({ ...profileData, password: e.target.value })} placeholder="••••••••" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-50 flex items-center justify-end">
                    <button type="submit" className="bg-orange-500 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all">Save Profile Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="fade-in space-y-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Seller Insights</h1>
                <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-black text-gray-500 uppercase">Live Performance</span>
                </div>
              </div>

              {analyticsLoading ? (
                <div className="py-20 flex justify-center"><div className="spinner"></div></div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-[64px] group-hover:bg-orange-500/10 transition-colors"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Ad Views</p>
                      <h4 className="text-3xl font-black text-gray-900">{analyticsData?.summary?.totalViews || 0}</h4>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-orange-600">
                        <ArrowTrendingUpIcon className="w-4 h-4" />
                        <span>All time reach</span>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[64px] group-hover:bg-blue-500/10 transition-colors"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Impressions</p>
                      <h4 className="text-3xl font-black text-gray-900">{analyticsData?.summary?.totalImpressions || 0}</h4>
                      <p className="mt-4 text-xs font-bold text-blue-600">Last 14 days</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[64px] group-hover:bg-emerald-500/10 transition-colors"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Engagment Rate</p>
                      <h4 className="text-3xl font-black text-gray-900">
                        {analyticsData?.summary?.totalImpressions > 0 
                          ? ((analyticsData.summary.totalViews / analyticsData.summary.totalImpressions) * 100).toFixed(1)
                          : '0.0'
                        }%
                      </h4>
                      <p className="mt-4 text-xs font-bold text-emerald-600">Views per impression</p>
                    </div>
                  </div>

                  {/* Graph */}
                  <div className="bg-white p-6 lg:p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900">Performance Trends</h3>
                      <p className="text-xs font-medium text-gray-500">Daily breakdown of views and impressions.</p>
                    </div>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData?.stats || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="displayDate" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '20px', 
                              border: 'none', 
                              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                              padding: '12px 16px'
                            }} 
                            itemStyle={{ fontSize: '12px', fontWeight: 800 }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="views" 
                            name="Clicks/Views"
                            stroke="#f97316" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorViews)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="impressions" 
                            name="Impressions"
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorImpressions)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Ad */}
                  {analyticsData?.summary?.topAd && (
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-[40px] p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
                      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/20 bg-black/20">
                          <img 
                            key={analyticsData.summary.topAd.images?.[0]}
                            src={getOptimizedImageUrl(analyticsData.summary.topAd.images?.[0], 400)} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { 
                              // Phase 1: Try raw if optimized fails
                              if (e.target.src.includes('/images/')) {
                                e.target.src = analyticsData.summary.topAd.images?.[0];
                              } 
                            }}
                          />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Top Performing Ad</p>
                          <h3 className="text-xl font-black mb-1">{analyticsData.summary.topAd.title}</h3>
                          <p className="text-sm font-medium text-gray-400">This ad received {analyticsData.summary.topAd.views} views total.</p>
                        </div>
                        <Link to={`/ads/${analyticsData.summary.topAd.slug}`} className="bg-white text-black px-8 py-3 rounded-2xl font-black hover:bg-orange-500 hover:text-white transition-all">View Ad</Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
