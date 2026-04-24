import { useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const AdDetailPage = lazy(() => import('../pages/AdDetailPage'));
const AdsListingPage = lazy(() => import('../pages/AdsListingPage'));

/**
 * UnifiedAdRouter handles dynamic segments for Listing Pages (Category/Subcategory/Sub-Subcategory).
 * All advertisements now use the dedicated /ads/:slug route for 100% reliability.
 */
export default function UnifiedAdRouter() {
  const params = useParams();
  
  // Since Ads use a dedicated /ads/ route, anyone hitting this router 
  // is definitely looking for a Category or Subcategory Listing.
  return (
    <Suspense fallback={null}>
      <AdsListingPage />
    </Suspense>
  );
}
