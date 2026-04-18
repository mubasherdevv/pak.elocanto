import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { PageSkeleton } from './components/Skeleton';
import ScrollToTop from './components/ScrollToTop';

import { AdProvider } from './context/AdContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { useSettings } from './context/SettingsContext';
import MaintenanceGuard from './components/MaintenanceGuard';
import './index.css';

// Lazy loading pages for Code Splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const AdsListingPage = lazy(() => import('./pages/AdsListingPage'));
const AdDetailPage = lazy(() => import('./pages/AdDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const PostAdPage = lazy(() => import('./pages/PostAdPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminAdsPage = lazy(() => import('./pages/AdminAdsPage'));
const AdminAdsAnalyticsPage = lazy(() => import('./pages/AdminAdsAnalyticsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const CategoryManagePage = lazy(() => import('./pages/CategoryManagePage'));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const SubcategoryAdsPage = lazy(() => import('./pages/SubcategoryAdsPage'));
const CityManagePage = lazy(() => import('./pages/CityManagePage'));
const AdminSeoPage = lazy(() => import('./pages/AdminSeoPage'));
const AdminTitlesSeoPage = lazy(() => import('./pages/AdminTitlesSeoPage'));
const UnifiedAdRouter = lazy(() => import('./components/UnifiedAdRouter'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

import { Toaster } from 'react-hot-toast';

function GlobalHelmet() {
  const { settings } = useSettings();
  const defaultTitle = settings?.defaultMetaTitle || settings?.siteName || 'Marketplace';
  const defaultDesc = settings?.defaultMetaDescription || 'Explore our classified marketplace.';
  const defaultKeywords = settings?.defaultKeywords || '';

  return (
    <Helmet>
      <title>{defaultTitle}</title>
      <meta name="description" content={defaultDesc} />
      {defaultKeywords && <meta name="keywords" content={defaultKeywords} />}
      <meta property="og:title" content={defaultTitle} />
      <meta property="og:description" content={defaultDesc} />
    </Helmet>
  );
}

function App() {
  return (
    <HelmetProvider>
      <SettingsProvider>
      <GlobalHelmet />
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '16px', fontWeight: 'bold' } }} />
        <AdProvider>

        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Marketplace Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route element={<MaintenanceGuard><PublicLayout /></MaintenanceGuard>}>
                <Route path="/ads/:slug" element={<AdDetailPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/ads" element={<AdsListingPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
                
                {/* Protected Marketplace Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/post-ad" element={<PostAdPage />} />
                  <Route path="/edit-ad/:id" element={<PostAdPage />} />
                  <Route path="/dashboard" element={<UserDashboardPage />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/messages/:conversationId" element={<MessagesPage />} />
                </Route>
                
                {/* SEO Friendly City / Area / Hotel Routes */}
                <Route path="/cities/:citySlug" element={<AdsListingPage />} />
                <Route path="/cities/:citySlug/areas/:areaSlug" element={<AdsListingPage />} />
                <Route path="/cities/:citySlug/hotels" element={<AdsListingPage />} />
                <Route path="/cities/:citySlug/hotels/:hotelSlug" element={<AdsListingPage />} />

                {/* Unified Intelligent Routing for Category/Sub/Ad slugs */}
                <Route path="/:categorySlug" element={<UnifiedAdRouter />} />
                <Route path="/:categorySlug/:subCategorySlug" element={<UnifiedAdRouter />} />
                <Route path="/:categorySlug/:subCategorySlug/:subSubcatSlug" element={<UnifiedAdRouter />} />
                <Route path="/:categorySlug/:subCategorySlug/:subSubcatSlug/:slug" element={<UnifiedAdRouter />} />
              </Route>

              {/* Admin Panel Routes */}
              <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/ads" element={<AdminAdsPage />} />
                  <Route path="/admin/ads-analytics" element={<AdminAdsAnalyticsPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/categories" element={<CategoryManagePage />} />
                  <Route path="/admin/cities" element={<CityManagePage />} />
                  <Route path="/admin/subcategories/:id/ads" element={<SubcategoryAdsPage />} />
                  <Route path="/admin/reports" element={<AdminReportsPage />} />
                  <Route path="/admin/settings" element={<AdminSettingsPage />} />
                  <Route path="/admin/seo" element={<AdminSeoPage />} />
                  <Route path="/admin/titles-seo" element={<AdminTitlesSeoPage />} />
                </Route>
              </Route>
              {/* Catch-all 404 Route */}
              <Route element={<PublicLayout />}>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </AdProvider>
      </AuthProvider>
      </SettingsProvider>
    </HelmetProvider>
  );
}


export default App;
