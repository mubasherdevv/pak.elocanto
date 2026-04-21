import mongoose from 'mongoose';
import SeoSettings from '../models/SeoSettings.js';
import City from '../models/City.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import SubSubCategory from '../models/SubSubCategory.js';
import Ad from '../models/Ad.js';
import Area from '../models/Area.js';
import Hotel from '../models/Hotel.js';
import { flushCache } from '../utils/cache.js';

/**
 * Normalizes a URL path for lookup
 */
const normalizePath = (rawPath) => {
  if (!rawPath) return '/';
  let path = rawPath.split('?')[0].toLowerCase().replace(/\/+$/, '');
  if (!path.startsWith('/')) path = '/' + path;
  if (path === '') path = '/';
  return path;
};

/**
 * Resolves the absolute URL path for a given SEO record type and reference
 */
const resolvePathForRecord = async (pageType, referenceId) => {
  let path = '/';
  
  const ensureCitySuffix = (slug) => {
    if (!slug) return '';
    return slug.endsWith('-call-girls-service') ? slug : `${slug}-call-girls-service`;
  };

  try {
    if (pageType === 'home') path = '/';
    else if (pageType === 'ads') path = '/ads';
    else if (pageType === 'city' && referenceId) {
      const city = await City.findById(referenceId);
      if (city) path = `/cities/${ensureCitySuffix(city.slug)}`;
    } else if (pageType === 'category' && referenceId) {
      // Direct category/subcategory/subsubcategory path
      const subsub = await SubSubCategory.findById(referenceId);
      if (subsub) path = `/${subsub.slug}`;
      else {
        const sub = await Subcategory.findById(referenceId);
        if (sub) path = `/${sub.slug}`;
        else {
          const cat = await Category.findById(referenceId);
          if (cat) path = `/${cat.slug}`;
        }
      }
    } else if (pageType === 'ad' && referenceId) {
      const ad = await Ad.findById(referenceId);
      if (ad) path = `/ads/${ad.slug}`;
    } else if (pageType === 'area' && referenceId) {
      const area = await Area.findById(referenceId).populate('city');
      if (area && area.city) {
        path = `/cities/${ensureCitySuffix(area.city.slug)}/areas/${area.slug}`;
      } else if (area) {
        path = `/areas/${area.slug}`;
      }
    } else if (pageType === 'hotel' && referenceId) {
      const hotel = await Hotel.findById(referenceId).populate('city');
      if (hotel && hotel.city) {
        path = `/cities/${ensureCitySuffix(hotel.city.slug)}/hotels/${hotel.slug}`;
      } else if (hotel) {
        path = `/hotels/${hotel.slug}`;
      }
    }
  } catch (e) {
    console.error('[SEO-PATH-RESOLVE] Error:', e);
  }
  return normalizePath(path);
};

