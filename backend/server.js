import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import prerender from 'prerender-node';
import { fileURLToPath } from 'url';
dotenv.config();


import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { getCache, setCache } from './utils/cache.js';

// Ensure required directories exist
const uploadsPath = path.resolve(process.cwd(), 'uploads');
const tempPath = path.join(uploadsPath, '.temp');
const cachePath = path.join(uploadsPath, '.cache');

[uploadsPath, tempPath, cachePath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[STORAGE] Created directory: ${dir}`);
  }
});

// SEO Models for server-side injection
import SeoSettings from './models/SeoSettings.js';
import Settings from './models/Settings.js';
import City from './models/City.js';
import Area from './models/Area.js';
import User from './models/User.js';
import Hotel from './models/Hotel.js';
import Category from './models/Category.js';
import Subcategory from './models/Subcategory.js';
import SubSubCategory from './models/SubSubCategory.js';
import Ad from './models/Ad.js';

import { resolveSeoMetadata } from './controllers/seoSettingsController.js';

import { generalRateLimiter, loginRateLimiter, forgotPasswordRateLimiter } from './middleware/rateLimiter.js';

import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adRoutes from './routes/adRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import subcategoryRoutes from './routes/subcategoryRoutes.js';
import cityRoutes from './routes/cityRoutes.js';
import seoContentRoutes from './routes/seoContentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import viewRoutes from './routes/viewRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import areaRoutes from './routes/areaRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import seoSettingsRoutes from './routes/seoSettingsRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import {
  getSitemapIndex,
  getCategoriesSitemap,
  getCitiesSitemap,
  getAreasSitemap,
  getHotelsSitemap,
  getAdsSitemap
} from './controllers/sitemapController.js';
import redirectMiddleware from './middleware/redirectMiddleware.js';
import { resolveRouteData } from './utils/ssrData.js';


await connectDB();

const app = express();
app.set('trust proxy', 1);

// Prerender.io middleware - Must be before SPA route handler
if (process.env.PRERENDER_TOKEN) {
  app.use(prerender.set('prerenderToken', process.env.PRERENDER_TOKEN));
}
const PORT = process.env.PORT || 5000;
console.log('Server starting...');

// 1. Immediate Healthcheck (Railway Requirement)
app.get('/api/health', (req, res) => res.status(200).send('OK'));
app.get('/health', (req, res) => res.status(200).send('OK'));

// 2. High-Priority SEO Routes (Must be early to avoid SPA fallback)
app.get('/sitemap-categories.xml', getCategoriesSitemap);
app.get('/sitemap-cities.xml', getCitiesSitemap);
app.get('/sitemap-areas.xml', getAreasSitemap);
app.get('/sitemap-hotels.xml', getHotelsSitemap);
app.get('/sitemap-ads.xml', getAdsSitemap);
app.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /messages/
Disallow: /post-ad/
Disallow: /edit-ad/
Disallow: /api/
Disallow: /profile/
Disallow: /login
Disallow: /register
Disallow: /forgot-password

Sitemap: https://pk.elocanto.com/sitemap-categories.xml
Sitemap: https://pk.elocanto.com/sitemap-cities.xml
Sitemap: https://pk.elocanto.com/sitemap-areas.xml
Sitemap: https://pk.elocanto.com/sitemap-hotels.xml
Sitemap: https://pk.elocanto.com/sitemap-ads.xml`;
  res.type('text/plain');
  res.send(robots);
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:", "https://elocanto.com", "https://*.elocanto.com", "https://cdn.jsdelivr.net", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
        "script-src-elem": ["'self'", "'unsafe-inline'", "data:", "https://elocanto.com", "https://*.elocanto.com", "https://cdn.jsdelivr.net", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
        "script-src-attr": ["'unsafe-inline'"],
        "frame-src": ["'self'", "https://elocanto.com", "https://*.elocanto.com"],
        "connect-src": ["'self'", "data:", "blob:", "https://elocanto.up.railway.app", "https://elocanto.com", "https://*.elocanto.com", "https://www.google-analytics.com", "https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googletagmanager.com"],
        "img-src": ["'self'", "data:", "blob:", "https:", "http:", "https://www.google-analytics.com", "https://www.googletagmanager.com"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        "style-src": ["'self'", "'unsafe-inline'", "data:", "https://fonts.googleapis.com"],
        "worker-src": ["'self'", "blob:", "https://cdn.jsdelivr.net"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(cors());
app.use(compression({
  level: 6, // balanced between CPU and compression ratio
  threshold: 100, // compress objects larger than 100 bytes
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
app.use(express.json());

// Apply Redirect Middleware before everything else
app.use(redirectMiddleware);

// Apply general rate limit to all /api routes except images
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/images')) return next();
  generalRateLimiter(req, res, next);
});

// Serve uploaded files with caching
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '30d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=2592000');
  }
}));

