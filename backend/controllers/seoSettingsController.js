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
    res.status(500).json({ message: error.message });
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

// @desc    Fetch SEO by specific URL path (New Frontend/SSR)
// @route   GET /api/seo-settings/path?path=/example
export const getSeoByPath = async (req, res) => {
  try {
    const { path: rawPath } = req.query;
    if (!rawPath) return res.status(400).json({ message: 'Path is required' });

    const normalizedPath = normalizePath(rawPath);
    const seo = await SeoSettings.findOne({ pagePath: normalizedPath, isActive: true });
    
    if (seo) return res.json(seo);
    res.status(404).json({ message: 'No SEO found for this path' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch SEO by Type/Ref (Legacy Frontend compatibility)
// @route   GET /api/seo-settings/public?pageType=home
export const getSeoSettings = async (req, res) => {
  try {
    const { pageType, referenceId } = req.query;
    let query = { pageType, isActive: true };
    
    if (!referenceId || referenceId === 'null' || referenceId === 'undefined') {
      query.referenceId = null;
    } else {
      query.referenceId = referenceId;
    }

    let settings = await SeoSettings.findOne(query);

    // Fallback if specific ref not found
    if (!settings && referenceId && referenceId !== 'null') {
      settings = await SeoSettings.findOne({ pageType, referenceId: null, isActive: true });
    }

    if (settings) return res.json(settings);
    res.status(404).json({ message: 'Not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
