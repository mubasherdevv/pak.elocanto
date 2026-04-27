import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import { getInitialData } from '../utils/ssr';

/**
 * Custom hook to fetch SEO settings for a specific page with fallbacks.
 * @param {string} pageType - 'homepage', 'ads', 'city', 'area', 'hotel', 'category'
 * @param {string} referenceId - Optional ID of the specific item
 * @param {object} fallbacks - Object containing fallback title, description, and keywords
 */
export const usePageSeo = (pageType, referenceId = null, fallbacks = {}) => {
  const { settings } = useSettings();
  const initialData = getInitialData();
  
  // Start with server-injected SEO data if available and path matches
  const [seo, setSeo] = useState(initialData?.seo || null);
  const [loading, setLoading] = useState(!seo);

  useEffect(() => {
    // If we already have the correct SEO data from SSR, we can skip the initial fetch
    if (initialData?.seo) {
       setLoading(false);
       return;
    }
    const fetchSeo = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/seo-settings/public', {
          params: { pageType, referenceId, pagePath: window.location.pathname }
        });

        if (data && (data.isActive || data.source)) {
          setSeo({
            title: data.title,
            metaDescription: data.metaDescription,
            keywords: data.keywords || ''
          });
        } else {
          // API returned nothing — now use fallbacks
          setSeo({
            title: fallbacks.title || settings?.defaultMetaTitle || settings?.siteName || 'Marketplace',
            metaDescription: fallbacks.description || settings?.defaultMetaDescription || 'Buy and sell locally.',
            keywords: fallbacks.keywords || settings?.defaultKeywords || ''
          });
        }
      } catch (error) {
        console.error('SEO Fetch Error:', error);
        // On error, use fallbacks so page isn't stuck
        setSeo({
          title: fallbacks.title || settings?.defaultMetaTitle || settings?.siteName || 'Marketplace',
          metaDescription: fallbacks.description || settings?.defaultMetaDescription || 'Buy and sell locally.',
          keywords: fallbacks.keywords || settings?.defaultKeywords || ''
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSeo();
  }, [pageType, referenceId, fallbacks.title, fallbacks.description, settings]);

  return { seo, loading };
};
