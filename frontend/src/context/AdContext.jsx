import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { cache } from '../utils/cache';

import { getInitialData, getGlobalSettings } from '../utils/ssr';

const AdContext = createContext();

export const AdProvider = ({ children }) => {
  const initialData = getInitialData() || {};
  
  const [ads, setAds] = useState(initialData.ads || []);
  const [featuredAds, setFeaturedAds] = useState(() => initialData.featuredAds || cache.get('featured_ads') || []);
  const [latestAds, setLatestAds] = useState(() => initialData.latestAds || cache.get('latest_ads') || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(initialData.pages || 1);
  const [totalCount, setTotalCount] = useState(initialData.total || 0);
  const [currentPage, setCurrentPage] = useState(initialData.page || 1);
  const [settings, setSettings] = useState(() => getGlobalSettings() || cache.get('settings'));



  const fetchAds = useCallback(async (params = {}, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const pageSize = params.pageSize || settings?.featuredAdsPerPage || 15;
      const { data } = await api.get('/ads', { params: { ...params, pageSize, _t: Date.now() } });
      
      if (append) {
        setAds(prev => {
          // Prevent duplicates by checking IDs
          const existingIds = new Set(prev.map(a => a._id));
          const newAds = data.ads.filter(a => !existingIds.has(a._id));
          return [...prev, ...newAds];
        });
      } else {
        setAds(data.ads);
      }
      
      setTotalPages(data.pages);
      setTotalCount(data.total);
      setCurrentPage(data.page);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const fetchFeaturedAds = useCallback(async () => {
    try {
      const { data } = await api.get('/ads/featured', { params: { _t: Date.now() } });
      setFeaturedAds(data);
      cache.set('featured_ads', data, 2 * 60 * 1000); // 2 mins cache for featured ads
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLatestAds = useCallback(async () => {
    try {
      const { data } = await api.get('/ads/latest', { params: { _t: Date.now() } });
      setLatestAds(data);
      cache.set('latest_ads', data, 2 * 60 * 1000); // 2 mins cache for latest ads
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <AdContext.Provider value={{
      ads, featuredAds, latestAds, loading, error,
      totalPages, totalCount, currentPage,
      fetchAds, fetchFeaturedAds, fetchLatestAds,
      settings,
    }}>
      {children}
    </AdContext.Provider>
  );
};

export const useAds = () => {
  const ctx = useContext(AdContext);
  if (!ctx) throw new Error('useAds must be used within AdProvider');
  return ctx;
};

export default AdContext;
