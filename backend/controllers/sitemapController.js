import Ad from '../models/Ad.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import SubSubCategory from '../models/SubSubCategory.js';
import City from '../models/City.js';
import Area from '../models/Area.js';
import Hotel from '../models/Hotel.js';

export const getSitemap = async (req, res) => {
  try {
    const BASE_URL = process.env.SITE_URL || 'https://pk.elocanto.com';

    // Fetch all levels of hierarchy
    const [categories, subcategories, subSubCats, cities, areas, hotels, ads] = await Promise.all([
      Category.find({ isActive: true }).select('slug'),
      Subcategory.find({ isActive: true }).populate('category', 'slug').select('slug'),
      SubSubCategory.find({ isActive: true }).populate({
        path: 'subcategory',
        populate: { path: 'category', select: 'slug' }
      }).select('slug'),
      City.find().select('slug'),
      Area.find({ isActive: true }).populate('city', 'slug').select('slug'),
      Hotel.find({ isActive: true }).populate('city', 'slug').select('slug'),
      Ad.find({ isApproved: true, isActive: true }).select('slug updatedAt')
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/ads</loc>
    <priority>0.8</priority>
  </url>`;

    // 1. Categories
    categories.forEach(cat => {
      xml += `
  <url>
    <loc>${BASE_URL}/${cat.slug}</loc>
    <priority>0.7</priority>
  </url>`;
    });

    // 2. Subcategories
    subcategories.forEach(sub => {
      if (sub.category?.slug) {
        xml += `
  <url>
    <loc>${BASE_URL}/${sub.category.slug}/${sub.slug}</loc>
    <priority>0.6</priority>
  </url>`;
      }
    });

    // 3. Sub-Subcategories
    subSubCats.forEach(ss => {
      if (ss.subcategory?.category?.slug && ss.subcategory?.slug) {
        xml += `
  <url>
    <loc>${BASE_URL}/${ss.subcategory.category.slug}/${ss.subcategory.slug}/${ss.slug}</loc>
    <priority>0.5</priority>
  </url>`;
      }
    });

    // 4. Cities
    cities.forEach(city => {
      if (city.slug) {
        xml += `
  <url>
    <loc>${BASE_URL}/cities/${city.slug}</loc>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/cities/${city.slug}/hotels</loc>
    <priority>0.6</priority>
  </url>`;
      }
    });

    // 5. Areas
    areas.forEach(area => {
      if (area.city?.slug && area.slug) {
        xml += `
  <url>
    <loc>${BASE_URL}/cities/${area.city.slug}/areas/${area.slug}</loc>
    <priority>0.6</priority>
  </url>`;
      }
    });

    // 6. Hotels
    hotels.forEach(hotel => {
      if (hotel.city?.slug && hotel.slug) {
        xml += `
  <url>
    <loc>${BASE_URL}/cities/${hotel.city.slug}/hotels/${hotel.slug}</loc>
    <priority>0.5</priority>
  </url>`;
      }
    });

    // 7. Ads
    ads.forEach(ad => {
      xml += `
  <url>
    <loc>${BASE_URL}/ads/${ad.slug || ad._id}</loc>
    <lastmod>${ad.updatedAt.toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
};