import reportRoutes from './routes/reportRoutes.js';

app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/reports', reportRoutes); // Added reports route
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/seo', seoContentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/views', viewRoutes);
app.use('/images', imageRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/seo-settings', seoSettingsRoutes);
app.use('/api/admin/backup', backupRoutes);

// Serve static assets from the frontend build folder
console.log('[SSR] Serving static frontend from:', frontendDistPath);

// Serve static assets with long-term caching (immutable)
app.use('/assets', express.static(path.join(frontendDistPath, 'assets'), {
  maxAge: '1y',
  immutable: true,
  index: false,
  dotfiles: 'deny',
  setHeaders: (res, filePath) => {
    // Ensure specific MIME types have correct caching
    if (filePath.endsWith('.woff2') || filePath.endsWith('.woff') || filePath.endsWith('.ttf')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    if (filePath.endsWith('.svg') || filePath.endsWith('.png') || filePath.endsWith('.webp')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Serve the favicon and other top-level static files with reasonable caching
app.use(express.static(frontendDistPath, {
  maxAge: '1d',
  etag: true,
  index: false,
  dotfiles: 'deny',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache'); // Always revalidate HTML
    }
  }
}));

const getSettings = async () => {
  const cached = getCache('site_settings');
  if (cached) return cached;
  const settings = await Settings.findOne({}).lean();
  if (settings) setCache('site_settings', settings, 60);

  return settings;
};

// --- SSR SEO SYSTEM ---

/**
 * Normalizes a request path for consistent DB lookup
 */
const normalizePath = (rawPath) => {
  if (!rawPath) return '/';
  let path = rawPath.split('?')[0]; // Remove query params
  path = path.toLowerCase();
  path = path.replace(/\/+$/, ''); // Remove trailing slashes
  if (!path.startsWith('/')) path = '/' + path;
  if (path === '') path = '/';
  return path;
};

/**
 * Resolves SEO metadata from the database based on a normalized path
 */
const getSeoMetadata = async (reqPath) => {
  const normalizedPath = normalizePath(reqPath);
  
  // Performance: Check SEO Cache
  const cacheKey = `seo_meta_${normalizedPath}`;
  const cachedMeta = getCache(cacheKey);
  if (cachedMeta) return cachedMeta;

  console.log(`[SEO-SSR] 🔍 Resolving: "${normalizedPath}"`);

  // ─── LAYER 0: Known static/auth routes (always 200, no DB needed) ───
  const STATIC_ROUTES = new Set([
    '/', '/login', '/register', '/ads', '/about-us', '/contact-us',
    '/terms', '/privacy', '/anti-scam', '/copyright-policy',
    '/dashboard', '/messages', '/post-ad', '/forgot-password', '/profile'
  ]);

  const isAdminRoute = normalizedPath.startsWith('/admin');
  const isMessageRoute = normalizedPath.startsWith('/messages/');
  const isProfileRoute = normalizedPath.startsWith('/profile/');
  const isEditAdRoute = normalizedPath.startsWith('/edit-ad/');

  try {
    let result = null;
    const siteSettings = await getSettings();
    const defaultMeta = {
      title: siteSettings?.siteTitle || 'Elocanto | Classified Marketplace in Pakistan',
      description: siteSettings?.siteDescription || 'Secure destination to buy and sell.',
      keywords: siteSettings?.siteKeywords || '',
      ogTitle: siteSettings?.siteTitle || 'Elocanto',
      ogDescription: siteSettings?.siteDescription || 'Secure destination to buy and sell.',
      url: `https://pk.elocanto.com${normalizedPath}`,
      status: 200
    };

    const runResolution = async () => {
      if (STATIC_ROUTES.has(normalizedPath) || isAdminRoute || isMessageRoute || isProfileRoute || isEditAdRoute) {
        const customSeo = await SeoSettings.findOne({ pagePath: normalizedPath, isActive: true }).lean();
        if (customSeo) {
          return {
            title: customSeo.title,
            description: customSeo.metaDescription,
            keywords: customSeo.keywords || '',
            ogTitle: customSeo.ogTitle || customSeo.title,
            ogDescription: customSeo.ogDescription || customSeo.metaDescription,
            url: `https://pk.elocanto.com${normalizedPath}`,
            status: 200
          };
        }
        return defaultMeta;
      }

      const customSeo = await SeoSettings.findOne({ pagePath: normalizedPath, isActive: true }).lean();
      if (customSeo) {
        return {
          title: customSeo.title,
          description: customSeo.metaDescription,
          keywords: customSeo.keywords || '',
          ogTitle: customSeo.ogTitle || customSeo.title,
          ogDescription: customSeo.ogDescription || customSeo.metaDescription,
          url: `https://pk.elocanto.com${normalizedPath}`,
          status: 200
        };
      }

      if (normalizedPath.startsWith('/ads/')) {
        const slug = normalizedPath.replace('/ads/', '');
        const ad = await Ad.findOne({ slug }).populate('seller category subcategory area hotel').lean();
        if (!ad) return make404(normalizedPath);
        const title = `${ad.title} | PKR ${ad.price?.toLocaleString()} | Elocanto`;
        const desc = ad.description?.substring(0, 160) || `Buy ${ad.title} on Elocanto.`;
        return { title, description: desc, keywords: ad.tags?.join(','), ogTitle: title, ogDescription: desc, image: ad.images?.[0], type: 'ad', entity: ad, url: `https://pk.elocanto.com${normalizedPath}`, status: 200 };
      }

      if (normalizedPath.startsWith('/cities/')) {
        const parts = normalizedPath.split('/').filter(Boolean);
        const citySlug = parts[1];
        const type = parts[2];
        const subSlug = parts[3];

        let city = await City.findOne({ slug: citySlug }).lean();
        if (!city) {
          const areaWithCustom = await Area.findOne({ customCitySlug: citySlug }).populate('city').lean();
          if (areaWithCustom) city = areaWithCustom.city;
          else {
            const hotelWithCustom = await Hotel.findOne({ customCitySlug: citySlug }).populate('city').lean();
            if (hotelWithCustom) city = hotelWithCustom.city;
          }
        }

        if (!city) return make404(normalizedPath);

        if (type === 'areas' && subSlug) {
          const area = await Area.findOne({ slug: subSlug, city: city._id }).lean();
          if (!area) return make404(normalizedPath);
          const entitySeo = await SeoSettings.findOne({ pageType: 'area', referenceId: area._id, isActive: true }).lean();
          const title = entitySeo?.title || `${area.name}, ${city.name} Escorts | Elocanto`;
          return { title, description: entitySeo?.metaDescription || `Verified services in ${area.name}.`, keywords: entitySeo?.keywords, type: 'area', entity: area, url: `https://pk.elocanto.com${normalizedPath}`, status: 200 };
        }

        if (type === 'hotels' && subSlug) {
          const hotel = await Hotel.findOne({ slug: subSlug, city: city._id }).lean();
          if (!hotel) return make404(normalizedPath);
          const entitySeo = await SeoSettings.findOne({ pageType: 'hotel', referenceId: hotel._id, isActive: true }).lean();
          const title = entitySeo?.title || `${hotel.name} Escorts | Elocanto`;
          return { title, description: entitySeo?.metaDescription || `Verified services at ${hotel.name}.`, keywords: entitySeo?.keywords, type: 'hotel', entity: hotel, url: `https://pk.elocanto.com${normalizedPath}`, status: 200 };
        }

        const entitySeo = await SeoSettings.findOne({ pageType: 'city', referenceId: city._id, isActive: true }).lean();
        return { title: entitySeo?.title || `${city.name} Escorts | Elocanto`, description: entitySeo?.metaDescription, type: 'city', entity: city, url: `https://pk.elocanto.com${normalizedPath}`, status: 200 };
      }

      const parts = normalizedPath.split('/').filter(Boolean);
      if (parts.length >= 1 && parts[0] !== 'cities' && parts[0] !== 'ads') {
        const category = await Category.findOne({ slug: parts[0] }).lean();
        if (category) {
          if (parts[1]) {
            const sub = await Subcategory.findOne({ slug: parts[1], category: category._id }).lean();
            if (sub) {
              const entitySeo = await SeoSettings.findOne({ pagePath: normalizedPath, isActive: true }).lean();
              return { title: entitySeo?.title || `${sub.name} in ${category.name}`, description: entitySeo?.metaDescription, url: `https://pk.elocanto.com${normalizedPath}`, status: 200 };
            }
          }
          const entitySeo = await SeoSettings.findOne({ pagePath: normalizedPath, isActive: true }).lean();
          return { title: entitySeo?.title || category.name, description: entitySeo?.metaDescription, url: `https://pk.elocanto.com${normalizedPath}`, status: 200 };
        }
      }

      return make404(normalizedPath);
    };

    result = await runResolution();
    setCache(cacheKey, result, 300); // 5 minutes
    return result;

  } catch (error) {
    console.error('[SEO-SSR] ❌ Resolution Error:', error);
    return { title: 'Elocanto', description: 'Secure destination to buy and sell.', status: 500 };
  }
};

// Helper: Standard 404 response
const make404 = (normalizedPath) => ({
  title: 'Page Not Found | Elocanto',
  description: 'The page you are looking for does not exist or has been moved.',
  keywords: '',
  ogTitle: 'Page Not Found',
  ogDescription: 'The page you are looking for does not exist.',
  url: `https://pk.elocanto.com${normalizedPath}`,
  status: 404
});

// Handle SPA routing with dynamic SEO injection
app.get('*', async (req, res) => {
  // Skip static assets
  const ext = path.extname(req.path);
  if (ext && !ext.match(/\.(html|js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i)) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  // 1. Performance: Check SSR Cache
  const normalizedPath = normalizePath(req.path);
  const cacheKey = `ssr_page_${normalizedPath}`;
  const isAdmin = normalizedPath.startsWith('/admin');
  const isUserPrivate = normalizedPath.startsWith('/messages') || normalizedPath.startsWith('/dashboard') || normalizedPath.startsWith('/profile');

  // We don't cache private/admin routes
  if (!isAdmin && !isUserPrivate) {
    const cachedHtml = getCache(cacheKey);
    if (cachedHtml) {
      console.log(`[SSR] ⚡ Cache Hit: ${normalizedPath}`);
      return res.send(cachedHtml);
    }
  }

  try {
    // --- 1. URL NORMALIZATION (301 REDIRECTS) ---
    // Force lowercase and remove trailing slashes to avoid duplicate content indexing
    if (req.method === 'GET') {
      const hasExtension = req.path.includes('.');
      const hasTrailingSlash = req.path.length > 1 && req.path.endsWith('/');
      const isNotLowercase = req.path !== req.path.toLowerCase();

      // Only normalize if it's not a file (like .png) and not an API call
      if (!hasExtension && !req.path.startsWith('/api') && (hasTrailingSlash || isNotLowercase)) {
        let normalized = req.path.toLowerCase();
        if (normalized.length > 1 && normalized.endsWith('/')) {
          normalized = normalized.slice(0, -1);
        }
        
        // Preserve query string if any
        const queryString = req.url.split('?')[1];
        const destination = normalized + (queryString ? `?${queryString}` : '');

        if (req.path !== normalized) {
          console.log(`[SEO REDIRECT] ${req.url} -> ${destination}`);
          return res.redirect(301, destination);
        }
      }
    }

    const indexPath = path.resolve(frontendDistPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.error(`[SSR] ❌ index.html not found: ${indexPath}`);
      return res.status(404).send('Frontend build not found');
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    // Safety check for DB connection
    if (mongoose.connection.readyState !== 1) {
      console.warn('[SSR] ⏳ Waiting for Database connection...');
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (mongoose.connection.readyState === 1) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }

    const [seo, settings] = await Promise.all([
      getSeoMetadata(req.path),
      getSettings()
    ]);

    const { initialData, contentHtml } = await resolveRouteData(req.path, seo, settings);

    // GA4 Script Injection
    let analyticsScript = '';
    if (settings?.googleAnalyticsId) {
      analyticsScript = `
        <script async src="https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${settings.googleAnalyticsId}', { page_path: window.location.pathname });
        </script>
      `;
    }

    // Resolve og:image — use ad image if available, else fallback to site default
    const ogImage = seo.image
      ? (seo.image.startsWith('http') ? seo.image : `https://pk.elocanto.com${seo.image}`)
      : (settings?.ogImage || 'https://pk.elocanto.com/og-default.jpg');

    // Build SSR JSON-LD Schema for ad pages (Google ko static HTML mein milega)
    let schemaScript = '';
    if (seo.type === 'ad' && seo.entity) {
      const ad = seo.entity;
      const adUrl = `https://pk.elocanto.com${normalizePath(req.path)}`;
      const adImages = Array.isArray(ad.images)
        ? ad.images.map(img => img.startsWith('http') ? img : `https://pk.elocanto.com${img}`)
        : [];

      const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": ad.title,
        "image": adImages,
        "description": ad.description,
        "brand": {
          "@type": "Brand",
          "name": ad.brand || "Generic"
        },
        "offers": {
          "@type": "Offer",
          "url": adUrl,
          "priceCurrency": "PKR",
          "price": ad.price,
          "availability": "https://schema.org/InStock",
          "itemCondition": ad.condition === 'new'
            ? "https://schema.org/NewCondition"
            : "https://schema.org/UsedCondition"
        },
        "seller": {
          "@type": "Person",
          "name": ad.seller?.name,
          "telephone": ad.phone || ad.seller?.phone
        }
      };

      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `What is the price of ${ad.title}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `The price of ${ad.title} in ${ad.city} is PKR ${ad.price?.toLocaleString()}.`
            }
          },
          {
            "@type": "Question",
            "name": `Where is ${ad.title} located?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${ad.title} is located in ${ad.hotel?.name ? ad.hotel.name + ', ' : ''}${ad.area?.name ? ad.area.name + ', ' : ''}${ad.city}, Pakistan.`
            }
          },
          {
            "@type": "Question",
            "name": `How to contact the seller of this ad?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `You can contact the seller directly via WhatsApp or phone at ${ad.phone || ad.seller?.phone}.`
            }
          }
        ]
      };

      // Breadcrumb positions: Home > Category > Subcategory? > City > Area? > Hotel? > Ad
      const breadcrumbItems = [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pk.elocanto.com/" }
      ];
      let pos = 2;
      if (ad.category) {
        breadcrumbItems.push({ "@type": "ListItem", "position": pos++, "name": ad.category.name, "item": `https://pk.elocanto.com/${ad.category.slug}` });
      }
      if (ad.subcategory) {
        breadcrumbItems.push({ "@type": "ListItem", "position": pos++, "name": ad.subcategory.name, "item": `https://pk.elocanto.com/${ad.category?.slug}/${ad.subcategory.slug}` });
      }
      const citySlug = ad.city?.toLowerCase().replace(/\s+/g, '-');
      breadcrumbItems.push({ "@type": "ListItem", "position": pos++, "name": ad.city, "item": `https://pk.elocanto.com/cities/${citySlug}` });
      if (ad.area) {
        breadcrumbItems.push({ "@type": "ListItem", "position": pos++, "name": ad.area.name, "item": `https://pk.elocanto.com/cities/${citySlug}/areas/${ad.area.slug}` });
      }
      if (ad.hotel) {
        breadcrumbItems.push({ "@type": "ListItem", "position": pos++, "name": ad.hotel.name, "item": `https://pk.elocanto.com/cities/${citySlug}/hotels/${ad.hotel.slug}` });
      }
      breadcrumbItems.push({ "@type": "ListItem", "position": pos, "name": ad.title, "item": adUrl });

      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems
      };

      schemaScript = `
        <script type="application/ld+json">${JSON.stringify(productSchema)}</script>
        <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
      `;
    }

    // High Performance Placeholder Replacement
    html = html
      .replace(/{{SEO_TITLE}}/g, seo.title)
      .replace(/{{SEO_DESCRIPTION}}/g, seo.description)
      .replace(/{{SEO_KEYWORDS}}/g, seo.keywords || '')
      .replace(/{{OG_TITLE}}/g, seo.ogTitle || seo.title)
      .replace(/{{OG_DESCRIPTION}}/g, seo.ogDescription || seo.description)
      .replace(/{{OG_IMAGE}}/g, ogImage)
      .replace(/{{CANONICAL_URL}}/g, seo.url)
      .replace(/{{CONTENT}}/g, contentHtml); // Inject SEO HTML into root

    // Inject Initial Data for React Hydration
    const initialDataWithSettings = { ...initialData, settings, seo, path: req.path };
    const initialDataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialDataWithSettings).replace(/</g, '\\u003c')};</script>`;

    const gscMeta = settings?.googleSearchConsoleId ? `<meta name="google-site-verification" content="${settings.googleSearchConsoleId}" />` : '';
    const headerScripts = (analyticsScript + initialDataScript + gscMeta + (settings?.headerScripts || '')).trim();

    if (headerScripts && html.includes('</head>')) {
      html = html.replace('</head>', `${headerScripts}\n  <!-- SSR_DEBUG_V2 -->\n</head>`);
    }

    if (settings?.footerScripts && html.includes('</body>')) {
      html = html.replace('</body>', `${settings.footerScripts}</body>`);
    }

    console.log(`[SSR] 🚀 Served: ${req.path} (${seo.status})`);

    // If 404, inject noindex and prevent caching
    if (seo.status === 404) {
      if (html.includes('</head>')) {
        html = html.replace('</head>', '  <meta name="robots" content="noindex, nofollow" />\n</head>');
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }

    res.status(seo.status || 200).send(html);

    // Performance: Cache successful public responses for 2 minutes
    if ((seo.status || 200) === 200 && !isAdmin && !isUserPrivate) {
      setCache(cacheKey, html, 120); // 120 seconds TTL
    }
  } catch (err) {
    console.error('[SSR] ❌ Panic Error:', err);
    res.status(500).send('An error occurred');
  }
});

// Error Handlers
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Elocanto API running on port ${PORT}`);
});