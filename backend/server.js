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

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:", "https://elocanto.com", "https://*.elocanto.com", "https://cdn.jsdelivr.net"],
        "script-src-elem": ["'self'", "'unsafe-inline'", "data:", "https://elocanto.com", "https://*.elocanto.com", "https://cdn.jsdelivr.net"],
        "script-src-attr": ["'unsafe-inline'"],
        "frame-src": ["'self'", "https://elocanto.com", "https://*.elocanto.com"],
        "connect-src": ["'self'", "data:", "blob:", "https://elocanto.up.railway.app", "https://elocanto.com", "https://*.elocanto.com"],
        "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
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

  // Helper to resolve SEO for server-side injection
  const resolveSeoMetadata = async (urlPath) => {
    try {
      // 1. Get Global Defaults (with Caching)
      const settings = await getSettings(); // This uses the optimized version with caching
      const siteName = settings?.siteName || 'Elocanto.pk';
      const defaultTitle = settings?.defaultMetaTitle || `${siteName} | Classified Marketplace`;
      const defaultDesc = settings?.defaultMetaDescription || 'Buy and sell locally on Elocanto.';
      const defaultKeywords = settings?.defaultKeywords || '';

      const cacheKey = `seo_${urlPath.replace(/\//g, '_')}`;
      const cachedSeo = getCache(cacheKey);
      if (cachedSeo) return cachedSeo;

      let context = { pageType: 'homepage', referenceId: null };

      // 2. Determine Context based on URL
      if (urlPath === '/' || urlPath === '') {
        context = { pageType: 'homepage', referenceId: null };
      } else if (urlPath.startsWith('/ads')) {
        context = { pageType: 'ads', referenceId: null };
      } else if (urlPath.startsWith('/cities/')) {
        const segments = urlPath.split('/').filter(Boolean);
        const citySlug = segments[1];

        if (segments.length === 2) {
          const city = await City.findOne({ slug: citySlug }).lean();
          if (city) context = { pageType: 'city', referenceId: city._id };
        } else if (segments.length === 4) {
          if (segments[2] === 'areas') {
            const area = await Area.findOne({ slug: segments[3] }).lean();
            if (area) context = { pageType: 'area', referenceId: area._id };
          } else if (segments[2] === 'hotels') {
            const hotel = await Hotel.findOne({ slug: segments[3] }).lean();
            if (hotel) context = { pageType: 'hotel', referenceId: hotel._id };
          }
        } else if (segments.length === 3 && segments[2] === 'hotels') {
          const city = await City.findOne({ slug: citySlug }).lean();
          if (city) context = { pageType: 'city', referenceId: city._id };
        }
      } else if (urlPath.startsWith('/ads/')) {
        const segments = urlPath.split('/').filter(Boolean);
        // Pattern: /ads/:slug
        if (segments.length === 2) {
          const identifier = segments[1];
          let ad = await Ad.findOne({ slug: identifier }).lean();
          
          if (!ad && identifier.match(/^[0-9a-fA-F]{24}$/)) {
            ad = await Ad.findById(identifier).lean();
          }
          
          if (!ad && identifier.includes('-')) {
            const parts = identifier.split('-');
            const potentialId = parts[parts.length - 1];
            if (potentialId.match(/^[0-9a-fA-F]{24}$/)) {
              ad = await Ad.findById(potentialId).lean();
            }
          }

          if (ad) {
            return {
              title: `${ad.title} - PKR ${ad.price?.toLocaleString()} | ${siteName}`,
              description: ad.description?.substring(0, 160) || defaultDesc,
              keywords: ad.tags?.join(', ') || defaultKeywords,
              url: `https://pk.elocanto.com${urlPath}`
            };
          }
        }
      } else {
        const segments = urlPath.split('/').filter(Boolean);
        if (segments.length === 1) {
          const category = await Category.findOne({ slug: segments[0] }).lean();
          if (category) context = { pageType: 'category', referenceId: category._id };
        } else if (segments.length === 2 && !urlPath.startsWith('/cities')) {
          const subcategory = await Subcategory.findOne({ slug: segments[1] }).lean();
          if (subcategory) context = { pageType: 'category', referenceId: subcategory._id };
        } else if (segments.length === 3 && !urlPath.startsWith('/cities')) {
          const subsub = await SubSubCategory.findOne({ slug: segments[2] }).lean();
          if (subsub) context = { pageType: 'category', referenceId: subsub._id };
        } else if (segments.length === 4 && !urlPath.startsWith('/cities')) {
          // Alternative Ad pattern: /cat/sub/subsub/slug-id
          const identifier = segments[3];
          let ad = await Ad.findOne({ slug: identifier }).lean();
          if (!ad && identifier.includes('-')) {
            const parts = identifier.split('-');
            const potentialId = parts[parts.length - 1];
            if (potentialId.match(/^[0-9a-fA-F]{24}$/)) ad = await Ad.findById(potentialId).lean();
          }
          if (ad) {
            return {
              title: `${ad.title} - PKR ${ad.price?.toLocaleString()} | ${siteName}`,
              description: ad.description?.substring(0, 160) || defaultDesc,
              keywords: ad.tags?.join(', ') || defaultKeywords,
              url: `https://pk.elocanto.com${urlPath}`
            };
          }
        }
      }

      // 3. Fetch from SeoSettings
      const seo = await SeoSettings.findOne({ 
        pageType: context.pageType, 
        referenceId: context.referenceId, 
        isActive: true 
      }).lean();

      const result = seo ? {
        title: seo.title,
        description: seo.metaDescription,
        keywords: seo.keywords || defaultKeywords,
        url: `https://pk.elocanto.com${urlPath}`
      } : {
        title: defaultTitle,
        description: defaultDesc,
        keywords: defaultKeywords,
        url: `https://pk.elocanto.com${urlPath}`
      };

      setCache(cacheKey, result, 1800); // 30 min cache
      return result;
    } catch (error) {
      console.error('SSR SEO Error:', error);
      const defaults = await Settings.findOne({}).lean();
      return { 
        title: defaults?.siteName || 'Elocanto.pk', 
        description: 'Classified Marketplace', 
        keywords: '', 
        url: 'https://pk.elocanto.com' 
      };
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
        return res.sendFile(indexPath); // Fallback to standard behavior if file missing
      }

      let html = fs.readFileSync(indexPath, 'utf8');
      const seo = await resolveSeoMetadata(req.path);

      // Replace placeholders with dynamic data
      html = html
        .replace(/Elocanto \| Classified Marketplace in Pakistan/g, seo.title || 'Elocanto.pk')
        .replace(/Elocanto\.pk is the most secure destination to buy, sell, and discover premium items across Pakistan\./g, seo.description || 'Classified Marketplace')
        .replace(/classifieds, pakistan, buy and sell, marketplace, lahore, karachi, islamabad/g, seo.keywords || '')
        .replace(/https:\/\/pk\.elocanto\.com/g, seo.url || 'https://pk.elocanto.com');

      res.setHeader('Cache-Control', 'no-cache');
      res.send(html);
    } catch (err) {
      console.error('HTML Injection Error:', err);
      res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    }
  });
} else {
  console.log('Development mode: Frontend serving disabled via backend.');
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'OLX Marketplace API is running' });
  });
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


