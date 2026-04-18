import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPinIcon, CalendarIcon, EyeIcon, PhoneIcon,
  ChatBubbleLeftRightIcon, HeartIcon, ShareIcon,
  ExclamationCircleIcon, ChevronRightIcon,
  FlagIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import api from '../lib/api';
import ImageCarousel from '../components/ImageCarousel';
import AdCard from '../components/AdCard';
import { useAuth } from '../context/AuthContext';
import { generateAdSlug, extractIdFromSlug } from '../utils/urlUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { linkifyText } from '../utils/textUtils';
import NotFoundPage from './NotFoundPage';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../context/SettingsContext';
import { usePageSeo } from '../hooks/usePageSeo';

export default function AdDetailPage() {
  const params = useParams();
  const slug = params.slug || params.subSubcatSlug || params.subCategorySlug || params.categorySlug;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [recommendedAds, setRecommendedAds] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState({ reason: '', message: '' });
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        const id = extractIdFromSlug(slug);
        const { data } = await api.get(`/ads/${id}`);
        setAd(data);


        // Fetch and mix recommended ads
        Promise.all([
          api.get('/ads/latest?limit=10'),
          api.get('/ads/featured?limit=10')
        ]).then(([latestRes, featuredRes]) => {
          const mixed = [...latestRes.data, ...featuredRes.data]
            .filter((v, i, a) => a.findIndex(t => t._id === v._id) === i) // Unique
            .sort(() => Math.random() - 0.5); // Shuffle
          setRecommendedAds(mixed);
        }).catch(console.error);

        const viewerId = localStorage.getItem('ad_viewer_id') || `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (!localStorage.getItem('ad_viewer_id')) {
          localStorage.setItem('ad_viewer_id', viewerId);
        }
        api.post('/views/track', { adId: data._id, page: 'detail', localStorageId: viewerId }).catch(console.error);

        const correctSlug = generateAdSlug(data);
        if (slug !== correctSlug) {
          navigate(`/ads/${correctSlug}`, { replace: true });
        }
        if (user) {
          const { data: favData } = await api.get(`/favorites/check/${data._id}`);
          setFavorited(favData.favorited);
        }
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ad details');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchAd();
    window.scrollTo(0, 0);
  }, [slug, user, navigate]);
  
  // Define SEO context for consistency
  const placeholderName = ad?.title || '';
  const { seo } = usePageSeo('ad', ad?._id, { 
    title: ad ? `${ad.title} | Elocanto` : 'Loading Ad...',
    description: ad ? ad.description.substring(0, 160) : 'View ad details on Elocanto.'
  });

  // Handle {name} placeholder for consistency
  const displayTitle = (seo?.title || (ad ? `${ad.title} | Elocanto` : 'Loading Ad...')).replace(/{name}/gi, placeholderName);
  const displayDesc = (seo?.metaDescription || (ad ? ad.description.substring(0, 160) : 'View ad details on Elocanto.')).replace(/{name}/gi, placeholderName);

  const toggleFav = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await api.post(`/favorites/${ad._id}`);
      setFavorited(data.favorited);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = () => {
    if (!user) return navigate('/login');
    if (user._id === ad.seller._id) return navigate('/dashboard?tab=ads');
    navigate(`/messages?sellerId=${ad.seller._id}&adId=${ad._id}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: ad.title, url: window.location.href }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!reportData.reason) return alert('Please select a reason for reporting.');

    try {
      setReporting(true);
      await api.post('/reports', {
        adId: ad._id,
        reason: reportData.reason,
        message: reportData.message
      });
      alert('Thank you! Your report has been submitted and will be reviewed by our team.');
      setIsReportOpen(false);
      setReportData({ reason: '', message: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setReporting(false);
    }
  };

  const handleWhatsApp = () => {
    const phone = ad.phone || ad.seller.phone;
    if (!phone) return alert('Phone number not available');
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('92') ? cleanPhone : cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone;
    const message = encodeURIComponent(`Salam, I am interested in your ad: ${ad.title}\n\nCheck it out here: ${window.location.href}`);
    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
  };

  const HorizontalAdsSection = ({ title, ads }) => {
    if (!ads || ads.length === 0) return null;
    return (
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingLeft: 4 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>{title}</h3>
          <Link to="/ads" style={{ color: '#f95e26', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', textDecoration: 'none' }}>See All</Link>
        </div>
        <div
          className="flex overflow-x-auto gap-4 pb-4 hide-scroll"
          style={{
            paddingLeft: 4,
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {ads.map(item => (
            <div key={item._id} style={{ minWidth: 200, maxWidth: 200, scrollSnapAlign: 'start' }}>
              <AdCard ad={item} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="page-wrapper flex-center"><div className="spinner"></div></div>;
  if (error || !ad) return <NotFoundPage />;

  const MobileLayout = () => (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 90 }}>
      {/* 1. Image Section */}
      <div style={{ position: 'relative' }}>
        <ImageCarousel images={ad.images} title={ad.title} fullWidth={true} />

        {/* Top Overlay Buttons */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <ChevronRightIcon style={{ width: 24, transform: 'rotate(180deg)' }} />
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleShare} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
              <ShareIcon style={{ width: 20 }} />
            </button>
            <button onClick={toggleFav} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
              {favorited ? <HeartSolid style={{ width: 20, color: '#ef4444' }} /> : <HeartIcon style={{ width: 20 }} />}
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 2. Price & Title Section */}
        <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>PKR {ad.price?.toLocaleString()}</h1>
          <h2 style={{ fontSize: 16, color: '#475569', marginTop: 8, lineHeight: 1.4, fontWeight: 500 }}>{ad.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94a3b8', fontSize: 12, marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPinIcon style={{ width: 14 }} /> 
              <Link to={`/cities/${ad.city.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: 'inherit', textDecoration: 'none' }}>{ad.city}</Link>
              {ad.area && (
                <>
                  <span style={{ mx: 1 }}>•</span>
                  <Link to={`/cities/${ad.city.toLowerCase().replace(/\s+/g, '-')}/areas/${ad.area.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{ad.area.name}</Link>
                </>
              )}
              {ad.hotel && (
                <>
                  <span style={{ mx: 1 }}>•</span>
                  <Link to={`/cities/${ad.city.toLowerCase().replace(/\s+/g, '-')}/hotels/${ad.hotel.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{ad.hotel.name}</Link>
                </>
              )}
            </div>
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1' }}></div>
            <div>{new Date(ad.createdAt).toLocaleDateString()}</div>
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1' }}></div>
            <div>{ad.views} Views</div>
          </div>
        </div>

        {/* 4. Content Cards */}
        <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Category</p>
              <p style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, marginTop: 2 }}>
                <Link to={`/${ad.category.slug}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{ad.category.name}</Link>
                {ad.subcategory && (
                  <>
                    <span style={{ margin: '0 4px', color: '#94a3b8' }}>/</span>
                    <Link to={`/${ad.category.slug}/${ad.subcategory.slug}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{ad.subcategory.name}</Link>
                  </>
                )}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Location</p>
              <p style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, marginTop: 2 }}>
                <Link to={`/cities/${ad.city.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: 'inherit', textDecoration: 'none' }}>{ad.city}</Link>
                {ad.area && (
                  <>
                    <span style={{ margin: '0 4px', color: '#94a3b8' }}>•</span>
                    <Link to={`/cities/${ad.city.toLowerCase().replace(/\s+/g, '-')}/areas/${ad.area.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{ad.area.name}</Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {linkifyText(ad.description, ad.seller?.isAdmin)}
          </p>
          {ad.website && (
            <div style={{ marginTop: 16, pt: 16, borderTop: '1px solid #f1f5f9' }}>
              <a 
                href={ad.website} 
                target="_blank" 
                rel={ad.seller?.isAdmin ? "nofollow noopener noreferrer" : "ugc nofollow noopener noreferrer"}
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3e6fe1', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}
              >
                <ShareIcon style={{ width: 16 }} /> Visit User Website
              </a>
            </div>
          )}
        </div>

        {/* 5. Seller Section */}
        <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 8px 30px rgba(0,0,0,0.05)', marginBottom: 16, border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              {ad.seller?.profilePhoto ? (
                <img src={getOptimizedImageUrl(ad.seller.profilePhoto, 120)} alt={ad.seller.name} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              ) : null}
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', display: ad.seller?.profilePhoto ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900 }}>{ad.seller?.name?.[0] || 'U'}</div>

              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, background: '#10b981', border: '2px solid white', borderRadius: '50%' }}></div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h4 style={{ fontWeight: 800, fontSize: 17, color: '#0f172a' }}>{ad.seller.name}</h4>
                {/* <span style={{ background: '#dcfce7', color: '#166534', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>Trusted Seller</span> */}
              </div>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Member since {new Date(ad.seller.createdAt).getFullYear()}</p>
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button 
              onClick={handleWhatsApp} 
              style={{ flex: 1, height: 44, borderRadius: 12, background: '#25D366', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 18, fill: 'currentColor' }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              WhatsApp
            </button>
            <button onClick={() => setShowPhone(!showPhone)} style={{ flex: 1, height: 44, borderRadius: 12, background: '#0f172a', border: 'none', color: 'white', fontWeight: 700, fontSize: 14 }}>
              {showPhone ? ad.phone || ad.seller.phone : 'Show Phone'}
            </button>
          </div>
        </div>


        {/* Safety Tips Accordion */}
        <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 24 }}>
          <button onClick={() => setIsSafetyOpen(!isSafetyOpen)} style={{ width: '100%', padding: '20px', border: 'none', background: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ExclamationCircleIcon style={{ width: 20, color: '#64748b' }} />
              <span style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>Safety Tips for Buyers</span>
            </div>
            <ChevronRightIcon style={{ width: 18, color: '#94a3b8', transform: isSafetyOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {isSafetyOpen && (
            <div style={{ padding: '0 20px 20px 20px', fontSize: 13, color: '#475569' }}>
              <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li>• Meet in a safe public place</li>
                <li>• Inspect the item thoroughly before paying</li>
                <li>• Never pay in advance if you're unsure</li>
                <li>• Pay only after collecting item</li>
              </ul>
            </div>
          )}
        </div>

        <HorizontalAdsSection title="Recommended Ads" ads={recommendedAds} />
      </div>

      {/* 3. Sticky Bottom Actions */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f1f5f9', padding: '10px 16px', display: 'flex', gap: 12, zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={handleWhatsApp} 
          style={{ flex: 1, height: 48, borderRadius: 14, background: '#25D366', border: 'none', color: 'white', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 20, fill: 'currentColor' }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          WhatsApp
        </button>
        <button onClick={() => setShowPhone(!showPhone)} style={{ flex: 1, height: 48, borderRadius: 14, background: '#0f172a', border: 'none', color: 'white', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <PhoneIcon style={{ width: 20 }} /> {showPhone ? ad.phone || ad.seller.phone : 'Call'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper" style={{ background: isMobile ? '#f8fafc' : '#f7f8fa' }}>
      <Helmet>
        <title>{displayTitle}</title>
        <meta name="description" content={displayDesc} />
        {seo.keywords && <meta name="keywords" content={seo.keywords.replace(/{name}/gi, placeholderName)} />}
        
        {/* OpenGraph Enhanced Previews */}
        <meta property="og:title" content={`${ad.title} - PKR ${ad.price?.toLocaleString()} in ${ad.city} | Elocanto`} />
        <meta property="og:description" content={`Check out this ${ad.title} for PKR ${ad.price?.toLocaleString()} in ${ad.city}. ${ad.description.substring(0, 100)}...`} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />
        {ad.images && ad.images[0] && <meta property="og:image" content={ad.images[0]} />}
        
        {/* Schema.org Rich Snippet for Google Search */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": ad.title,
            "image": ad.images,
            "description": ad.description,
            "brand": {
              "@type": "Brand",
              "name": ad.brand || "Generic"
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "PKR",
              "price": ad.price,
              "availability": "https://schema.org/InStock",
              "itemCondition": ad.condition === 'new' ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"
            },
            "seller": {
              "@type": "Person",
              "name": ad.seller?.name
            }
          })}
        </script>
      </Helmet>

      {isMobile ? (
        <MobileLayout />
      ) : (
        <div className="container-custom py-8">
          {/* Default Desktop Layout */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <ChevronRightIcon style={{ width: 12, height: 12 }} />
            <Link to="/ads" style={{ color: 'inherit', textDecoration: 'none' }}>Ads</Link>
            <ChevronRightIcon style={{ width: 12, height: 12 }} />
            <Link to={`/${ad.category.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{ad.category.name}</Link>
            {ad.subcategory && (
              <>
                <ChevronRightIcon style={{ width: 12, height: 12 }} />
                <Link to={`/${ad.category.slug}/${ad.subcategory.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{ad.subcategory.name}</Link>
              </>
            )}
            <ChevronRightIcon style={{ width: 12, height: 12 }} />
            <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{ad.title}</span>
          </nav>

          <div className="ad-detail-layout grid grid-cols-[1fr_340px] gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm overflow-hidden text-center">
                <ImageCarousel images={ad.images} title={ad.title} />
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-black text-gray-900">PKR {ad.price?.toLocaleString()}</h1>
                    <h2 className="text-xl text-gray-500 mt-2 font-medium">{ad.title}</h2>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={toggleFav} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      {favorited ? <HeartSolid style={{ width: 24, color: '#ef4444' }} /> : <HeartIcon style={{ width: 24 }} />}
                    </button>
                    <button onClick={handleShare} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <ShareIcon style={{ width: 22 }} />
                    </button>
                    <button onClick={() => setIsReportOpen(true)} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors group" title="Report this ad">
                      <FlagIcon className="w-5 text-gray-500 group-hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-8 pt-8 border-t border-gray-50 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <MapPinIcon className="w-5" /> 
                    <Link to={`/cities/${ad.city.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary transition-colors">{ad.city}</Link>
                    {ad.area && (
                      <>
                        <span>•</span>
                        <Link to={`/cities/${ad.city.toLowerCase().replace(/\s+/g, '-')}/areas/${ad.area.slug}`} className="hover:text-primary transition-colors">{ad.area.name}</Link>
                      </>
                    )}
                    {ad.hotel && (
                      <>
                        <span>•</span>
                        <Link to={`/cities/${ad.city.toLowerCase().replace(/\s+/g, '-')}/hotels/${ad.hotel.slug}`} className="hover:text-primary transition-colors">{ad.hotel.name}</Link>
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-2"><CalendarIcon className="w-5" /> {new Date(ad.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-2"><EyeIcon className="w-5" /> {ad.views} Views</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black mb-4">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{linkifyText(ad.description, ad.seller?.isAdmin)}</p>
                {ad.website && (
                  <div className="mt-6 pt-6 border-t border-gray-50">
                    <a 
                      href={ad.website} 
                      target="_blank" 
                      rel={ad.seller?.isAdmin ? "nofollow noopener noreferrer" : "ugc nofollow noopener noreferrer"}
                      className="inline-flex items-center gap-2 text-primary font-black hover:underline"
                    >
                      <ShareIcon className="w-5" /> Visit Ad Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                  {ad.seller?.profilePhoto ? (
                    <img src={getOptimizedImageUrl(ad.seller.profilePhoto, 120)} alt={ad.seller.name} className="w-16 h-16 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-black" style={{ display: ad.seller?.profilePhoto ? 'none' : 'flex' }}>{ad.seller?.name?.[0] || 'U'}</div>
                  <Link to={`/profile/${ad.seller._id}`} className="block hover:opacity-80 transition-opacity">
                    <h4 className="font-black text-lg text-gray-900">{ad.seller.name}</h4>
                    <p className="text-sm text-gray-500">Member since {new Date(ad.seller.createdAt).getFullYear()}</p>
                  </Link>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={handleWhatsApp} 
                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-black text-white hover:scale-[1.02] transition-all shadow-lg"
                    style={{ background: '#25D366' }}
                  >
                    <svg viewBox="0 0 24 24" style={{ width: 22, fill: 'currentColor' }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    WhatsApp Seller
                  </button>
                  <button onClick={() => setShowPhone(!showPhone)} className="w-full h-12 rounded-xl border-2 border-gray-900 font-bold flex items-center justify-center gap-2 hover:bg-gray-50">
                    <PhoneIcon className="w-5" />
                    {showPhone ? ad.phone || ad.seller.phone : 'Show Phone Number'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h4 className="font-black mb-4">Safety Tips</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2"><span>•</span> Meet in public</li>
                  <li className="flex gap-2"><span>•</span> Check item first</li>
                  <li className="flex gap-2"><span>•</span> Pay after collect</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 space-y-12">
            <HorizontalAdsSection title="Recommended Ads" ads={recommendedAds} />
          </div>
        </div>
      )}
      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-fade-in shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Report this Ad</h3>
              <button onClick={() => setIsReportOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reason for report</label>
                <select 
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-red-500 focus:outline-none bg-gray-50/50 font-bold"
                  value={reportData.reason}
                  onChange={e => setReportData({...reportData, reason: e.target.value})}
                >
                  <option value="">Select a reason</option>
                  <option value="Duplicate ad">Duplicate ad</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Copyright">Copyright Violation</option>
                  <option value="Spam">Spam</option>
                  <option value="Fraudulent">Fraudulent / Scam</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Message (Optional)</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-50 focus:border-red-500 focus:outline-none bg-gray-50/50 min-h-[100px] text-sm"
                  placeholder="Tell us more details..."
                  value={reportData.message}
                  onChange={e => setReportData({...reportData, message: e.target.value})}
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={reporting}
                className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
