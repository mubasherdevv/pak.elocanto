import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { useAds } from '../context/AdContext';
import AdCard from '../components/AdCard';
import api from '../lib/api';
import { FunnelIcon, ArrowsUpDownIcon, XMarkIcon, ShieldCheckIcon, AdjustmentsHorizontalIcon, ChevronDownIcon, EyeIcon, MapPinIcon, MapIcon, BuildingOffice2Icon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { generateAdSlug } from '../utils/urlUtils';
import NotFoundPage from './NotFoundPage';
import { Helmet } from 'react-helmet-async';
import { usePageSeo } from '../hooks/usePageSeo';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import HowItWorks from '../components/HowItWorks';
import { getInitialData } from '../utils/ssr';

// Simple global cache for static-ish data to avoid redundant per-page fetches
const initialData = getInitialData();
const pageCache = {
  categories: initialData?.categories || null,
  cities: initialData?.cities || null,
};



export default function AdsListingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categorySlug, subCategorySlug, subSubcatSlug, citySlug, areaSlug, hotelSlug } = useParams();
  const { ads, loading, fetchAds, totalPages, totalCount, currentPage, settings } = useAds();
  const initialData = getInitialData();
  const isFirstRender = useRef(true);

  const [categories, setCategories] = useState(initialData?.categories || []);
  const [cities, setCities] = useState(initialData?.cities || []);
  const [isLarge, setIsLarge] = useState(window.innerWidth >= 1024);
  const [notFound, setNotFound] = useState(false);
  const [dataLoading, setDataLoading] = useState(!initialData?.categories);

  // City/Area/Hotel hub data
  const [cityInfo, setCityInfo] = useState(initialData?.city || null);

  const [cityAreas, setCityAreas] = useState([]);
  const [cityHotels, setCityHotels] = useState([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);

  const isHotelsPage = location.pathname.includes('/hotels') && !hotelSlug;

  // Parse remaining query params
  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get('keyword') || searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const sort = searchParams.get('sort') || '';
  const listingType = searchParams.get('listingType') || '';
  const priceMin = searchParams.get('priceMin') || '';
  const priceMax = searchParams.get('priceMax') || '';
  const tags = searchParams.get('tags') || '';

  const [showFilters, setShowFilters] = useState(false);
  const [featuredAds, setFeaturedAds] = useState([]);

  // Category hierarchy resolution
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [activeSubSub, setActiveSubSub] = useState(null);

  // Breadcrumbs builder
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Home', path: '/' }]);

  // Expandable city filter state
  const [expandedCity, setExpandedCity] = useState(null);
  const [expandedSub, setExpandedSub] = useState({}); // { cityId_areas: bool, cityId_hotels: bool }

  const [viewMode, setViewMode] = useState(() => localStorage.getItem('adsViewMode') || 'grid');

  useEffect(() => {
    localStorage.setItem('adsViewMode', viewMode);
  }, [viewMode]);

  const [cityFilterAreas, setCityFilterAreas] = useState({});
  const [cityFilterHotels, setCityFilterHotels] = useState({});

  // City Hub Expansion states
  const [isAreasExpanded, setIsAreasExpanded] = useState(false);
  const [isHotelsExpanded, setIsHotelsExpanded] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');

  // Fetch areas & hotels when a city is expanded in the filter
  useEffect(() => {
    if (!expandedCity) return;
    const city = cities.find(c => c._id === expandedCity);
    if (!city?.slug) return;
    // Only fetch if not already cached
    if (cityFilterAreas[expandedCity] && cityFilterHotels[expandedCity]) return;

    Promise.all([
      api.get(`/areas?city=${city.slug}`).catch(() => ({ data: [] })),
      api.get(`/hotels?city=${city.slug}`).catch(() => ({ data: [] })),
    ]).then(([areasRes, hotelsRes]) => {
      setCityFilterAreas(prev => ({ ...prev, [expandedCity]: areasRes.data }));
      setCityFilterHotels(prev => ({ ...prev, [expandedCity]: hotelsRes.data }));
    });
  }, [expandedCity, cities]);

  // Auto-expand the current city in the filter when on a city route
  useEffect(() => {
    if (citySlug && cities.length > 0) {
      const currentCity = cities.find(c => c.slug === citySlug);
      if (currentCity) setExpandedCity(currentCity._id);
    }
  }, [citySlug, cities]);


  // Buffer state for deferring applies
  const [tempFilters, setTempFilters] = useState({
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    city: searchParams.get('city') || '',
  });

  useEffect(() => {
    setTempFilters({
      priceMin: searchParams.get('priceMin') || '',
      priceMax: searchParams.get('priceMax') || '',
      category: searchParams.get('category') || '',
      subcategory: searchParams.get('subcategory') || '',
      city: searchParams.get('city') || '',
    });
  }, [location.search]);

  const handleClearFilters = () => {
    setTempFilters({ priceMin: '', priceMax: '', category: '', subcategory: '', city: '' });
    navigate(window.location.pathname, { replace: true });
    setShowFilters(false);
  };

  const applyFiltersToUrl = (filters) => {
    const params = new URLSearchParams();
    if (filters.priceMin) params.set('priceMin', filters.priceMin);
    if (filters.priceMax) params.set('priceMax', filters.priceMax);
    if (filters.category) params.set('category', filters.category);
    if (filters.subcategory) params.set('subcategory', filters.subcategory);
    if (filters.city) params.set('city', filters.city);
    params.set('page', '1');
    navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
  };


  useEffect(() => {
    // Build shared fetch params
    const baseParams = {
      keyword,
      category: categorySlug,
      subcategory: subCategorySlug,
      subSubCategory: subSubcatSlug,
      city: citySlug || city,
      sort,
      priceMin,
      priceMax,
      tags,
    };

    if (listingType) {
      baseParams.adType = listingType;
      baseParams.listingType = listingType;
    }
    if (areaSlug) baseParams.area = areaSlug;
    if (hotelSlug) baseParams.hotel = hotelSlug;
    if (isHotelsPage && citySlug) baseParams.hotelsInCity = citySlug;

    if (isFirstRender.current && initialData?.ads) {
      isFirstRender.current = false;
    } else {
      // Trigger Initial Fetch (Reset)
      fetchAds({ ...baseParams, page: 1, pageSize: 15 }, false);
    }



    const loadData = async () => {
      try {
        if (!pageCache.categories || !pageCache.cities) {
          setDataLoading(true);
        } else {
          setCategories(pageCache.categories);
          setCities(pageCache.cities);
        }
        setNotFound(false); // Reset on every load

        const galleryLimit = settings?.featuredAdsLimit || 10;

        const essentialPromises = [];
        if (!pageCache.categories) essentialPromises.push(api.get('/categories'));
        if (!pageCache.cities) essentialPromises.push(api.get('/cities'));
        if (citySlug) essentialPromises.push(api.get(`/cities/slug/${citySlug}?_t=${Date.now()}`).catch(() => null));

        const essentialResults = await Promise.all(essentialPromises);

        let cityInfoRes = null;
        let index = 0;
        if (!pageCache.categories) {
          const catData = essentialResults[index++]?.data;
          if (catData) {
            setCategories(catData);
            pageCache.categories = catData;
          }
        }
        if (!pageCache.cities) {
          const cityData = essentialResults[index++]?.data;
          if (cityData) {
            setCities(cityData);
            pageCache.cities = cityData;
          }
        }
        if (citySlug) cityInfoRes = essentialResults[index++];

        if (citySlug) {
          // Validate City
          if (cityInfoRes?.data) {
            setCityInfo(cityInfoRes.data);
            setBreadcrumbs([{ name: 'Home', path: '/' }, { name: cityInfoRes.data.name, path: `/cities/${citySlug}` }]);
          } else {
            setNotFound(true);
            setDataLoading(false);
            return;
          }
        }

        if (pageCache.categories) {
          const catData = pageCache.categories;
          if (!citySlug) {
            let foundCat = categorySlug ? catData.find(c => c.slug === categorySlug) : null;
            let foundSub = null;
            let foundSubSub = null;
            let bc = [{ name: 'Home', path: '/' }];

            if (categorySlug && !foundCat) {
              setNotFound(true);
              setDataLoading(false);
              return;
            }

            if (foundCat) {
              bc.push({ name: foundCat.name, path: `/${foundCat.slug}` });
              if (subCategorySlug) {
                foundSub = foundCat.subcategories?.find(s => s.slug === subCategorySlug);
                if (!foundSub) {
                  setNotFound(true);
                  setDataLoading(false);
                  return;
                }
                bc.push({ name: foundSub.name, path: `/${foundCat.slug}/${foundSub.slug}` });
                if (subSubcatSlug) {
                  foundSubSub = foundSub.subSubCategories?.find(ss => ss.slug === subSubcatSlug);
                  if (!foundSubSub) {
                    setNotFound(true);
                    setDataLoading(false);
                    return;
                  }
                  bc.push({ name: foundSubSub.name, path: `/${foundCat.slug}/${foundSub.slug}/${foundSubSub.slug}` });
                }
              }
            } else if (!categorySlug) {
              bc.push({ name: 'All Ads', path: '/ads' });
            }

            setNotFound(false);
            setActiveCategory(foundCat);
            setActiveSub(foundSub);
            setActiveSubSub(foundSubSub);
            setBreadcrumbs(bc);
          }
        }

        setDataLoading(false);

        if (citySlug) setIsLocationsLoading(true);

        api.get(`/ads/featured?limit=${galleryLimit}&_t=${Date.now()}`).then(res => {
          if (res?.data) setFeaturedAds(res.data);
        }).catch(console.error);

        if (citySlug) {
          Promise.all([
            api.get(`/areas?city=${citySlug}`).catch(() => ({ data: [] })),
            api.get(`/hotels?city=${citySlug}`).catch(() => ({ data: [] })),
          ]).then(([areasRes, hotelsRes]) => {
            if (areasRes?.data) setCityAreas(areasRes.data);
            if (hotelsRes?.data) setCityHotels(hotelsRes.data);
            setIsLocationsLoading(false);

            if (areaSlug || hotelSlug || isHotelsPage) {
              setBreadcrumbs(prev => {
                const newBc = [...prev];
                let foundSpecific = false;

                if (areaSlug) {
                  const area = areasRes.data.find(a => a.slug === areaSlug);
                  if (area) {
                    const expectedCitySlug = area.customCitySlug || area.city?.slug;
                    if (citySlug.toLowerCase() !== expectedCitySlug?.toLowerCase()) {
                      setNotFound(true);
                      return newBc;
                    }
                    foundSpecific = true;
                    const realCitySlug = cityInfo?.slug || citySlug;
                    newBc.push({ name: area.name, path: `/cities/${realCitySlug}/areas/${areaSlug}` });
                  } else {
                    setNotFound(true);
                  }
                }
                if (isHotelsPage || hotelSlug) {
                  const realCitySlug = cityInfo?.slug || citySlug;
                  if (!newBc.find(b => b.name === 'Hotels')) {
                    newBc.push({ name: 'Hotels', path: `/cities/${realCitySlug}/hotels` });
                  }
                  if (hotelSlug) {
                    const hotel = hotelsRes.data.find(h => h.slug === hotelSlug);
                    if (hotel) {
                      const expectedCitySlug = hotel.customCitySlug || hotel.city?.slug;
                      if (citySlug.toLowerCase() !== expectedCitySlug?.toLowerCase()) {
                        setNotFound(true);
                        return newBc;
                      }
                      foundSpecific = true;
                      const realCitySlug = cityInfo?.slug || citySlug;
                      newBc.push({ name: hotel.name, path: `/cities/${realCitySlug}/hotels/${hotelSlug}` });
                    } else {
                      setNotFound(true);
                    }
                  } else if (isHotelsPage) {
                    foundSpecific = true;
                  }
                }
                return newBc;
              });
            }
          }).catch(() => {
            setIsLocationsLoading(false);
            // If the areas/hotels fetch fails completely and we are on a specific area/hotel page, 404
            if (areaSlug || hotelSlug) setNotFound(true);
          });
        }

      } catch (err) {
        console.error('Failed to load page data:', err);
        setDataLoading(false);
      }
    };
    loadData();
  }, [fetchAds, location.search, keyword, categorySlug, subCategorySlug, subSubcatSlug, citySlug, areaSlug, hotelSlug, city, sort, listingType, settings, priceMin, priceMax, tags]);

  // Infinite Scroll Hook
  const sentinelRef = useRef(null);
  const [infiniteLoading, setInfiniteLoading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !infiniteLoading && currentPage < totalPages) {
        setInfiniteLoading(true);

        const nextParams = {
          keyword,
          category: categorySlug,
          subcategory: subCategorySlug,
          subSubCategory: subSubcatSlug,
          city: citySlug || city,
          sort,
          page: currentPage + 1,
          pageSize: 15,
          priceMin,
          priceMax,
          tags,
        };
        if (listingType) {
          nextParams.adType = listingType;
          nextParams.listingType = listingType;
        }
        if (areaSlug) nextParams.area = areaSlug;
        if (hotelSlug) nextParams.hotel = hotelSlug;
        if (isHotelsPage && citySlug) nextParams.hotelsInCity = citySlug;

        fetchAds(nextParams, true).finally(() => setInfiniteLoading(false));
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) observer.unobserve(sentinelRef.current);
    };
  }, [loading, infiniteLoading, currentPage, totalPages, fetchAds, location.search]);

  // SEO Logic
  const getSeoContext = () => {
    if (hotelSlug) {
      const hotel = cityHotels.find(h => h.slug === hotelSlug);
      return {
        type: 'hotel',
        id: hotel?._id,
        placeholderName: hotel?.name || 'Hotel',
        fallbackTitle: hotel ? `${hotel.name} in ${cityInfo?.name || ''}` : 'Hotel Listings'
      };
    }
    if (areaSlug) {
      const area = cityAreas.find(a => a.slug === areaSlug);
      return {
        type: 'area',
        id: area?._id,
        placeholderName: area?.name || 'Area',
        fallbackTitle: area ? `Ads in ${area.name}, ${cityInfo?.name || ''}` : 'Area Listings'
      };
    }
    if (citySlug) {
      if (isHotelsPage) {
        return {
          type: 'city-hotels',
          id: cityInfo?._id,
          placeholderName: cityInfo ? `Hotels in ${cityInfo.name}` : 'Hotels',
          fallbackTitle: cityInfo ? `Hotels in ${cityInfo.name}` : 'Hotel Listings'
        };
      }
      return {
        type: 'city',
        id: cityInfo?._id,
        placeholderName: cityInfo?.name || 'City',
        fallbackTitle: cityInfo ? `Ads in ${cityInfo.name}` : '' 
      };
    }
    if (categorySlug) {
      const name = activeSubSub?.name || activeSub?.name || activeCategory?.name || 'Category';
      return {
        type: 'category',
        id: activeSubSub?._id || activeSub?._id || activeCategory?._id,
        placeholderName: name,
        fallbackTitle: `${name} Listings`
      };
    }
    return { type: 'ads', id: null, placeholderName: 'Marketplace', fallbackTitle: 'Browse All Ads' };
  };

  const seoContext = getSeoContext();
  const siteName = settings?.siteName || 'Elocanto.pk';

  const { seo } = usePageSeo(seoContext.type, seoContext.id, {
    title: seoContext.fallbackTitle,
    description: `Browse the latest ads in ${seoContext.placeholderName}. Find the best deals on Elocanto.`
  });

  // Handle {name} placeholder in client-side title — only after API responds
  const seoReady = seo !== null;
  const finalSeoTitle = seoReady ? (seo?.title || `{name} | ${siteName}`) : '';
  const displayTitle = seoReady 
    ? finalSeoTitle.replace(/{name}/gi, seoContext.placeholderName) 
    : (initialData?.title || seoContext.fallbackTitle);
  const finalSeoDesc = seoReady ? (seo?.metaDescription || settings?.defaultMetaDescription || 'Secure destination to buy and sell.') : '';
  const displayDesc = seoReady ? finalSeoDesc.replace(/{name}/gi, seoContext.placeholderName) : '';

  const displayKeywords = seoReady ? (seo?.keywords || '').replace(/{name}/gi, seoContext.placeholderName) : '';


  const trackedKey = useRef(null);
  const trackedFeaturedKey = useRef(null);

  useEffect(() => {
    if (ads.length > 0 && trackedKey.current !== location.search) {
      trackedKey.current = location.search;
      const adIds = ads.map(ad => ad._id);
      const viewerId = localStorage.getItem('ad_viewer_id') || `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!localStorage.getItem('ad_viewer_id')) {
        localStorage.setItem('ad_viewer_id', viewerId);
      }
      api.post('/views/track-bulk', { adIds, localStorageId: viewerId }).catch(console.error);
    }
  }, [ads, location.search]);

  // Track Gallery (Marquee) Featured Ads on reload/load
  useEffect(() => {
    if (featuredAds.length > 0 && trackedFeaturedKey.current !== 'tracked') {
      trackedFeaturedKey.current = 'tracked';
      const adIds = featuredAds.map(ad => ad._id);
      const viewerId = localStorage.getItem('ad_viewer_id') || `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!localStorage.getItem('ad_viewer_id')) {
        localStorage.setItem('ad_viewer_id', viewerId);
      }
      api.post('/views/track-bulk', { adIds, localStorageId: viewerId, page: 'listing_gallery' }).catch(console.error);
    }
  }, [featuredAds]);

  const updateFilter = (name, value) => {
    const params = new URLSearchParams(location.search);
    if (value) params.set(name, value);
    else params.delete(name);
    if (name !== 'page') params.set('page', '1');
    navigate(`${window.location.pathname}?${params.toString()}`);
  };

  if (notFound) {
    return <NotFoundPage />;
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 64 }}>
      {seoReady && (
        <Helmet>
          <title>{displayTitle}</title>
          <meta name="description" content={displayDesc} />
          {displayKeywords && <meta name="keywords" content={displayKeywords} />}

        </Helmet>
      )}
      <style>{`
        .filter-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1999;
          animation: fadeIn 0.3s ease;
        }
        .filter-sidebar.mobile-active {
          position: fixed !important;
          top: 0; right: 0; bottom: 0;
          left: auto !important;
          width: 85% !important;
          max-width: 340px !important;
          background: white !important;
          z-index: 2000 !important;
          display: block !important;
          overflow-y: auto !important;
          padding: 24px !important;
          box-shadow: -10px 0 30px rgba(0,0,0,0.1) !important;
          animation: slideInRight 0.3s ease-out;
          border-left: 1px solid #eef2ff;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .expandable-container {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
          opacity: 0;
        }
        .expandable-container.expanded {
          max-height: 2000px;
          opacity: 1;
        }
        .search-pill {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          outline: none;
          width: 100%;
          max-width: 300px;
          margin-bottom: 16px;
        }
        .search-pill::placeholder {
          color: rgba(255,255,255,0.4);
        }
        .gallery-container {
          scroll-behavior: smooth;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .gallery-container::-webkit-scrollbar {
          display: none;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 10px)); }
        }
        .gallery-marquee {
          display: flex;
          gap: 20px;
          animation: marquee 40s linear infinite;
          width: max-content;
        }
        .gallery-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes scroll-hint {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .gallery-hint {
          animation: scroll-hint 2s ease-in-out infinite;
        }
      `}</style>



      {/* City/Area/Hotel Hub Section - Premium Banner */}
      {citySlug && cityInfo && (
        <div className="container-custom" style={{ paddingTop: 8, paddingBottom: 16 }}>
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 24, padding: 'clamp(24px, 5vw, 40px)', color: 'white', position: 'relative', overflow: 'hidden' }}>
            {/* Dynamic Background Image Overlay (Subtle) */}
            {(hotelSlug || areaSlug) && (
              <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'url(/images/pattern-dots.png)', opacity: 0.1, pointerEvents: 'none' }}></div>
            )}

            <h1 style={{ fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 900, marginBottom: 8, color: 'white' }}>
              {seo?.title || (hotelSlug ? (
                cityHotels.find(h => h.slug === hotelSlug)?.name + (cityInfo ? ` in ${cityInfo.name}` : '')
              ) : areaSlug ? (
                cityAreas.find(a => a.slug === areaSlug)?.name + (cityInfo ? `, ${cityInfo.name}` : '')
              ) : isHotelsPage ? (
                `Hotels in ${cityInfo.name}`
              ) : (
                cityInfo?.name || 'Listings'
              ))}
            </h1>

            {/* Navigation Badges / Stats - Only show back-link on sub-pages */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: (areaSlug || hotelSlug || isHotelsPage) ? 16 : 0 }}>
              {(areaSlug || hotelSlug || isHotelsPage) && (
                <Link to={`/cities/${cityInfo?.slug || citySlug}`} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapIcon style={{ width: 12 }} /> ALL {cityInfo?.name?.toUpperCase()}
                </Link>
              )}
            </div>

            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: (!areaSlug && !hotelSlug && !isHotelsPage) ? 24 : 0 }}>
              {hotelSlug ? (
                `Find details, directions and ads for ${cityHotels.find(h => h.slug === hotelSlug)?.name}.`
              ) : areaSlug ? (
                `Browse ads and top listings in ${cityAreas.find(a => a.slug === areaSlug)?.name}, ${cityInfo.name}.`
              ) : isHotelsPage ? (
                `Explore premium hotels and accommodations located in ${cityInfo.name}.`
              ) : (
                `Browse ads, areas, and hotels in ${cityInfo.name}`
              )}
            </p>

            {/* Expansions - Universal but Context-Aware */}
            <div style={{ marginTop: (!areaSlug && !hotelSlug && !isHotelsPage) ? 0 : 8 }}>
              {/* Areas Section - Only show on City hub OR Area pages */}
              {(cityAreas.length > 0 || isLocationsLoading) && (!hotelSlug && !isHotelsPage) && (
                <div style={{ marginBottom: areaSlug ? 0 : 20 }}>
                  <button
                    disabled={isLocationsLoading}
                    onClick={() => setIsAreasExpanded(!isAreasExpanded)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 20px',
                      borderRadius: 14, cursor: isLocationsLoading ? 'wait' : 'pointer', transition: 'all 0.3s',
                      opacity: isLocationsLoading ? 0.7 : 1
                    }}
                  >
                    <MapPinIcon style={{ width: 18, height: 18, color: '#f97316' }} />
                    <span style={{ fontWeight: 800, fontSize: 14 }}>
                      {isLocationsLoading ? 'Loading Areas...' : isAreasExpanded ? 'Hide All Areas' : `View All Areas (${cityAreas.length})`}
                    </span>
                    {!isLocationsLoading && <ChevronDownIcon style={{ width: 16, transition: 'transform 0.3s', transform: isAreasExpanded ? 'rotate(180deg)' : 'none' }} />}
                  </button>

                  <div className={`expandable-container ${isAreasExpanded ? 'expanded' : ''}`} style={{ marginTop: 20 }}>
                    <input
                      type="text"
                      className="search-pill"
                      placeholder="Search for an area..."
                      value={areaSearch}
                      onChange={(e) => setAreaSearch(e.target.value)}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                      {cityAreas
                        .filter(a => a.name.toLowerCase().includes(areaSearch.toLowerCase()))
                        .map(area => {
                          const areaCitySlug = area.customCitySlug || citySlug;
                          return (
                            <Link key={area._id} to={`/cities/${areaCitySlug}/areas/${area.slug}`}
                              style={{
                                padding: '8px 12px', background: 'rgba(255,255,255,0.05)', color: 'white',
                                borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                                border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s',
                                display: 'block', textAlign: 'center'
                              }}
                              className="hover:bg-white/10"
                            >
                              {area.name}
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Hotels Section - Only show on City hub OR Hotel pages */}
              {(cityHotels.length > 0 || isLocationsLoading) && (!areaSlug) && (
                <div style={{ marginBottom: (hotelSlug || isHotelsPage) ? 0 : 0 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      disabled={isLocationsLoading}
                      onClick={() => setIsHotelsExpanded(!isHotelsExpanded)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(249,115,22,0.1)',
                        border: '1px solid rgba(249,115,22,0.3)', color: 'white', padding: '10px 20px',
                        borderRadius: 14, cursor: isLocationsLoading ? 'wait' : 'pointer', transition: 'all 0.3s',
                        opacity: isLocationsLoading ? 0.7 : 1
                      }}
                    >
                      <BuildingOffice2Icon style={{ width: 18, height: 18, color: '#f97316' }} />
                      <span style={{ fontWeight: 800, fontSize: 14 }}>
                        {isLocationsLoading ? 'Loading Hotels...' : isHotelsExpanded ? 'Hide All Hotels' : `View All Hotels (${cityHotels.length})`}
                      </span>
                      {!isLocationsLoading && <ChevronDownIcon style={{ width: 16, transition: 'transform 0.3s', transform: isHotelsExpanded ? 'rotate(180deg)' : 'none' }} />}
                    </button>
                  </div>

                  <div className={`expandable-container ${isHotelsExpanded ? 'expanded' : ''}`} style={{ marginTop: 20 }}>
                    <input
                      type="text"
                      className="search-pill"
                      placeholder="Search for a hotel..."
                      value={hotelSearch}
                      onChange={(e) => setHotelSearch(e.target.value)}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                      {cityHotels
                        .filter(h => h.name.toLowerCase().includes(hotelSearch.toLowerCase()))
                        .map(hotel => {
                          const hotelCitySlug = hotel.customCitySlug || citySlug;
                          return (
                            <Link key={hotel._id} to={`/cities/${hotelCitySlug}/hotels/${hotel.slug}`}
                              style={{
                                padding: '8px 12px', background: 'rgba(255,255,255,0.05)', color: 'white',
                                borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                                border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s',
                                display: 'block', textAlign: 'center'
                              }}
                              className="hover:bg-white/10"
                            >
                              {hotel.name}
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visual Breadcrumbs (SSR handles the Schema JSON-LD) */}
      <div className="container-custom" style={{ paddingTop: 20 }}>
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[12px] text-gray-500 list-none p-0 m-0">
            {breadcrumbs.map((bc, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={index} className="flex items-center gap-2">
                  {!isLast ? (
                    <>
                      <Link
                        to={bc.path}
                        className="hover:text-primary transition-colors no-underline font-medium"
                      >
                        {bc.name}
                      </Link>
                      <span className="text-gray-300">/</span>
                    </>
                  ) : (
                    <span className="text-gray-900 font-bold truncate max-w-[150px]">
                      {bc.name}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Hero Banner Area */}
      <div className="container-custom" style={{ paddingTop: 12, paddingBottom: 24 }}>
        {!categorySlug && !citySlug && (
          <div style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', borderRadius: 24, padding: 'clamp(24px, 6vw, 48px) clamp(24px, 8vw, 64px)', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
              <span style={{ display: 'inline-block', background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
                PREMIUM SELECTION
              </span>
              <h1 style={{ fontSize: 'clamp(24px, 6vw, 42px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
                {seo?.title || (activeCategory ? activeCategory.name : 'FIND THE PERFECT MATCH &ndash; ADS CURATED JUST FOR YOU')}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                {activeCategory?.description || 'Explore thousands of verified listings tailored to your professional needs.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Top Controls Bar */}
      <div className="container-custom" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ad Type Toggle - Keep for both but style slightly better */}
          <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #eef2ff', paddingBottom: 12, overflowX: 'auto' }} className="hide-scroll">
            <button
              onClick={() => updateFilter('listingType', '')}
              style={{
                color: listingType === '' ? 'white' : '#64748b',
                background: listingType === '' ? 'var(--dark)' : 'white',
                padding: '10px 20px', borderRadius: 12,
                border: '1px solid ' + (listingType === '' ? 'var(--dark)' : '#e2e8f0'),
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', fontWeight: 800, fontSize: 12,
                boxShadow: listingType === '' ? '0 10px 20px rgba(30, 41, 59, 0.15)' : 'none'
              }}
            >
              🔍 ALL ADS
            </button>
            <button
              onClick={() => updateFilter('listingType', 'featured')}
              style={{
                color: listingType === 'featured' ? 'white' : '#64748b',
                background: listingType === 'featured' ? '#f59e0b' : 'white',
                padding: '10px 20px', borderRadius: 12,
                border: '1px solid ' + (listingType === 'featured' ? '#f59e0b' : '#e2e8f0'),
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', fontWeight: 800, fontSize: 12,
                boxShadow: listingType === 'featured' ? '0 10px 20px rgba(245, 158, 11, 0.2)' : 'none'
              }}
            >
              ⭐ FEATURED ADS
            </button>
            <button
              onClick={() => updateFilter('listingType', 'simple')}
              style={{
                color: listingType === 'simple' ? 'white' : '#64748b',
                background: listingType === 'simple' ? '#3b82f6' : 'white',
                padding: '10px 20px', borderRadius: 12,
                border: '1px solid ' + (listingType === 'simple' ? '#3b82f6' : '#e2e8f0'),
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', fontWeight: 800, fontSize: 12,
                boxShadow: listingType === 'simple' ? '0 10px 20px rgba(59, 130, 246, 0.2)' : 'none'
              }}
            >
              📋 SIMPLE ADS
            </button>
          </div>

          {/* View Toggle - Visible on all devices */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
            <div style={{ display: 'flex', background: 'white', borderRadius: 12, padding: 4, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: viewMode === 'list' ? 'rgba(62,111,225,0.08)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--primary)' : '#94a3b8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 11
                }}
                title="List View"
              >
                <ListBulletIcon style={{ width: 16, height: 16 }} />
                <span className="hidden sm:inline">LIST</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: viewMode === 'grid' ? 'rgba(62,111,225,0.08)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--primary)' : '#94a3b8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 11
                }}
                title="Grid View"
              >
                <Squares2X2Icon style={{ width: 16, height: 16 }} />
                <span className="hidden sm:inline">GRID</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Actions - ONLY on small devices */}
          {!isLarge && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'white', border: '1px solid #e2e8f0', padding: '12px 16px',
                  borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#1e293b',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
                onClick={() => setShowFilters(true)}
              >
                <AdjustmentsHorizontalIcon style={{ width: 18, color: '#64748b' }} />
                Advanced Filters
              </button>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select
                  value={sort} onChange={(e) => updateFilter('sort', e.target.value)}
                  aria-label="Sort by"
                  style={{
                    width: '100%', appearance: 'none', background: 'white', border: '1px solid #e2e8f0',
                    padding: '12px 16px', paddingRight: 40, borderRadius: 12, fontSize: 14,
                    fontWeight: 700, color: '#1e293b', cursor: 'pointer', outline: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <ChevronDownIcon style={{ width: 16, color: '#64748b', position: 'absolute', right: 16, pointerEvents: 'none' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Ads Section */}
      {featuredAds.length > 0 && !categorySlug && !keyword && (
        <div className="container-custom" style={{ marginBottom: 40 }}>
          <div style={{ background: '#fdf8e3', padding: 'clamp(20px, 4vw, 32px)', borderRadius: 24, border: '1px solid #fde047', boxShadow: '0 10px 30px rgba(250, 204, 21, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#854d0e' }}>Gallery Ads</h3>
                <p style={{ fontSize: 10, color: '#a16207', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 800, marginTop: 4 }}>TOP PICKS • VERIFIED LISTINGS</p>
              </div>
              <Link to="/ads?sort=featured" style={{ background: '#fef9c3', color: '#854d0e', fontSize: 12, fontWeight: 800, textDecoration: 'none', padding: '8px 16px', borderRadius: 12, border: '1px solid #fef08a' }}>View All &rarr;</Link>
            </div>

            <div className="gallery-container" style={{
              overflowX: 'hidden', paddingBottom: 16, paddingTop: 4
            }}>
              <div className="gallery-marquee">
                {/* Original Items */}
                {featuredAds.slice(0, settings?.featuredAdsLimit || 10).map(ad => (
                  <Link key={ad._id} to={`/ads/${generateAdSlug(ad)}`} style={{ textDecoration: 'none', textAlign: 'center', flexShrink: 0, width: 130 }}>
                    <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'white', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.06)', marginBottom: 12, overflow: 'hidden', transition: 'all 0.3s' }} className="hover:scale-105 hover:shadow-lg group">
                      <img
                        src={getOptimizedImageUrl(ad.images?.[0], 160)}
                        alt={ad.title}
                        width="130"
                        height="130"
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        className="transition-transform group-hover:scale-110"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                      />
                    </div>
                    <div style={{ color: '#854d0e', fontSize: 15, fontWeight: 900, marginBottom: 2 }}>{settings?.priceFormat || 'PKR'} {ad.price.toLocaleString()}</div>
                    <div style={{ color: '#a16207', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>{ad.title}</div>
                  </Link>
                ))}
                {/* Duplicate Items for Seamless Loop */}
                {featuredAds.slice(0, settings?.featuredAdsLimit || 10).map(ad => (
                  <Link key={`${ad._id}-clone`} to={`/ads/${generateAdSlug(ad)}`} style={{ textDecoration: 'none', textAlign: 'center', flexShrink: 0, width: 130 }}>
                    <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'white', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.06)', marginBottom: 12, overflow: 'hidden', transition: 'all 0.3s' }} className="hover:scale-105 hover:shadow-lg group">
                      <img
                        key={ad.images?.[0]}
                        src={getOptimizedImageUrl(ad.images?.[0], 160)}
                        alt={ad.title}
                        width="130"
                        height="130"
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        className="transition-transform group-hover:scale-110"
                        onError={(e) => {
                          // Phase 1: Try loading the raw original path if optimized fails
                          if (e.target.src.includes('/images/')) {
                            e.target.src = ad.images?.[0] || '/placeholder.png';
                          }
                          // Phase 2: If even raw fails, show the placeholder
                          else if (!e.target.src.includes('placeholder.png')) {
                            e.target.src = '/placeholder.png';
                          }
                        }}
                      />
                    </div>
                    <div style={{ color: '#854d0e', fontSize: 15, fontWeight: 900, marginBottom: 2 }}>{settings?.priceFormat || 'PKR'} {ad.price.toLocaleString()}</div>
                    <div style={{ color: '#a16207', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>{ad.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="container-custom flex flex-col lg:grid lg:grid-cols-[260px_1fr] gap-8">

        {/* Sidebar Filters (Desktop Only) */}
        <aside className="hidden lg:block" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)' }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--dark)', marginBottom: 20 }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                to="/ads"
                style={{ textAlign: 'left', textDecoration: 'none', fontSize: 14, color: !categorySlug ? 'var(--primary)' : 'var(--dark)', fontWeight: !categorySlug ? 700 : 600 }}
              >
                All Categories
              </Link>
              {categories.map(cat => (
                <div key={cat._id}>
                  <Link
                    to={`/${cat.slug}`}
                    style={{
                      textAlign: 'left', textDecoration: 'none',
                      background: categorySlug === cat.slug ? 'rgba(249, 94, 38, 0.08)' : 'none',
                      padding: '8px 10px', borderRadius: 10,
                      fontSize: 14, color: categorySlug === cat.slug ? 'var(--primary)' : 'var(--dark)',
                      fontWeight: categorySlug === cat.slug ? 700 : 600,
                      display: 'flex', justifyContent: 'space-between', width: '100%'
                    }}
                  >
                    <span>{cat.name}</span>
                    <ChevronDownIcon style={{ width: 14, transform: categorySlug === cat.slug ? 'rotate(180deg)' : 'none' }} />
                  </Link>
                  {categorySlug === cat.slug && (
                    <div style={{ paddingLeft: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '2px solid var(--gray-100)', marginLeft: 6 }}>
                      {cat.subcategories?.map(sub => (
                        <div key={sub._id}>
                          <Link
                            to={`/${cat.slug}/${sub.slug}`}
                            style={{
                              textAlign: 'left', textDecoration: 'none',
                              fontSize: 13, color: subCategorySlug === sub.slug ? 'var(--primary)' : 'var(--gray-600)',
                              fontWeight: subCategorySlug === sub.slug ? 700 : 500,
                              display: 'flex', justifyContent: 'space-between'
                            }}
                          >
                            <span>{sub.name}</span>
                          </Link>
                          {subCategorySlug === sub.slug && sub.subSubCategories?.length > 0 && (
                            <div style={{ paddingLeft: 12, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6, borderLeft: '1px dashed var(--gray-200)' }}>
                              {sub.subSubCategories.map(ss => (
                                <Link
                                  key={ss._id}
                                  to={`/${cat.slug}/${sub.slug}/${ss.slug}`}
                                  style={{
                                    textDecoration: 'none', fontSize: 12,
                                    color: subSubcatSlug === ss.slug ? 'var(--primary)' : 'var(--gray-500)',
                                    fontWeight: subSubcatSlug === ss.slug ? 700 : 400
                                  }}
                                >
                                  {ss.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
              <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>Price Range</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number" placeholder="Min" className="input-field"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  value={tempFilters.priceMin}
                  onChange={(e) => setTempFilters({ ...tempFilters, priceMin: e.target.value })}
                />
                <input
                  type="number" placeholder="Max" className="input-field"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  value={tempFilters.priceMax}
                  onChange={(e) => setTempFilters({ ...tempFilters, priceMax: e.target.value })}
                />
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: 20, justifyContent: 'center' }} onClick={() => applyFiltersToUrl(tempFilters)}>
              Apply Filters
            </button>
          </div>

          <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)', marginTop: 24 }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--dark)', marginBottom: 20 }}>
              <MapPinIcon style={{ width: 16, height: 16, display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              Cities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {cities.map(c => {
                const isExpanded = expandedCity === c._id;
                const isCurrent = citySlug === c.slug;
                return (
                  <div key={c._id}>
                    <button
                      onClick={() => setExpandedCity(isExpanded ? null : c._id)}
                      style={{
                        textAlign: 'left', width: '100%',
                        background: isCurrent ? 'rgba(62, 111, 225, 0.08)' : isExpanded ? '#f8fafc' : 'none',
                        border: 'none', padding: '10px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                        color: isCurrent ? 'var(--primary)' : 'var(--dark)', fontWeight: isCurrent ? 700 : 600,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{c.isPopular ? '🌟' : '📍'}</span>
                        {c.name}
                      </span>
                      <ChevronDownIcon style={{ width: 14, color: '#94a3b8', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    {isExpanded && (
                      <div style={{ paddingLeft: 16, paddingTop: 6, paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 4, borderLeft: '2px solid #e2e8f0', marginLeft: 20 }}>
                        {/* City main page link */}
                        <Link
                          to={`/cities/${c.slug}`}
                          style={{ textDecoration: 'none', fontSize: 12, fontWeight: 700, color: citySlug === c.slug && !areaSlug && !hotelSlug && !isHotelsPage ? 'var(--primary)' : '#475569', padding: '6px 10px', borderRadius: 8, background: citySlug === c.slug && !areaSlug && !hotelSlug && !isHotelsPage ? 'rgba(62,111,225,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          🏙️ All Ads in {c.name}
                        </Link>

                        {/* Areas sub-section */}
                        {cityFilterAreas[c._id]?.length > 0 && (
                          <div style={{ marginTop: 4 }}>
                            <button
                              onClick={() => setExpandedSub(prev => ({ ...prev, [`${c._id}_areas`]: !prev[`${c._id}_areas`] }))}
                              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <span>AREAS ({cityFilterAreas[c._id].length})</span>
                              <ChevronDownIcon style={{ width: 10, transform: expandedSub[`${c._id}_areas`] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                            {expandedSub[`${c._id}_areas`] && (
                              <div className="fade-in">
                                {cityFilterAreas[c._id].map(area => (
                                  <Link
                                    key={area._id}
                                    to={`/cities/${area.customCitySlug || c.slug}/areas/${area.slug}`}

                                    style={{ textDecoration: 'none', fontSize: 12, fontWeight: areaSlug === area.slug ? 700 : 500, color: areaSlug === area.slug ? 'var(--primary)' : '#64748b', padding: '5px 10px', paddingLeft: 14, borderRadius: 6, display: 'block', background: areaSlug === area.slug ? 'rgba(62,111,225,0.06)' : 'none' }}
                                  >
                                    📍 {area.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hotels sub-section */}
                        {cityFilterHotels[c._id]?.length > 0 && (
                          <div style={{ marginTop: 4 }}>
                            <button
                              onClick={() => setExpandedSub(prev => ({ ...prev, [`${c._id}_hotels`]: !prev[`${c._id}_hotels`] }))}
                              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <span>HOTELS ({cityFilterHotels[c._id].length})</span>
                              <ChevronDownIcon style={{ width: 10, transform: expandedSub[`${c._id}_hotels`] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                            {expandedSub[`${c._id}_hotels`] && (
                              <div className="fade-in">
                                <Link
                                  to={`/cities/${c.slug}/hotels`}

                                  style={{ textDecoration: 'none', fontSize: 12, fontWeight: isHotelsPage && citySlug === c.slug ? 700 : 500, color: isHotelsPage && citySlug === c.slug ? '#f97316' : '#64748b', padding: '5px 10px', paddingLeft: 14, borderRadius: 6, display: 'block', background: isHotelsPage && citySlug === c.slug ? 'rgba(249,115,22,0.06)' : 'none' }}
                                >
                                  🏨 All Hotels
                                </Link>
                                {cityFilterHotels[c._id].map(hotel => (
                                  <Link
                                    key={hotel._id}
                                    to={`/cities/${hotel.customCitySlug || c.slug}/hotels/${hotel.slug}`}

                                    style={{ textDecoration: 'none', fontSize: 12, fontWeight: hotelSlug === hotel.slug ? 700 : 500, color: hotelSlug === hotel.slug ? '#f97316' : '#64748b', padding: '5px 10px', paddingLeft: 14, borderRadius: 6, display: 'block', background: hotelSlug === hotel.slug ? 'rgba(249,115,22,0.06)' : 'none' }}
                                  >
                                    🏨 {hotel.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Show message if no areas/hotels loaded yet */}
                        {!cityFilterAreas[c._id]?.length && !cityFilterHotels[c._id]?.length && (
                          <div style={{ fontSize: 11, color: '#94a3b8', padding: '4px 10px', fontStyle: 'italic' }}>No areas or hotels yet</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Ads List Content */}
        <div style={{ minWidth: 0 }}>

          {/* Trust Banner */}
          <div style={{ background: '#e0fcf4', border: '1px solid #a7f3d0', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 auto' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <ShieldCheckIcon style={{ width: 20 }} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#065f46' }}>Professional Seller Protection</h4>
                <p style={{ fontSize: 12, color: '#047857' }}>Every listing in the premium category is manually verified for quality.</p>
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', cursor: 'pointer' }}>Learn More</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            {listingType === 'featured' ? (
              <>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fef08a', color: '#854d0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⭐</div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', lineHeight: 1 }}>Featured Listings</h2>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>HAND-PICKED PREMIUM OPPORTUNITIES</p>
                </div>
              </>
            ) : (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', lineHeight: 1 }}>Simple Listings</h2>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>RECENTLY POSTED ADS</p>
              </div>
            )}
          </div>

          {loading ? (
            null
          ) : ads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', background: 'white', borderRadius: 16 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 8 }}>No matching ads found</h3>
              <p style={{ color: '#6b7280' }}>Try adjusting your filters or keyword.</p>
            </div>
          ) : (
            <>
              <style>{`
                .ads-grid {
                  display: ${viewMode === 'list' ? 'flex' : 'grid'};
                  flex-direction: ${viewMode === 'list' ? 'column' : 'unset'};
                  grid-template-columns: ${viewMode === 'list' ? 'none' : 'repeat(3, 1fr)'};
                  gap: ${viewMode === 'list' ? '16px' : '20px'};
                }
                @media (min-width: 1440px) {
                  .ads-grid { grid-template-columns: ${viewMode === 'list' ? 'none' : 'repeat(4, 1fr)'}; }
                }
                @media (max-width: 1024px) {
                  .ads-grid { grid-template-columns: ${viewMode === 'list' ? 'none' : 'repeat(2, 1fr)'}; }
                }
                @media (max-width: 640px) {
                  .ads-grid { grid-template-columns: ${viewMode === 'list' ? 'none' : 'repeat(2, 1fr)'}; gap: 12px; }
                }
              `}</style>

              <div className="ads-grid">
                {ads.map(ad => (
                  <AdCard key={ad._id} ad={ad} viewMode={viewMode} />
                ))}
              </div>

              {/* Infinite Scroll Sentinel */}
              <div ref={sentinelRef} style={{ height: 40, marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(infiniteLoading || loading) && currentPage < totalPages && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
                    <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    Discoverying More Assets...
                  </div>
                )}
                {!loading && !infiniteLoading && currentPage >= totalPages && ads.length > 0 && (
                  <div style={{ color: 'var(--gray-400)', fontSize: 13, fontWeight: 600 }}>That's all for now! ✨</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <HowItWorks />

      {/* Mobile-Only Global Filter Drawer (Placed at root for global positioning) */}
      {showFilters && !isLarge && (
        <>
          <div className="filter-overlay" onClick={() => setShowFilters(false)}></div>
          <aside className="filter-sidebar mobile-active" style={{ background: 'white', border: 'none', padding: 0 }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1e293b' }}>Filters</h3>
              <button onClick={() => setShowFilters(false)} aria-label="Close filters" style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Syncing with Desktop UI for consistent features */}
            <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)', marginBottom: 24 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--dark)', marginBottom: 20 }}>Filter by Price</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 12 }}>
                <span>Min Price</span>
                <span>Max Price</span>
              </div>
              <div style={{ height: 4, background: 'var(--gray-200)', borderRadius: 2, position: 'relative', marginBottom: 20 }}>
                <div style={{ position: 'absolute', left: '20%', right: '40%', height: '100%', background: 'var(--primary)', borderRadius: 2 }}></div>
                <div style={{ position: 'absolute', left: '20%', top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, background: 'var(--primary)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                <div style={{ position: 'absolute', right: '40%', top: '50%', transform: 'translate(50%, -50%)', width: 14, height: 14, background: 'var(--primary)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="number" placeholder="Min" aria-label="Minimum price" className="input-field"
                  style={{ padding: '10px 14px', fontSize: 13, borderRadius: 12, border: '2px solid var(--gray-200)' }}
                  value={tempFilters.priceMin}
                  onChange={(e) => setTempFilters({ ...tempFilters, priceMin: e.target.value })}
                />
                <input
                  type="number" placeholder="Max" aria-label="Maximum price" className="input-field"
                  style={{ padding: '10px 14px', fontSize: 13, borderRadius: 12, border: '2px solid var(--gray-200)' }}
                  value={tempFilters.priceMax}
                  onChange={(e) => setTempFilters({ ...tempFilters, priceMax: e.target.value })}
                />
              </div>
            </div>

            <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)' }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--dark)', marginBottom: 20 }}>Categories</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link to="/ads" style={{ textAlign: 'left', textDecoration: 'none', fontSize: 14, color: !categorySlug ? 'var(--primary)' : 'var(--dark)', fontWeight: !categorySlug ? 700 : 600 }}>All Categories</Link>
                {categories.map(cat => (
                  <div key={cat._id}>
                    <Link to={`/${cat.slug}`} style={{ textAlign: 'left', textDecoration: 'none', background: categorySlug === cat.slug ? 'rgba(249, 94, 38, 0.08)' : 'none', padding: '8px 10px', borderRadius: 10, fontSize: 14, color: categorySlug === cat.slug ? 'var(--primary)' : 'var(--dark)', fontWeight: categorySlug === cat.slug ? 700 : 600, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{cat.name}</span>
                      <ChevronDownIcon style={{ width: 14, transform: categorySlug === cat.slug ? 'rotate(180deg)' : 'none' }} />
                    </Link>
                    {categorySlug === cat.slug && (
                      <div style={{ paddingLeft: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '2px solid var(--gray-100)', marginLeft: 6 }}>
                        {cat.subcategories?.map(sub => (
                          <div key={sub._id}>
                            <Link to={`/${cat.slug}/${sub.slug}`} style={{ textAlign: 'left', textDecoration: 'none', fontSize: 13, color: subCategorySlug === sub.slug ? 'var(--primary)' : 'var(--gray-600)', fontWeight: subCategorySlug === sub.slug ? 700 : 500, display: 'flex', justifyContent: 'space-between' }}>
                              <span>{sub.name}</span>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)', marginTop: 24 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--dark)', marginBottom: 20 }}>
                <MapPinIcon style={{ width: 16, height: 16, display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Cities
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cities.map(c => {
                  const isExpanded = expandedCity === c._id;
                  const isCurrent = citySlug === c.slug;
                  return (
                    <div key={c._id}>
                      <button
                        onClick={() => setExpandedCity(isExpanded ? null : c._id)}
                        style={{ textAlign: 'left', width: '100%', background: isCurrent ? 'rgba(62, 111, 225, 0.08)' : isExpanded ? '#f8fafc' : 'none', border: 'none', padding: '10px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer', color: isCurrent ? 'var(--primary)' : 'var(--dark)', fontWeight: isCurrent ? 700 : 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{c.isPopular ? '🌟' : '📍'}</span>
                          {c.name}
                        </span>
                        <ChevronDownIcon style={{ width: 14, color: '#94a3b8', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                      </button>
                      {isExpanded && (
                        <div style={{ paddingLeft: 16, paddingTop: 6, paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 4, borderLeft: '2px solid #e2e8f0', marginLeft: 20 }}>
                          <Link to={`/cities/${c.slug}`} style={{ textDecoration: 'none', fontSize: 12, fontWeight: 700, color: citySlug === c.slug && !areaSlug && !hotelSlug && !isHotelsPage ? 'var(--primary)' : '#475569', padding: '6px 10px', borderRadius: 8, background: citySlug === c.slug && !areaSlug && !hotelSlug && !isHotelsPage ? 'rgba(62,111,225,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>🏙️ All Ads in {c.name}</Link>
                          {cityFilterAreas[c._id]?.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              <button onClick={() => setExpandedSub(prev => ({ ...prev, [`${c._id}_areas`]: !prev[`${c._id}_areas`] }))} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <span>AREAS ({cityFilterAreas[c._id].length})</span>
                                <ChevronDownIcon style={{ width: 10, transform: expandedSub[`${c._id}_areas`] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                              </button>
                              {expandedSub[`${c._id}_areas`] && (
                                <div className="fade-in">
                                  {cityFilterAreas[c._id].map(area => (
                                    <Link key={area._id} to={`/cities/${c.slug}/areas/${area.slug}`} style={{ textDecoration: 'none', fontSize: 12, fontWeight: areaSlug === area.slug ? 700 : 500, color: areaSlug === area.slug ? 'var(--primary)' : '#64748b', padding: '5px 10px', paddingLeft: 14, borderRadius: 6, display: 'block', background: areaSlug === area.slug ? 'rgba(62,111,225,0.06)' : 'none' }}>📍 {area.name}</Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {cityFilterHotels[c._id]?.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              <button onClick={() => setExpandedSub(prev => ({ ...prev, [`${c._id}_hotels`]: !prev[`${c._id}_hotels`] }))} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <span>HOTELS ({cityFilterHotels[c._id].length})</span>
                                <ChevronDownIcon style={{ width: 10, transform: expandedSub[`${c._id}_hotels`] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                              </button>
                              {expandedSub[`${c._id}_hotels`] && (
                                <div className="fade-in">
                                  <Link to={`/cities/${c.slug}/hotels`} style={{ textDecoration: 'none', fontSize: 12, fontWeight: isHotelsPage && citySlug === c.slug ? 700 : 500, color: isHotelsPage && citySlug === c.slug ? '#f97316' : '#64748b', padding: '5px 10px', paddingLeft: 14, borderRadius: 6, display: 'block', background: isHotelsPage && citySlug === c.slug ? 'rgba(249,115,22,0.06)' : 'none' }}>🏨 All Hotels</Link>
                                  {cityFilterHotels[c._id].map(hotel => (
                                    <Link key={hotel._id} to={`/cities/${c.slug}/hotels/${hotel.slug}`} style={{ textDecoration: 'none', fontSize: 12, fontWeight: hotelSlug === hotel.slug ? 700 : 500, color: hotelSlug === hotel.slug ? '#f97316' : '#64748b', padding: '5px 10px', paddingLeft: 14, borderRadius: 6, display: 'block', background: hotelSlug === hotel.slug ? 'rgba(249,115,22,0.06)' : 'none' }}>🏨 {hotel.name}</Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: 24, justifyContent: 'center', height: 48 }} onClick={() => { applyFiltersToUrl(tempFilters); setShowFilters(false); }}>
              Show Results
            </button>
          </aside>
        </>
      )}

    </div>
  );
}
