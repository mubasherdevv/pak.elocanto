import { useCallback, useEffect } from 'react';
import api from '../lib/api';

const VIEWER_ID_KEY = 'ad_viewer_id';

const getViewerId = () => {
  let viewerId = localStorage.getItem(VIEWER_ID_KEY);
  if (!viewerId) {
    viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(VIEWER_ID_KEY, viewerId);
  }
  return viewerId;
};

export const useViewTracker = () => {
  const viewerId = typeof window !== 'undefined' ? getViewerId() : null;

  const trackView = useCallback(async (adId, page = 'ads') => {
    if (!adId) return;

    try {
      await api.post('/views/track', {
        adId,
        page,
        localStorageId: viewerId
      });
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  }, [viewerId]);

  const trackBulkViews = useCallback(async (adIds) => {
    if (!adIds || adIds.length === 0) return;

    try {
      await api.post('/views/track-bulk', {
        adIds,
        localStorageId: viewerId
      });
    } catch (err) {
      console.error('Failed to track bulk views:', err);
    }
  }, [viewerId]);

  return { trackView, trackBulkViews };
};

export const useBulkViewTracker = (adIds, isEnabled = true) => {
  const { trackBulkViews } = useViewTracker();

  useEffect(() => {
    if (isEnabled && adIds && adIds.length > 0) {
      trackBulkViews(adIds);
    }
  }, [adIds, isEnabled, trackBulkViews]);
};

export default useViewTracker;
