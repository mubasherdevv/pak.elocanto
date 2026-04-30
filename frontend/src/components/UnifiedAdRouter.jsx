import { useParams, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const AdsListingPage = lazy(() => import('../pages/AdsListingPage'));

/**
 * UnifiedAdRouter handles dynamic segments for Listing Pages (Category/Subcategory/Sub-Subcategory).
 * All advertisements now use the dedicated /ads/:slug route for 100% reliability.
 * For legacy URLs and 4-segment routes, we provide intelligent redirection.
 */
export default function UnifiedAdRouter() {
  const { slug } = useParams();
  
  // 4-segment URLs (/cat/sub/subsub/slug) are definitely ads.
  if (slug) {
    return <Navigate to={`/ads/${slug}`} replace />;
  }

  return (
    <Suspense fallback={null}>
      <AdsListingPage />
    </Suspense>
  );
}
