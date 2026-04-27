import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import AdCard from '../components/AdCard';
import {
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  CameraIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import NotFoundPage from './NotFoundPage';
import { Helmet } from 'react-helmet-async';
import { usePageSeo } from '../hooks/usePageSeo';
import NoIndex from '../components/NoIndex';

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser, updateProfile, token } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !userId || currentUser?._id === userId || userId === 'me';
  const [profileUser, setProfileUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [showEditModal, setShowEditModal] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    bio: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, [userId, currentUser]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(isOwnProfile ? '/users/profile' : `/users/${userId}/public`);
      const targetUser = data;

      setProfileUser(targetUser);
      if (targetUser) {
        setFormData({
          name: targetUser.name || '',
          phone: targetUser.phone || '',
          city: targetUser.city || '',
          bio: targetUser.bio || ''
        });

        // Fetch Ads
        const adsRes = await api.get(isOwnProfile ? '/ads/my' : `/ads/seller/${targetUser._id}`);
        setAds(adsRes.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const { seo } = usePageSeo('profile', profileUser?._id, { title: profileUser?.name || 'User Profile' });
  const seoReady = seo !== null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isOwnProfile && updateProfile) {
      await updateProfile(formData);
      setShowEditModal(false);
      fetchProfileData();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>;
  if (!profileUser) return <NotFoundPage />;

  const filteredAds = ads.filter(ad => {
    if (activeTab === 'active') return ad.isActive;
    if (activeTab === 'sold') return ad.status === 'sold';
    if (activeTab === 'expired') return !ad.isActive;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NoIndex />
      {seoReady && (
        <Helmet>
          <title>{seo.title}</title>
          <meta name="description" content={seo.metaDescription} />
          {seo.keywords && <meta name="keywords" content={seo.keywords} />}
          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.metaDescription} />
        </Helmet>
      )}
      {/* Profile Header Section */}
      <section className="bg-[#1a2332] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          <div className="relative group">
            {profileUser.profilePhoto ? (
              <img src={getOptimizedImageUrl(profileUser.profilePhoto, 160)} width="128" height="128" loading="lazy" className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-[#2d3a4d]" alt={profileUser.name} />
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-orange-500 flex items-center justify-center text-4xl font-bold text-white border-4 border-[#2d3a4d]">
                {profileUser.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-white text-3xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-2">
              {profileUser.name}
              {profileUser.badges?.slice(0, 3).map(badge => (
                <span key={badge} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md text-[10px] font-black uppercase tracking-tight border border-indigo-500/30 flex items-center gap-1" title={badge.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}>
                  <CheckBadgeIcon className="w-3.5 h-3.5 text-indigo-400" />
                  {badge.replace(/([A-Z])/g, ' $1')}
                </span>
              ))}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
              <span className="text-gray-400 text-sm font-medium">Member since {new Date(profileUser.createdAt).getFullYear()}</span>
              <div className="flex items-center gap-1.5 bg-[#2d3a4d]/50 px-3 py-1 rounded-full">
                <MapPinIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm">{profileUser.city || 'Pakistan'}</span>
              </div>
            </div>
            {/* <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => <StarSolid key={i} className="w-4 h-4 text-orange-500" />)}
              </div>
              <span className="text-gray-300 text-sm font-semibold">5.0</span>
            </div> */}
          </div>

          {isOwnProfile && (
            <button
              onClick={() => navigate('/dashboard?tab=settings')}
              className="mt-4 md:mt-0 px-8 py-3 rounded-full border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-500 hover:text-white transition-all duration-300"
            >
              Edit Profile
            </button>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6">
        {/* Stats Bar */}
        <div className="bg-white rounded-3xl -mt-8 shadow-xl border border-gray-100 p-8 grid grid-cols-3 divide-x divide-gray-100 relative z-10 transition-transform hover:scale-[1.01] duration-300">
          <div className="text-center px-4">
            <div className="text-3xl font-black text-gray-800 tracking-tight">{ads.length}</div>
            <div className="text-xs font-bold text-gray-500 uppercase mt-1">Total Ads</div>
          </div>
          <div className="text-center px-4">
            <div className="text-3xl font-black text-gray-800 tracking-tight">{ads.reduce((acc, ad) => acc + (ad.views || 0), 0)}</div>
            <div className="text-xs font-bold text-gray-500 uppercase mt-1">Total Views</div>
          </div>
          <div className="text-center px-4">
            <div className="text-3xl font-black text-gray-800 tracking-tight">Level 1</div>
            <div className="text-xs font-bold text-gray-500 uppercase mt-1">Badge</div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{isOwnProfile ? 'My' : profileUser.name + "'s"} Advertisements</h2>
              {isOwnProfile && (
                <div className="flex bg-gray-200/50 p-1 rounded-xl">
                  {['active', 'expired', 'sold'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-300 ${activeTab === tab ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredAds.length > 0 ? (
              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-6"
              >
                {filteredAds.map(ad => (
                  <div key={ad._id} className="flex h-full">
                    <AdCard ad={ad} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                <div className="text-6xl mb-4">😢</div>
                <h3 className="text-xl font-bold text-gray-800">No {activeTab} ads found</h3>
                <p className="text-gray-400 mt-2 max-w-xs mx-auto">Looks like there's nothing here yet.</p>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-6">Contact Info</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl"><PhoneIcon className="w-5 h-5 text-gray-400" /></div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase">Phone Number</div>
                    <div className="text-sm font-bold text-gray-800 mt-1">
                      {isOwnProfile || phoneVisible ? (
                        profileUser.phone || 'N/A'
                      ) : (
                        <button onClick={() => setPhoneVisible(true)} className="text-orange-500 underline decoration-orange-300 underline-offset-4 hover:text-orange-600 transition-colors">Click to reveal</button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl"><EnvelopeIcon className="w-5 h-5 text-gray-400" /></div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase">Email</div>
                    <div className="text-sm font-bold text-gray-800 mt-1 truncate max-w-[180px]">{profileUser.email}</div>
                  </div>
                </div>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={() => navigate(`/messages?sellerId=${profileUser._id}`)}
                  className="w-full mt-8 py-4 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  Message Seller
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden">
            <div className="p-8 pb-0 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900">Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="edit-name" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 focus:border-orange-500 outline-none font-semibold"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="edit-phone" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                  <input
                    id="edit-phone"
                    type="text"
                    className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 focus:border-orange-500 outline-none font-semibold"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-city" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">City</label>
                <select
                  id="edit-city"
                  className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 focus:border-orange-500 outline-none font-semibold"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                >
                  <option value="">Select City</option>
                  {['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sargodha'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-bio" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Bio</label>
                <textarea
                  id="edit-bio"
                  className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 focus:border-orange-500 outline-none font-semibold h-28 resize-none"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-100 active:scale-95 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
