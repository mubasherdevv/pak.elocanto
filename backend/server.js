import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
dotenv.config();
console.log('MongoDB URI:', process.env.MONGO_URI);

import path from 'path';
import fs from 'fs';
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
import Hotel from './models/Hotel.js';
import Category from './models/Category.js';
import Subcategory from './models/Subcategory.js';
import SubSubCategory from './models/SubSubCategory.js';
import Ad from './models/Ad.js';

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
import { getSitemap } from './controllers/sitemapController.js';

await connectDB();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
console.log('Server starting...');

// 1. Immediate Healthcheck (Railway Requirement)
app.get('/api/health', (req, res) => res.status(200).send('OK'));
app.get('/health', (req, res) => res.status(200).send('OK'));

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
// Apply general rate limit to all /api routes except images
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/images')) return next();
  generalRateLimiter(req, res, next);
});

// Serve uploaded files with caching
const __dirname2 = path.resolve();
app.use('/uploads', express.static(path.join(__dirname2, 'uploads'), {
  maxAge: '30d',
  etag: true,
  lastModified: true,
  dotfiles: 'deny',
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.includes('.cache')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// API Routes
app.get('/sitemap.xml', getSitemap);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/ads', adRoutes);
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

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname2, '../frontend/dist');
  console.log('Production mode: Serving static frontend from:', frontendDistPath);

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
    if (settings) setCache('site_settings', settings, 3600);
    return settings;
  };

// Valid Static Frontend Routes (Non-Dynamic)
const VALID_STATIC_ROUTES = [
  '/', '/ads', '/login', '/register', '/forgot-password', 
  '/post-ad', '/dashboard', '/profile', '/messages', '/admin',
  '/admin/ads', '/admin/users', '/admin/categories', '/admin/cities',
  '/admin/reports', '/admin/settings', '/admin/seo', '/admin/titles-seo'
];

/**
 * Resolves SEO metadata by analyzing URL path and querying database
 */
const resolveSeoMetadata = async (urlPath) => {
  try {
    // 1. Get Global Defaults
    const settings = await getSettings();
    const siteName = settings?.siteName || 'Elocanto.pk';
    const defaultTitle = settings?.defaultMetaTitle || `${siteName} | Marketplace`;
    const defaultDesc = settings?.defaultMetaDescription || 'Secure destination to buy and sell.';
    const defaultKeywords = settings?.defaultKeywords || '';

    // 2. Determine Context & Check Validity
    let context = { type: 'home', id: 'home', refId: null };
    let isValidRoute = false;

    // Static Whitelist
    if (VALID_STATIC_ROUTES.includes(urlPath) || urlPath.startsWith('/profile/') || urlPath.startsWith('/edit-ad/') || urlPath.startsWith('/messages/')) {
      isValidRoute = true;
    }

    // Dynamic Analysis
    const segments = urlPath.split('/').filter(Boolean);
    
    if (urlPath === '/' || urlPath === '') {
      context = { type: 'home', id: 'home' };
      isValidRoute = true;
    } else if (urlPath === '/ads') {
      context = { type: 'ads-listing', id: 'ads' };
      isValidRoute = true;
    } else if (urlPath.startsWith('/ads/')) {
      const slug = segments[1];
      const ad = await Ad.findOne({ slug, isActive: true }).select('_id').lean();
      if (ad) {
        context = { type: 'ad', id: slug, refId: ad._id };
        isValidRoute = true;
      }
    } else if (urlPath.startsWith('/cities/')) {
      const citySlug = segments[1];
      const city = await City.findOne({ slug: citySlug }).lean();
      if (city) {
        context = { type: 'city', id: citySlug, refId: city._id };
        isValidRoute = true;
      }
    } else if (segments.length > 0) {
      if (!isValidRoute) {
        // Find the most specific match by checking segments from specific to general
        const lastSegment = segments[segments.length - 1];
        
        // 1. Check Sub-Subcategory
        const subSubCat = await SubSubCategory.findOne({ slug: lastSegment, isActive: true }).lean();
        if (subSubCat) {
          context = { type: 'category', id: lastSegment, refId: subSubCat._id };
          isValidRoute = true;
        } else {
          // 2. Check Subcategory
          const subCat = await Subcategory.findOne({ slug: lastSegment, isActive: true }).lean();
          if (subCat) {
            context = { type: 'category', id: lastSegment, refId: subCat._id };
            isValidRoute = true;
          } else {
            // 3. Check Category
            const cat = await Category.findOne({ slug: lastSegment, isActive: true }).lean();
            if (cat) {
              context = { type: 'category', id: lastSegment, refId: cat._id };
              isValidRoute = true;
            }
          }
        }
      }
    }

    // 3. Check Cache
    const cacheKey = `seo_v2_${urlPath.replace(/\//g, '_')}`;
    const cachedSeo = getCache(cacheKey);
    if (cachedSeo) return { ...cachedSeo, status: isValidRoute ? 200 : 404 };

    // 4. Fetch Custom SEO Settings
    const seo = await SeoSettings.findOne({ 
      pageType: context.type, 
      referenceId: context.refId,
      isActive: true 
    }).lean();

    const result = {
      title: seo?.title?.replace('{name}', context.id || '') || defaultTitle,
      description: seo?.metaDescription || defaultDesc,
      keywords: seo?.keywords || defaultKeywords,
      url: `https://pk.elocanto.com${urlPath}`
    };

    setCache(cacheKey, result, 1800);
    return { ...result, status: isValidRoute ? 200 : 404 };
  } catch (error) {
    console.error('SEO Resolve Error:', error);
    return { title: 'Marketplace', status: 200 };
  }
};

// Handle SPA routing with dynamic SEO injection
app.get('*', async (req, res) => {
  // If the request is for a file that DOES NOT exist (has an extension), return 404
  const ext = path.extname(req.path);
  if (ext && !ext.match(/\.(html|js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i)) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  try {
    const indexPath = path.resolve(frontendDistPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('Frontend build not found');
    }

    let html = fs.readFileSync(indexPath, 'utf8');
    const seo = await resolveSeoMetadata(req.path);
    const settings = await getSettings();

    // GA4 Script Injection
    let analyticsScript = '';
    if (settings?.googleAnalyticsId) {
      analyticsScript = `
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${settings.googleAnalyticsId}', {
            page_path: window.location.pathname,
          });
        </script>
      `;
    }

    // Replace placeholders with dynamic data
    html = html
      .replace(/Elocanto \| Classified Marketplace in Pakistan/g, seo.title || 'Elocanto.pk')
      .replace(/Elocanto\.pk is the most secure destination to buy, sell, and discover premium items across Pakistan\./g, seo.description || 'Classified Marketplace')
      .replace(/classifieds, pakistan, buy and sell, marketplace, lahore, karachi, islamabad/g, seo.keywords || '')
      .replace(/__CANONICAL_URL__/g, seo.url || 'https://pk.elocanto.com');

    // Inject Analytics, GSC and Header Scripts
    const gscMeta = settings?.googleSearchConsoleId 
      ? `<meta name="google-site-verification" content="${settings.googleSearchConsoleId}" />` 
      : '';
      
    const headerContent = (analyticsScript + gscMeta + (settings?.headerScripts || '')).trim();
    if (headerContent) {
      html = html.replace('</head>', `${headerContent}</head>`);
    }

    // Inject Footer Scripts
    if (settings?.footerScripts) {
      html = html.replace('</body>', `${settings.footerScripts}</body>`);
    }

    res.status(seo.status || 200);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(html);
  } catch (err) {
    console.error('Server error during HTML generation:', err);
    res.status(500).send('An error occurred');
  }
});
} else {
  console.log('Development mode: Frontend serving disabled via backend.');
}

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
  console.log(`OLX Marketplace API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});


