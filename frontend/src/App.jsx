import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';

import HomePage from './pages/HomePage';
import AdsListingPage from './pages/AdsListingPage';
import AdDetailPage from './pages/AdDetailPage';
import { AdProvider } from './context/AdContext';

import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { useSettings } from './context/SettingsContext';
import MaintenanceGuard from './components/MaintenanceGuard';
import './index.css';

// Lazy loading other pages

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
const AdminRedirectsPage = lazy(() => import('./pages/AdminRedirectsPage'));
const UnifiedAdRouter = lazy(() => import('./components/UnifiedAdRouter'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AntiScamPage = lazy(() => import('./pages/AntiScamPage'));
const CopyrightPage = lazy(() => import('./pages/CopyrightPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

import { Toaster } from 'react-hot-toast';

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function DomainRedirect() {
  const location = useLocation();

  useEffect(() => {
    const host = window.location.host;
    const path = location.pathname;

    if (host === 'pak.elocanto.com') {
      // Keep these paths on the old domain if requested
      const isExcluded = path.startsWith('/admin') ||
        path.startsWith('/api') ||
        path.startsWith('/uploads') ||
        path.startsWith('/assets') ||
        path.startsWith('/login') ||
        path.startsWith('/ads/');

      if (!isExcluded) {
        window.location.href = `https://pk.elocanto.com${path}${location.search}`;
      }
    }
  }, [location]);

  return null;
}

function GlobalHelmet() {
  const { settings } = useSettings();
  const defaultTitle = settings?.defaultMetaTitle || settings?.siteName || 'Elocanto';
  const defaultDesc = settings?.defaultMetaDescription || 'Explore our classified marketplace.';
  const defaultKeywords = settings?.defaultKeywords || '';

  const favicon = settings?.favicon;

  return (
    <Helmet>
      <title>{defaultTitle}</title>
      <meta name="description" content={defaultDesc} />
      {defaultKeywords && <meta name="keywords" content={defaultKeywords} />}
      <meta property="og:title" content={defaultTitle} />
      <meta property="og:description" content={defaultDesc} />

      {/* Dynamic Favicon Logic */}
      {favicon ? (
        <>
          <link rel="icon" href={favicon} />
          <link rel="apple-touch-icon" href={favicon} />
        </>
      ) : (
        <>
          <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
        </>
      )}
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
              <DomainRedirect />
              <ScrollToTop />
              <Suspense fallback={null}>
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
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/anti-scam" element={<AntiScamPage />} />
                    <Route path="/copyright-policy" element={<CopyrightPage />} />
                    <Route path="/about-us" element={<AboutUsPage />} />
                    <Route path="/contact-us" element={<ContactUsPage />} />
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
                      <Route path="/admin/redirects" element={<AdminRedirectsPage />} />
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
