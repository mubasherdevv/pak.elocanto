import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAds } from '../context/AdContext';
import AdCard from '../components/AdCard';
import { AdCardSkeleton, CategorySkeleton } from '../components/Skeleton';
import SeoContentSection from '../components/SeoContentSection';
import api from '../lib/api';
import { Helmet } from 'react-helmet-async';
import { usePageSeo } from '../hooks/usePageSeo';
import { cache } from '../utils/cache';
import { getOptimizedImageUrl } from '../utils/imageUtils';

const PLACEHOLDER = '/placeholder.png';

export default function HomePage() {
  const { featuredAds, latestAds, fetchFeaturedAds, fetchLatestAds, loading } = useAds();
  const [categories, setCategories] = useState(() => cache.get('categories') || []);
  const [cities, setCities] = useState(() => cache.get('cities') || []);
  const [areas, setAreas] = useState(() => cache.get('areas') || []);
  const [hotels, setHotels] = useState(() => cache.get('hotels') || []);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      // Speed up: don't show loading spinner if we have cached basic data
      const hasCache = categories.length > 0 && cities.length > 0;
      if (!hasCache) setPageLoading(true);

      try {
        await Promise.all([
          fetchFeaturedAds(),
          fetchLatestAds(),
          api.get('/categories').then(res => {
            setCategories(res.data);
            cache.set('categories', res.data);
          }),
          api.get('/cities?showOnHome=true').then(res => {
            setCities(res.data);
            cache.set('cities', res.data);
          }),
          api.get('/areas?showOnHome=true').then(res => {
            setAreas(res.data);
            cache.set('areas', res.data);
          }),
          api.get('/hotels?showOnHome=true').then(res => {
            setHotels(res.data);
            cache.set('hotels', res.data);
          })
        ]);
      } catch (err) {
        console.error('Initial data fetch failed:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadAllData();
  }, [fetchFeaturedAds, fetchLatestAds]);

  const trackedHomepageKey = useRef(null);

  useEffect(() => {
    if (featuredAds.length > 0 && trackedHomepageKey.current !== 'tracked') {
      trackedHomepageKey.current = 'tracked';
      const adIds = featuredAds.map(ad => ad._id);
      const viewerId = localStorage.getItem('ad_viewer_id') || `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!localStorage.getItem('ad_viewer_id')) {
        localStorage.setItem('ad_viewer_id', viewerId);
      }
      api.post('/views/track-bulk', { adIds, localStorageId: viewerId, page: 'homepage' }).catch(console.error);
    }
  }, [featuredAds]);

  const { seo } = usePageSeo('home');

  return (
    <div style={{ background: 'var(--white)', paddingBottom: 64 }}>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.metaDescription} />
        {seo.keywords && <meta name="keywords" content={seo.keywords} />}
        <meta property="og:title" content={seo.title} />
        <meta property="og:type" content="website" />
      </Helmet>
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        .scroll-container {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding: 10px 4px 24px;
          justify-content: flex-start;
        }

        .scroll-item-5 {
          scroll-snap-align: start;
          flex-shrink: 0;
          width: calc(20% - 20px);
          display: flex;
          align-items: stretch;
        }

        /* Desktop Grid Transformation */
        @media (min-width: 1024px) {
          .scroll-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            overflow-x: visible;
            gap: 24px;
            padding-bottom: 0;
          }
          .scroll-item-5 {
            width: 100%;
          }
        }
        @media (min-width: 1280px) {
          .scroll-container {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        @media (max-width: 1023px) {
          .scroll-item-5 { width: calc(33.333% - 16px); }
        }
        @media (max-width: 768px) {
          .scroll-item-5 { width: calc(50% - 12px); }
        }
        @media (max-width: 480px) {
          .scroll-item-5 { width: calc(75% - 10px); }
          .scroll-container { gap: 16px; }
        }

        .category-item {
          flex-shrink: 0 !important;
          width: 120px !important;
        }

        @media (max-width: 1200px) {
          .category-item { width: calc(25% - 18px); }
        }
        @media (max-width: 992px) {
          .category-item { width: calc(33.333% - 16px); }
        }
        @media (max-width: 768px) {
          .category-item { width: calc(25% - 12px); } /* 4 on tablet */
        }
        @media (max-width: 480px) {
          .category-item { width: calc(33.333% - 11px); } /* 3 on mobile */
        }

        /* Unified Browse Sections (Category, City, Area, Hotel) */
        .cat-grid {
          display: flex;
          overflow-x: auto;
          gap: 16px;
          padding: 8px 4px 24px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          justify-content: flex-start;
          width: 100%;
        }

        .cat-grid-card {
          flex-shrink: 0;
          width: 130px; /* Fixed width on mobile for scrolling */
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 20px 12px;
          background: white;
          border: 1.5px solid #f1f5f9;
          border-radius: 20px;
          text-decoration: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          scroll-snap-align: start;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .cat-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          transition: background 0.3s ease;
          position: relative;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .cat-icon-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
          transition: filter 0.3s ease;
        }

        .cat-name {
          font-size: 13px;
          font-weight: 800;
          color: #1e293b;
          text-align: center;
          line-height: 1.3;
          transition: color 0.25s ease;
        }

        .cat-count {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          background: #f1f5f9;
          padding: 3px 10px;
          border-radius: 999px;
        }

        /* Desktop Grid Transformation */
        @media (min-width: 640px) {
          .cat-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            overflow-x: visible;
            padding-bottom: 0;
            gap: 20px;
          }
          .cat-grid-card {
            width: auto;
            padding: 24px 12px 20px;
          }
          .cat-icon-wrap {
            width: 72px;
            height: 72px;
            font-size: 34px;
          }
        }

        @media (min-width: 768px) {
          .cat-grid { grid-template-columns: repeat(4, 1fr); }
        }

        @media (min-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(5, 1fr); gap: 24px; }
          .cat-grid-card:hover { 
            transform: translateY(-8px); 
            border-color: var(--primary);
            box-shadow: 0 15px 30px rgba(249, 94, 38, 0.12);
          }
          .cat-grid-card:hover .cat-name { color: var(--primary); }
        }

        @media (min-width: 1280px) {
          .cat-grid { grid-template-columns: repeat(6, 1fr); }
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee {
          display: flex;
          gap: 24px;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Hero Section */}
      <section style={{ padding: '80px 20px 40px', textAlign: 'center', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container-custom" style={{ maxWidth: 900 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(249, 94, 38, 0.08)', color: 'var(--primary)', padding: '6px 16px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}></div>
            Most Trusted Classifieds in Pakistan
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.1, marginBottom: 20 }}>
            {seo.title || (
              <>Buy, Sell & Discover <span style={{ color: 'var(--primary)' }}>Everything</span> in Pakistan</>
            )}
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: 'var(--gray-600)', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
            Elocanto is the most secure destination to buy, sell, and discover premium items from around the world. Browse thousands of verified listings in your city.
          </p>
        </div>
      </section>

      {/* Dynamic SEO Content */}
      <SeoContentSection />


      {/* ===== Browse by Category (Card Grid) ===== */}
      <section className="container-custom" style={{ marginBottom: 72, minHeight: 300 }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(249,94,38,0.08)', color: 'var(--primary)', padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}></div>
              All Categories
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.2, margin: 0 }}>
              Browse by Category
            </h2>
          </div>
          <Link
            to="/ads"
            style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}
          >
            View All Ads →
          </Link>
        </div>

        {/* Grid or Skeleton */}
        <div className="cat-grid hide-scroll">
          {categories.length > 0 ? (
            categories.map((cat, index) => (
              <Link
                key={cat._id}
                to={`/${cat.slug}`}
                className="cat-grid-card"
              >
                {/* Icon / Image */}
                <div className="cat-icon-wrap">
                  {cat.image ? (
                    <img
                      src={getOptimizedImageUrl(cat.image, 72)}
                      alt={cat.name}
                      width="72" height="72"
                      loading={index < 8 ? 'eager' : 'lazy'}
                      decoding="async"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER;
                      }}
                    />
                  ) : (
                    <span>{cat.icon || '📦'}</span>
                  )}
                </div>

                {/* Name */}
                <span className="cat-name">{cat.name}</span>

                {/* Ad count badge */}
                {cat.adCount !== undefined && (
                  <span className="cat-count">
                    {cat.adCount.toLocaleString()} {cat.adCount === 1 ? 'ad' : 'ads'}
                  </span>
                )}
              </Link>
            ))
          ) : (
            Array(10).fill(0).map((_, i) => <CategorySkeleton key={i} />)
          )}
        </div>
      </section>

      {/* ===== Browse by City ===== */}
      {cities.length > 0 && (
        <section className="container-custom" style={{ marginBottom: 72 }}>
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(249,94,38,0.08)', color: 'var(--primary)', padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}></div>
                Top Locations
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.2, margin: 0 }}>
                Browse by City
              </h2>
            </div>
          </div>

          <div className="cat-grid hide-scroll">
            {cities.map(city => (
              <Link
                key={city._id}
                to={`/cities/${city.slug || city.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="cat-grid-card"
              >
                {/* Icon / Image */}
                <div className="cat-icon-wrap" style={{
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: city.isPopular ? '2px solid var(--primary)' : '2px solid transparent',
                  background: '#f8fafc'
                }}>
                  {city.image ? (
                    <img
                      src={getOptimizedImageUrl(city.image, 120)}
                      alt={city.name}
                      width="120" height="120"
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER;
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>{city.isPopular ? '🌟' : '📍'}</span>
                  )}
                </div>

                {/* Name */}
                <span className="cat-name">{city.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Browse by Areas ===== */}
      {areas.length > 0 && (
        <section className="container-custom" style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.08)', color: '#2563eb', padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }}></div>
                Explore Areas
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.2, margin: 0 }}>
                Browse by Area
              </h2>
            </div>
          </div>

          <div className="cat-grid hide-scroll">
            {areas.map(area => (
              <Link
                key={area._id}
                to={`/cities/${area.city?.slug || 'unknown'}/areas/${area.slug}`}
                className="cat-grid-card"
              >
                <div className="cat-icon-wrap" style={{ background: '#f8fafc' }}>
                  {area.image ? (
                    <img
                      src={getOptimizedImageUrl(area.image, 120)}
                      alt={area.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER;
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>📍</span>
                  )}
                </div>
                <span className="cat-name">{area.name}</span>
                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{area.city?.name || ''}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Browse by Hotels ===== */}
      {hotels.length > 0 && (
        <section className="container-custom" style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.08)', color: '#f97316', padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316' }}></div>
                Find Hotels
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.2, margin: 0 }}>
                Browse by Hotel
              </h2>
            </div>
          </div>

          <div className="cat-grid hide-scroll">
            {hotels.map(hotel => (
              <Link
                key={hotel._id}
                to={`/cities/${hotel.city?.slug || 'unknown'}/hotels/${hotel.slug}`}
                className="cat-grid-card"
              >
                <div className="cat-icon-wrap" style={{ background: '#f8fafc' }}>
                  {hotel.image ? (
                    <img
                      src={getOptimizedImageUrl(hotel.image, 120)}
                      alt={hotel.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER;
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>🏨</span>
                  )}
                </div>
                <span className="cat-name">{hotel.name}</span>
                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{hotel.city?.name || ''}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Ads */}
      {(pageLoading || featuredAds.length > 0) && (
        <section className="container-custom" style={{ marginBottom: 64 }}>
          <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 32, padding: 'clamp(24px, 4vw, 32px)', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#d97706', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#d97706' }}></div>
                  Premium Selection
                </div>
                <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: '#1e293b', margin: 0 }}>Featured Ads</h2>
              </div>
              <Link to="/ads?listingType=featured&page=1" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>VIEW ALL &rarr;</Link>
            </div>

            <div className="hide-scroll scroll-container">
              {!pageLoading && featuredAds.length > 0 ? (
                featuredAds.slice(0, 10).map(ad => (
                  <div key={ad._id} className="scroll-item-5">
                    <AdCard ad={ad} />
                  </div>
                ))
              ) : (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="scroll-item-5">
                    <AdCardSkeleton />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Latest Ads */}
      <section className="container-custom" style={{ marginBottom: 64 }}>
        <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 32, padding: 'clamp(24px, 4vw, 32px)', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)' }}></div>
                Verified Listings
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: '#1e293b', margin: 0 }}>Latest Recommendations</h2>
            </div>
            <Link to="/ads?listingType=simple&page=1" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>EXPLORE ALL &rarr;</Link>
          </div>

          <div className="hide-scroll scroll-container">
            {!pageLoading && latestAds.length > 0 ? (
              latestAds.slice(0, 10).map(ad => (
                <div key={ad._id} className="scroll-item-5">
                  <AdCard ad={ad} />
                </div>
              ))
            ) : (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="scroll-item-5">
                  <AdCardSkeleton />
                </div>
              ))
            )}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="container-custom">
        <div style={{ background: 'var(--dark)', borderRadius: 32, padding: 'clamp(32px, 6vw, 48px) clamp(24px, 6vw, 56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#facc15', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
              <span style={{ fontSize: 16 }}>🌟</span> PREMIUM OPPORTUNITY
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 900, color: 'white', marginBottom: 16 }}>Earn with Elocanto</h2>
            <p style={{ color: 'var(--gray-400)', fontSize: 16, lineHeight: 1.6, maxWidth: 440 }}>
              Are you a seller or an agency? Post your ad for free on the world's #1 network and start getting quality leads today.
            </p>
          </div>
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <Link to="/post-ad" style={{ background: 'var(--success)', color: 'white', padding: '16px 32px', borderRadius: 16, fontSize: 16, fontWeight: 800, textDecoration: 'none', display: 'inline-block', boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)' }}>
              Post Free Ad Now
            </Link>
            <div style={{ display: 'flex', gap: 24, color: 'var(--gray-400)', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#facc15' }}>⚡</span> INSTANT LIVE</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>📈 HIGH TRAFFIC</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
