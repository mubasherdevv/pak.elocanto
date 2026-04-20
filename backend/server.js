import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';
dotenv.config();
console.log('MongoDB URI:', process.env.MONGO_URI);

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
import { getSitemap } from './controllers/sitemapController.js';
import redirectMiddleware from './middleware/redirectMiddleware.js';

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

// Apply Redirect Middleware before everything else
app.use(redirectMiddleware);

// Apply general rate limit to all /api routes except images
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/images')) return next();
  generalRateLimiter(req, res, next);
});

// Serve uploaded files with caching
const __dirname2 = path.resolve();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');
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
  if (settings) setCache('site_settings', settings, 3600);
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
  console.log(`[SEO-SSR] 🔍 Resolving for: "${reqPath}" -> Normalized: "${normalizedPath}"`);

  try {
    // 1. Try to find an exact path match in SeoSettings
    let seo = await SeoSettings.findOne({ pagePath: normalizedPath, isActive: true }).lean();

    if (seo) {
      console.log(`[SEO-SSR] ✅ Match found in DB for: ${normalizedPath}`);
      return {
        title: seo.title,
        description: seo.metaDescription,
        keywords: seo.keywords || '',
        ogTitle: seo.ogTitle || seo.title,
        ogDescription: seo.ogDescription || seo.metaDescription,
        url: `https://pk.elocanto.com${normalizedPath}`,
        status: 200
      };
    }

    // 2. Dynamic Fallback: Use shared resolver logic
    console.log(`[SEO-SSR] ⚠️ No custom SEO. Checking for dynamic fallbacks...`);
    
    // Resolve entity info from path if possible (simplified for SSR)
    const result = await resolveSeoMetadata(normalizedPath);
    
    if (result) {
      console.log(`[SEO-SSR] 📍 Fallback Resolved: ${result.title} (Source: ${result.source})`);
      return {
        title: result.title,
        description: result.metaDescription,
        keywords: result.keywords || '',
        ogTitle: result.ogTitle || result.title,
        ogDescription: result.ogDescription || result.metaDescription,
        url: `https://pk.elocanto.com${normalizedPath}`,
        status: 200
      };
    }

    console.log(`[SEO-SSR] ⚠️ No dynamic fallback found. Using site-wide defaults.`);
    const siteSettings = await getSettings();
    
    return {
      title: siteSettings?.siteTitle || 'Elocanto | Classified Marketplace in Pakistan',
      description: siteSettings?.siteDescription || 'Secure destination to buy and sell.',
      keywords: siteSettings?.siteKeywords || '',
      ogTitle: siteSettings?.siteTitle || 'Elocanto',
      ogDescription: siteSettings?.siteDescription || 'Secure destination to buy and sell.',
      url: `https://pk.elocanto.com${normalizedPath}`,
      status: 200
    };

  } catch (error) {
    console.error('[SEO-SSR] ❌ Resolution Error:', error);
    return {
      title: 'Elocanto',
      description: 'Secure destination to buy and sell.',
      status: 500
    };
  }
};

// Handle SPA routing with dynamic SEO injection
app.get('*', async (req, res) => {
  // Skip static assets
  const ext = path.extname(req.path);
  if (ext && !ext.match(/\.(html|js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i)) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  try {
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

    // High Performance Placeholder Replacement
    html = html
      .replace(/{{SEO_TITLE}}/g, seo.title)
      .replace(/{{SEO_DESCRIPTION}}/g, seo.description)
      .replace(/{{SEO_KEYWORDS}}/g, seo.keywords)
      .replace(/{{OG_TITLE}}/g, seo.ogTitle)
      .replace(/{{OG_DESCRIPTION}}/g, seo.ogDescription)
      .replace(/{{CANONICAL_URL}}/g, seo.url);

    const gscMeta = settings?.googleSearchConsoleId ? `<meta name="google-site-verification" content="${settings.googleSearchConsoleId}" />` : '';
    const headerScripts = (analyticsScript + gscMeta + (settings?.headerScripts || '')).trim();

    if (headerScripts && html.includes('</head>')) {
      html = html.replace('</head>', `${headerScripts}</head>`);
    }
    
    if (settings?.footerScripts && html.includes('</body>')) {
      html = html.replace('</body>', `${settings.footerScripts}</body>`);
    }

    console.log(`[SSR] 🚀 Served: ${req.path} (${seo.status})`);
    res.status(seo.status || 200).setHeader('Cache-Control', 'no-cache').send(html);
    
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


 