// @desc    Get all SEO settings
// @route   GET /api/seo-settings
export const getAllSeoSettings = async (req, res) => {
  try {
    const settings = await SeoSettings.find().sort({ createdAt: -1 });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get SEO setting by ID
// @route   GET /api/seo-settings/:id
export const getSeoSettingById = async (req, res) => {
  try {
    const setting = await SeoSettings.findById(req.params.id);
    if (!setting) return res.status(404).json({ message: 'Not found' });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save/Update SEO Settings (includes path auto-generation)
// @route   POST /api/seo-settings
export const saveSeoSettings = async (req, res) => {
  try {
    const { 
      pageType, 
      referenceId, 
      title, 
      metaDescription, 
      keywords, 
      ogTitle, 
      ogDescription,
      whatsappNumber,
      isActive 
    } = req.body;

    const pagePath = await resolvePathForRecord(pageType, referenceId);
    
    // Check if record exists for this unique combination
    let setting = await SeoSettings.findOne({ pageType, referenceId });

    if (setting) {
      setting.title = title;
      setting.metaDescription = metaDescription;
      setting.keywords = keywords;
      setting.ogTitle = ogTitle || title;
      setting.ogDescription = ogDescription || metaDescription;
      setting.whatsappNumber = whatsappNumber || '';
      setting.pagePath = pagePath;
      setting.isActive = isActive !== undefined ? isActive : true;
      await setting.save();
    } else {
      setting = new SeoSettings({
        pageType,
        referenceId,
        title,
        metaDescription,
        keywords,
        ogTitle: ogTitle || title,
        ogDescription: ogDescription || metaDescription,
        whatsappNumber: whatsappNumber || '',
        pagePath,
        isActive: isActive !== undefined ? isActive : true
      });
      await setting.save();
    }

    if (typeof flushCache === 'function') flushCache();
    res.status(200).json(setting);
  } catch (error) {
    console.error('[SEO-SAVE] Error:', error);
  }
};

// --- SHARED SSR & API LOGIC ---

/**
 * Common SEO Resolver logic used by both SSR (server.js) and API (getPublicSeo)
 */
export const resolveSeoMetadata = async (normalizedPath, pageType = null, referenceId = null) => {
  try {
    // 1. Try Path Match (Most specific)
    let seo = await SeoSettings.findOne({ pagePath: normalizedPath, isActive: true }).lean();

    // 2. Try Entity Match (If path didn't work)
    if (!seo && pageType && referenceId && referenceId !== 'null' && referenceId !== 'undefined') {
      seo = await SeoSettings.findOne({ pageType, referenceId, isActive: true }).lean();
    }

    if (seo) {
      return {
        title: seo.title,
        metaDescription: seo.metaDescription,
        keywords: seo.keywords || '',
        ogTitle: seo.ogTitle || seo.title,
        ogDescription: seo.ogDescription || seo.metaDescription,
        whatsappNumber: seo.whatsappNumber || '',
        isActive: true,
        source: 'custom',
        image: seo.ogImage || null
      };
    }

    // 3. Dynamic Fallback: Match based on URL patterns
    
    // Ad Detail Pattern: /ads/:slug
    if (normalizedPath.startsWith('/ads/') && normalizedPath.split('/').length === 3) {
      const slug = normalizedPath.split('/')[2];
      const ad = await Ad.findOne({ slug })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('subSubCategory', 'name slug')
        .lean();
        
      if (ad) {
        // Try to find custom SEO for this specific ad entity
        const entitySeo = await SeoSettings.findOne({ pageType: 'ad', referenceId: ad._id, isActive: true }).lean();
        if (entitySeo) {
          return {
            title: entitySeo.title,
            metaDescription: entitySeo.metaDescription,
            keywords: entitySeo.keywords || '',
            ogTitle: entitySeo.ogTitle || entitySeo.title,
            ogDescription: entitySeo.ogDescription || entitySeo.metaDescription,
            whatsappNumber: entitySeo.whatsappNumber || '',
            image: entitySeo.ogImage || (ad.images && ad.images.length > 0 ? ad.images[0] : null),
            isActive: true,
            source: 'custom-ad',
            entity: ad,
            type: 'ad'
          };
        }

        const image = ad.images && ad.images.length > 0 ? ad.images[0] : null;
        return {
          title: `${ad.title} - PKR ${ad.price?.toLocaleString()} in ${ad.city} | Elocanto`,
          metaDescription: `Check out this ${ad.title} for PKR ${ad.price?.toLocaleString()} in ${ad.city}. ${ad.description?.substring(0, 160)}`,
          ogTitle: `${ad.title} - PKR ${ad.price?.toLocaleString()} in ${ad.city}`,
          ogDescription: `Check out this ${ad.title} for PKR ${ad.price?.toLocaleString()} in ${ad.city}.`,
          keywords: '',
          isActive: true,
          source: 'dynamic-ad',
          image: image,
          entity: ad,
          type: 'ad'
        };
      }
    }

    // City Pattern: /cities/:slug
    if (normalizedPath.startsWith('/cities/') && normalizedPath.split('/').length === 3) {
      const slug = normalizedPath.split('/')[2];
      const city = await City.findOne({ slug }).lean();
      if (city) {
        // Try to find custom SEO for this specific city entity (Fixes the Lahore "City Listings" issue)
        const entitySeo = await SeoSettings.findOne({ pageType: 'city', referenceId: city._id, isActive: true }).lean();
        if (entitySeo) {
          return {
            title: entitySeo.title,
            metaDescription: entitySeo.metaDescription,
            keywords: entitySeo.keywords || '',
            ogTitle: entitySeo.ogTitle || entitySeo.title,
            ogDescription: entitySeo.ogDescription || entitySeo.metaDescription,
            whatsappNumber: entitySeo.whatsappNumber || '',
            isActive: true,
            source: 'custom-city',
            type: 'city',
            entity: city,
            image: entitySeo.ogImage || null
          };
        }

        const entityCount = await Ad.countDocuments({ city: city.name, isApproved: true, isActive: true });
        return {
          title: `${city.name} Escorts & Call Girls Service 24/7 | Elocanto`,
          metaDescription: `Premium call girls and escort services in ${city.name}. Reliable and verified listings.`,
          keywords: `${city.name} escorts, ${city.name} call girls`,
          isActive: true,
          source: 'dynamic-city',
          type: 'city',
          entity: city,
          entityCount
        };
      }
    }

    // Area/Hotel Pattern: /cities/:citySlug/areas/:areaSlug OR /cities/:citySlug/hotels/:hotelSlug
    const parts = normalizedPath.split('/');
    if (parts.length === 5 && parts[1] === 'cities') {
      const type = parts[3];
      const slug = parts[4];
      
      if (type === 'areas') {
        const area = await Area.findOne({ slug }).lean();
        if (area) {
          const entitySeo = await SeoSettings.findOne({ pageType: 'area', referenceId: area._id, isActive: true }).lean();
          if (entitySeo) {
            return {
              title: entitySeo.title,
              metaDescription: entitySeo.metaDescription,
              keywords: entitySeo.keywords || '',
              ogTitle: entitySeo.ogTitle || entitySeo.title,
              ogDescription: entitySeo.ogDescription || entitySeo.metaDescription,
              whatsappNumber: entitySeo.whatsappNumber || '',
              isActive: true,
              type: 'area',
              entity: area,
              source: 'custom-area'
            };
          }

          const entityCount = await Ad.countDocuments({ area: area._id, isApproved: true, isActive: true });
          return {
            title: `${area.name} Escorts - Call Girls Service in ${area.name} | Elocanto`,
            metaDescription: `Find top-rated call girls and independent escorts in ${area.name}.`,
            keywords: `${area.name} escorts`,
            isActive: true,
            source: 'dynamic-area',
            type: 'area',
            entity: area,
            entityCount
          };
        }
      } else if (type === 'hotels') {
        const hotel = await Hotel.findOne({ slug }).lean();
        if (hotel) {
          const entitySeo = await SeoSettings.findOne({ pageType: 'hotel', referenceId: hotel._id, isActive: true }).lean();
          if (entitySeo) {
            return {
              title: entitySeo.title,
              metaDescription: entitySeo.metaDescription,
              keywords: entitySeo.keywords || '',
              ogTitle: entitySeo.ogTitle || entitySeo.title,
              ogDescription: entitySeo.ogDescription || entitySeo.metaDescription,
              whatsappNumber: entitySeo.whatsappNumber || '',
              isActive: true,
              type: 'hotel',
              entity: hotel,
              source: 'custom-hotel'
            };
          }

          const entityCount = await Ad.countDocuments({ hotel: hotel._id, isApproved: true, isActive: true });
          return {
            title: `${hotel.name} Escorts - Exclusive Call Girls Service | Elocanto`,
            metaDescription: `Verified escorts and call girls services available at ${hotel.name}.`,
            keywords: `${hotel.name} escorts`,
            isActive: true,
            source: 'dynamic-hotel',
            type: 'hotel',
            entity: hotel,
            entityCount
          };
        }
      }
    }

    return null; // Let the caller decide the final site-wide fallback
  } catch (error) {
    console.error('[SEO-RESOLVE] Error:', error);
    return null;
  }
};

// @desc    Delete SEO setting
// @route   DELETE /api/seo-settings/:id
export const deleteSeoSetting = async (req, res) => {
  try {
    const setting = await SeoSettings.findById(req.params.id);
    if (!setting) return res.status(404).json({ message: 'Not found' });

    await setting.deleteOne();
    if (typeof flushCache === 'function') flushCache();
    res.json({ message: 'SEO setting removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch SEO by specific URL path (Universal Endpoint)
// @route   GET /api/seo-settings/public
export const getPublicSeo = async (req, res) => {
  try {
    const { pagePath, pageType, referenceId } = req.query;
    
    // Normalize path just like SSR
    let normalizedPath = '/';
    if (pagePath) {
      normalizedPath = pagePath.split('?')[0].toLowerCase().replace(/\/+$/, '');
      if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;
      if (normalizedPath === '') normalizedPath = '/';
    }

    const result = await resolveSeoMetadata(normalizedPath, pageType, referenceId);
    
    if (result) return res.json(result);
    res.status(404).json({ message: 'No SEO found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy alias for compatibility
export const getSeoSettings = getPublicSeo;
export const getSeoByPath = getPublicSeo;

export default { 
  getSeoSettings, 
  getSeoSettingById, 
  saveSeoSettings, 
  deleteSeoSetting, 
  getPublicSeo, 
  resolveSeoMetadata 
};
