import Ad from '../models/Ad.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import SubSubCategory from '../models/SubSubCategory.js';
import City from '../models/City.js';
import Area from '../models/Area.js';
import Hotel from '../models/Hotel.js';
import { getCache, setCache } from '../utils/cache.js';

const BASE_URL = process.env.SITE_URL || 'https://pk.elocanto.com';

// Helper to escape XML special characters
const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Helper to format date
const formatDate = (date) => {
  if (!date) return '';
  try {
    return `<lastmod>${new Date(date).toISOString().split('T')[0]}</lastmod>`;
  } catch (e) {
    return '';
  }
};

/**
 * Sitemap Index: Lists all sub-sitemaps
 */
export const getSitemapIndex = async (req, res) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap-categories.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-cities.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-areas.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-hotels.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-ads.xml</loc></sitemap>
</sitemapindex>`;

  res.type('application/xml');
  res.status(200).send(xml);
};


/**
 * Categories Sitemap
 */
export const getCategoriesSitemap = async (req, res) => {
  const CACHE_KEY = 'sitemap_categories_xml';
  const cached = getCache(CACHE_KEY);
  if (cached) {
    res.type('application/xml');
    return res.status(200).send(cached);
  }

  const [categories, subcategories, subSubCats] = await Promise.all([
    Category.find({ isActive: true }).select('slug updatedAt').lean(),
    Subcategory.find({ isActive: true }).populate('category', 'slug').select('slug updatedAt category').lean(),
    SubSubCategory.find({ isActive: true }).populate({
      path: 'subcategory',
      populate: { path: 'category', select: 'slug' }
    }).select('slug updatedAt subcategory').lean(),
  ]);

  const urls = [];
  categories.forEach(cat => {
    if (cat.slug) urls.push(`  <url><loc>${BASE_URL}/${escapeXml(cat.slug)}</loc>${formatDate(cat.updatedAt)}</url>`);
  });
  subcategories.forEach(sub => {
    if (sub.category?.slug && sub.slug) urls.push(`  <url><loc>${BASE_URL}/${escapeXml(sub.category.slug)}/${escapeXml(sub.slug)}</loc>${formatDate(sub.updatedAt)}</url>`);
  });
  subSubCats.forEach(ss => {
    if (ss.subcategory?.category?.slug && ss.subcategory?.slug && ss.slug) urls.push(`  <url><loc>${BASE_URL}/${escapeXml(ss.subcategory.category.slug)}/${escapeXml(ss.subcategory.slug)}/${escapeXml(ss.slug)}</loc>${formatDate(ss.updatedAt)}</url>`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  setCache(CACHE_KEY, xml, 3600);
  res.type('application/xml');
  res.status(200).send(xml);
};

/**
 * Cities Sitemap
 */
export const getCitiesSitemap = async (req, res) => {
  const CACHE_KEY = 'sitemap_cities_xml';
  const cached = getCache(CACHE_KEY);
  if (cached) {
    res.type('application/xml');
    return res.status(200).send(cached);
  }

  const cities = await City.find().select('slug updatedAt').lean();
  const urls = [];
  cities.forEach(city => {
    if (city.slug) {
      urls.push(`  <url><loc>${BASE_URL}/cities/${escapeXml(city.slug)}</loc>${formatDate(city.updatedAt)}</url>`);
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  setCache(CACHE_KEY, xml, 3600);
  res.type('application/xml');
  res.status(200).send(xml);
};

/**
 * Areas Sitemap
 */
export const getAreasSitemap = async (req, res) => {
  const CACHE_KEY = 'sitemap_areas_xml';
  const cached = getCache(CACHE_KEY);
  if (cached) {
    res.type('application/xml');
    return res.status(200).send(cached);
  }

  const areas = await Area.find({ isActive: true }).populate('city', 'slug').select('slug updatedAt city').lean();
  const urls = [];
  areas.forEach(area => {
    if (area.city?.slug && area.slug) {
      urls.push(`  <url><loc>${BASE_URL}/cities/${escapeXml(area.city.slug)}/areas/${escapeXml(area.slug)}</loc>${formatDate(area.updatedAt)}</url>`);
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  setCache(CACHE_KEY, xml, 3600);
  res.type('application/xml');
  res.status(200).send(xml);
};

/**
 * Hotels Sitemap
 */
export const getHotelsSitemap = async (req, res) => {
  const CACHE_KEY = 'sitemap_hotels_xml';
  const cached = getCache(CACHE_KEY);
  if (cached) {
    res.type('application/xml');
    return res.status(200).send(cached);
  }

  const hotels = await Hotel.find({ isActive: true }).populate('city', 'slug').select('slug updatedAt city').lean();
  const urls = [];
  hotels.forEach(hotel => {
    if (hotel.city?.slug && hotel.slug) {
      urls.push(`  <url><loc>${BASE_URL}/cities/${escapeXml(hotel.city.slug)}/hotels/${escapeXml(hotel.slug)}</loc>${formatDate(hotel.updatedAt)}</url>`);
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  setCache(CACHE_KEY, xml, 3600);
  res.type('application/xml');
  res.status(200).send(xml);
};

/**
 * Ads Sitemap
 */
export const getAdsSitemap = async (req, res) => {
  const CACHE_KEY = 'sitemap_ads_xml';
  const cached = getCache(CACHE_KEY);
  if (cached) {
    res.type('application/xml');
    return res.status(200).send(cached);
  }

  // Fetch only the last 10,000 ads for the main ads sitemap to keep it efficient
  const ads = await Ad.find({ isApproved: true, isActive: true })
    .populate('category', 'slug')
    .populate('subcategory', 'slug')
    .populate('subSubCategory', 'slug')
    .sort({ createdAt: -1 })
    .limit(10000)
    .select('slug updatedAt category subcategory subSubCategory')
    .lean();

  const urls = [];
  ads.forEach(ad => {
    const slug = ad.slug;
    if (slug) {
      let path = '';
      if (ad.category?.slug && ad.subcategory?.slug && ad.subSubCategory?.slug) {
        path = `/${ad.category.slug}/${ad.subcategory.slug}/${ad.subSubCategory.slug}/${slug}`;
      } else if (ad.category?.slug && ad.subcategory?.slug) {
        path = `/${ad.category.slug}/${ad.subcategory.slug}/${slug}`;
      } else if (ad.category?.slug) {
        path = `/${ad.category.slug}/${slug}`;
      } else {
        path = `/ads/${slug}`;
      }
      urls.push(`  <url><loc>${BASE_URL}${escapeXml(path)}</loc>${formatDate(ad.updatedAt)}</url>`);
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  setCache(CACHE_KEY, xml, 3600);
  res.type('application/xml');
  res.status(200).send(xml);
};
