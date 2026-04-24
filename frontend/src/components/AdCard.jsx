import { Link } from 'react-router-dom';
import { 
  MapPinIcon, HeartIcon, CheckBadgeIcon, 
  EyeIcon, StarIcon, PhotoIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { generateAdSlug } from '../utils/urlUtils';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/timeUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import LazyImage from './LazyImage';

const PLACEHOLDER = '/placeholder.png';

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export default function AdCard({ ad, initialFav = false, onFavToggle, viewMode = 'grid', forceFeatured = false }) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(initialFav);
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setFavorited(initialFav);
  }, [initialFav]);

  const toggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      const { data } = await api.post(`/favorites/${ad._id}`);
      setFavorited(data.favorited);
      if (onFavToggle) onFavToggle(ad._id, data.favorited);
    } catch (err) {
      console.error(err);
    }
  };

  const adSlug = generateAdSlug(ad);
  const adUrl = `/ads/${adSlug}`;

  // Badge Style Helper
  const getBadgeStyles = (badgeName) => {
    switch (badgeName) {
      case 'High Demand':
        return { 
          bg: 'bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]', 
          text: 'text-white', 
          icon: <StarSolid className="w-2.5 h-2.5" />,
          animate: 'animate-pulse-red' 
        };
      case 'Popular':
        return { 
          bg: 'bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.3)]', 
          text: 'text-white', 
          icon: <StarSolid className="w-2.5 h-2.5" /> 
        };
      case 'Hot Premium':
        return { 
          bg: 'bg-gradient-to-r from-[#f59e0b] to-[#ea580c] shadow-[0_0_12px_rgba(245,158,11,0.4)]', 
          text: 'text-white font-black', 
          icon: <StarSolid className="w-2.5 h-2.5" /> 
        };
      case 'Trending Now':
        return { 
          bg: 'bg-[#9333ea] shadow-[0_0_10px_rgba(147,51,234,0.4)]', 
          text: 'text-white', 
          icon: <StarSolid className="w-2.5 h-2.5" />,
          animate: 'animate-pulse' 
        };
      case 'Recommended':
        return { 
          bg: 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.3)]', 
          text: 'text-white', 
          icon: <CheckBadgeIcon className="w-2.5 h-2.5" /> 
        };
      default:
        return null;
    }
  };

  // Minimalist Premium Styles
  const isPremium = ad.isFeatured || forceFeatured;
  const cardBaseClasses = "group flex flex-col h-full bg-white transition-all duration-300 overflow-hidden border relative rounded-2xl";
  const featuredStyles = "border-2 border-orange-500 shadow-[0_10px_25px_rgba(249,115,22,0.1)] z-10";
  const simpleStyles = "border-[#f1f5f9] hover:border-gray-200 shadow-sm";

  const hasImage = ad.images?.[0] && !imgError;

  const categoryText = ad.subcategory?.name 
    ? `${ad.category?.name || 'Category'} > ${ad.subcategory.name}`
    : (ad.category?.name || (typeof ad.category === 'object' ? 'Listing' : 'Listing'));

  const locationText = ad.area?.name 
    ? `${ad.area.name}, ${ad.city || 'Pakistan'}`
    : (ad.city || 'Pakistan');

  const handleWhatsApp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const phone = ad.phone || ad.seller?.phone;
    if (!phone) {
      alert("No phone number available for this seller.");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    // If Pakistani number starts with 03, append 92
    const finalPhone = cleanPhone.startsWith('03') ? `92${cleanPhone.substring(1)}` : cleanPhone;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(`Hi, I'm interested in your listing: ${ad.title}`)}`, '_blank');
  };

  if (viewMode === 'list') {
    return (
      <Link 
        to={adUrl}
        className={`group flex flex-col sm:flex-row w-full min-h-[14rem] sm:h-56 bg-white transition-all duration-300 overflow-hidden border relative rounded-2xl ${isPremium ? 'border-[2px] border-amber-400 shadow-md' : 'border-gray-200 hover:shadow-lg hover:border-primary/50'}`}
        style={{ textDecoration: 'none' }}
      >
        {/* Image Section - Left side on desktop, top on mobile */}
        <div className="relative w-full sm:w-72 h-52 sm:h-full overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
          <LazyImage
            src={getOptimizedImageUrl(ad.images?.[0], 400)}
            alt={`${ad.title} in ${locationText || 'Pakistan'}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            fallbackSrc={PLACEHOLDER}
            onError={() => setImgError(true)}
            aspectRatio="16/9"
            width="400"
            height="225"
          />
          {imgError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-300">
              <PhotoIcon className="w-12 h-12 mb-2 opacity-20" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No Image Available</span>
            </div>
          )}
          {ad.isFeatured && (
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-lg flex items-center gap-1 uppercase tracking-widest">
              <StarSolid className="w-2.5 h-2.5" /> Featured
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[9px] font-black text-white uppercase tracking-widest">
            {locationText}
          </div>
          <button
            onClick={toggleFav}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md z-10 ${favorited ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'}`}
          >
             {favorited ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* Content Section - Right side */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-4 mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-primary/80">
              {categoryText}
            </span>
            <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap">
              {timeAgo(ad.createdAt)}
            </span>
          </div>
          
          <h3 className="font-black text-black text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {ad.title}
          </h3>

          <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-3 leading-relaxed">
            {ad.description || 'Verified listing on Elocanto.'}
          </p>

          {/* Badges - ONLY for featured ads in list view */}
          {ad.isFeatured && ad.badges && ad.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5 min-h-[20px] items-center">
              {ad.badges && ad.badges.map((badge, idx) => {
                const styles = getBadgeStyles(badge);
                if (!styles) return null;
                return (
                  <span 
                    key={idx} 
                    className={`${styles.bg} ${styles.text} ${styles.animate || ''} text-[7.5px] font-black px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1 uppercase tracking-widest transition-all duration-300`}
                  >
                    {styles.icon} {badge}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-100">
             <p className={`font-black text-xl tracking-tight ${isPremium ? 'text-amber-600' : 'text-gray-900'}`}>
               PKR {Number(ad.price).toLocaleString()}
             </p>
             <div className="flex items-center gap-3">
                {isPremium && (
                  <button onClick={handleWhatsApp} className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg shadow-md transition-all shadow-green-500/20" title="Contact via WhatsApp">
                    <WhatsAppIcon className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 overflow-hidden">
                     {ad.seller?.profilePhoto ? <img src={ad.seller.profilePhoto} className="w-full h-full object-cover" /> : 'S'}
                   </div>
                   <span className="text-xs font-bold text-gray-800 truncate max-w-[80px]">{ad.seller?.name || 'Seller'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 ml-2">
                   <EyeIcon className="w-3.5 h-3.5" />
                   <span>{ad.views || 0}</span>
                </div>
             </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={adUrl}
      className={`${cardBaseClasses} ${isPremium ? featuredStyles : simpleStyles}`}
      style={{ textDecoration: 'none' }}
    >
      {/* Image Section - Fixed Height to guarantee 'SAME' look */}
      <div className="relative w-full h-[180px] overflow-hidden bg-gray-50 flex items-center justify-center">
        <LazyImage
          src={getOptimizedImageUrl(ad.images?.[0], 400)}
          alt={`${ad.title} in ${locationText || 'Pakistan'}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          fallbackSrc={PLACEHOLDER}
          onError={() => setImgError(true)}
          aspectRatio="1/1"
          width="400"
          height="400"
        />
        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-300">
            <PhotoIcon className="w-16 h-16 mb-2 opacity-20" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No Image Available</span>
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {ad.isFeatured && (
            <div className="bg-amber-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-widest border border-white/20">
              <StarSolid className="w-3 h-3" /> Featured
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={toggleFav}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 z-10 ${
            favorited 
              ? 'bg-red-500 text-white shadow-lg' 
              : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'
          }`}
        >
          {favorited ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
        </button>

        {/* Location Badge */}
        <div className="absolute bottom-2.5 left-2.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-xl text-[9px] font-black text-white uppercase tracking-widest border border-white/10 z-10 max-w-[85%] truncate">
          {locationText}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 relative">
        {/* Badges Below Image - Alignment Lock (Fixed height container) */}
        <div className="flex flex-wrap gap-1 mb-2.5 min-h-[22px] items-center">
          {ad.badges && ad.badges.length > 0 ? ad.badges.map((badge, idx) => {
            const styles = getBadgeStyles(badge);
            // If it's already an optimized proxy URL, don't re-process
            if (typeof badge === 'string' && badge.includes('/images/') && !badge.startsWith('http')) return null;
            if (!styles) return null;
            return (
              <span 
                key={idx} 
                className={`${styles.bg} ${styles.text} ${styles.animate || ''} text-[7.5px] font-black px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1 uppercase tracking-widest transition-all duration-300`}
              >
                {styles.icon} {badge}
              </span>
            );
          }) : (
            // Spacer to maintain alignment when no badges are present
            <div className="h-full w-full"></div>
          )}
        </div>

        {/* Category - Fixed height */}
        <span className="text-[9px] font-bold text-[#f95e26] mb-1 uppercase tracking-widest line-clamp-1 h-3.5 block overflow-hidden">
          {categoryText}
        </span>

        {/* Title - Fixed height to 44px (exactly 2 lines of 14px text) */}
        <h3 className="font-extrabold text-black leading-[1.4] mb-4 line-clamp-2 h-11 text-[14px] group-hover:text-primary transition-colors overflow-hidden">
          {ad.title}
        </h3>

        {/* Price & Time */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <p className={`font-black text-xl tracking-tight ${isPremium ? 'text-amber-600' : 'text-gray-900'}`}>
              PKR {Number(ad.price).toLocaleString()}
            </p>
            {isPremium ? (
              <button 
                onClick={handleWhatsApp} 
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-all" 
                title="Contact via WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center justify-center h-8">
                <span className="text-[9px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                  {timeAgo(ad.createdAt)}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
               <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-200 overflow-hidden">
                  {ad.seller?.profilePhoto ? <img src={ad.seller.profilePhoto} className="w-full h-full object-cover" /> : 'A'}
               </div>
               <span className="text-[11px] font-bold text-gray-800 truncate max-w-[90px]">{ad.seller?.name || 'Seller'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
              <EyeIcon className="w-3.5 h-3.5" />
              <span>{ad.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Add Premium Animations
const style = document.createElement('style');
style.textContent = `
  @keyframes badge-glow-red {
    0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.4); transform: scale(1); }
    50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.7); transform: scale(1.02); }
  }
  @keyframes badge-glow-purple {
    0%, 100% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.4); transform: scale(1); }
    50% { box-shadow: 0 0 15px rgba(147, 51, 234, 0.7); transform: scale(1.02); }
  }
  .animate-pulse-red { animation: badge-glow-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .animate-pulse-purple { animation: badge-glow-purple 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

// Removed absolute city badge to prevent overlap
