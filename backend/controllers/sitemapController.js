import Ad from '../models/Ad.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import SubSubCategory from '../models/SubSubCategory.js';
import City from '../models/City.js';
import Area from '../models/Area.js';
import Hotel from '../models/Hotel.js';

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

export const getSitemap = async (req, res) => {
  try {
    const BASE_URL = process.env.SITE_URL || 'https://pk.elocanto.com';

    // Fetch all levels of hierarchy (only necessary fields)
    const [categories, subcategories, subSubCats, cities, areas, hotels, ads] = await Promise.all([
      Category.find({ isActive: true }).select('slug').lean(),
      Subcategory.find({ isActive: true }).populate('category', 'slug').select('slug').lean(),
      SubSubCategory.find({ isActive: true }).populate({
        path: 'subcategory',
        populate: { path: 'category', select: 'slug' }
      }).select('slug').lean(),
      City.find().select('slug').lean(),
      Area.find({ isActive: true }).populate('city', 'slug').select('slug').lean(),
      Hotel.find({ isActive: true }).populate('city', 'slug').select('slug').lean(),
      Ad.find({ isApproved: true, isActive: true }).select('slug updatedAt').lean()
    ]);

    const urls = [];

    // Base URLs
    urls.push(`  <url><loc>${BASE_URL}/</loc><priority>1.0</priority></url>`);
    urls.push(`  <url><loc>${BASE_URL}/ads</loc><priority>0.8</priority></url>`);

    // 1. Categories
    categories.forEach(cat => {
      if (cat.slug) {
        urls.push(`  <url><loc>${BASE_URL}/${escapeXml(cat.slug)}</loc><priority>0.7</priority></url>`);
      }
    });

    // 2. Subcategories
    subcategories.forEach(sub => {
      if (sub.category?.slug && sub.slug) {
        urls.push(`  <url><loc>${BASE_URL}/${escapeXml(sub.category.slug)}/${escapeXml(sub.slug)}</loc><priority>0.6</priority></url>`);
      }
    });

    // 3. Sub-Subcategories
    subSubCats.forEach(ss => {
      if (ss.subcategory?.category?.slug && ss.subcategory?.slug && ss.slug) {
        urls.push(`  <url><loc>${BASE_URL}/${escapeXml(ss.subcategory.category.slug)}/${escapeXml(ss.subcategory.slug)}/${escapeXml(ss.slug)}</loc><priority>0.5</priority></url>`);
      }
    });

    // 4. Cities
    cities.forEach(city => {
      if (city.slug) {
        urls.push(`  <url><loc>${BASE_URL}/cities/${escapeXml(city.slug)}</loc><priority>0.7</priority></url>`);
        urls.push(`  <url><loc>${BASE_URL}/cities/${escapeXml(city.slug)}/hotels</loc><priority>0.6</priority></url>`);
      }
    });

    // 5. Areas
    areas.forEach(area => {
      if (area.city?.slug && area.slug) {
        urls.push(`  <url><loc>${BASE_URL}/cities/${escapeXml(area.city.slug)}/areas/${escapeXml(area.slug)}</loc><priority>0.6</priority></url>`);
      }
    });

    // 6. Hotels
    hotels.forEach(hotel => {
      if (hotel.city?.slug && hotel.slug) {
        urls.push(`  <url><loc>${BASE_URL}/cities/${escapeXml(hotel.city.slug)}/hotels/${escapeXml(hotel.slug)}</loc><priority>0.5</priority></url>`);
      }
    });

    // 7. Ads
    ads.forEach(ad => {
      const slug = ad.slug || ad._id;
      if (slug) {
        let lastmod = '';
        if (ad.updatedAt) {
          try {
            lastmod = `<lastmod>${ad.updatedAt.toISOString().split('T')[0]}</lastmod>`;
          } catch (e) {
            console.warn(`Invalid updatedAt for ad: ${ad._id}`);
          }
        }
        urls.push(`  <url><loc>${BASE_URL}/ads/${escapeXml(slug)}</loc>${lastmod}<priority>0.6</priority></url>`);
      }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
};
