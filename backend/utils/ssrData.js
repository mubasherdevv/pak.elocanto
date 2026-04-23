import Ad from '../models/Ad.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import City from '../models/City.js';
import Area from '../models/Area.js';
import Hotel from '../models/Hotel.js';
import Settings from '../models/Settings.js';

/**
 * Resolves data and generates initial HTML content for SSR-lite.
 * @param {string} reqPath The requested path
 * @param {object} seo The resolved SEO metadata from database
 * @returns {Promise<{initialData: object, contentHtml: string}>}
 */
const renderHeader = (settings) => {
  const logoUrl = settings?.siteLogo || '/logo.png';
  return `
    <header style="background: white; border-bottom: 1px solid #eee; padding: 12px 0; position: sticky; top: 0; z-index: 100;">
      <div style="max-width: 1280px; margin: 0 auto; padding: 0 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${logoUrl}" alt="Logo" style="height: 40px; width: auto;" />
          <span style="font-weight: 800; font-size: 20px; color: #0f172a;">ELOCANTO</span>
        </div>
        <div style="display: flex; gap: 20px; align-items: center;">
          <button style="background: #f95e26; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Post Ad</button>
        </div>
      </div>
    </header>
  `;
};

export const resolveRouteData = async (reqPath, seo = {}, settings = {}) => {
  const path = reqPath.split('?')[0].toLowerCase().replace(/\/+$/, '') || '/';
  console.log(`[SSR-DATA] 🛠️ Resolving path: ${path}`);
  
  const [allCategories, allCities] = await Promise.all([
    Category.find().lean(),
    City.find({ showOnHome: true }).lean()
  ]);

  let initialData = { 
    categories: allCategories, 
    cities: allCities 
  };
  let contentHtml = '';

  try {
    // Helper for rendering an ad card snippet
    const renderAdCard = (ad) => `
      <div style="border: 1px solid #f1f5f9; border-radius: 12px; padding: 12px; background: white;">
        <div style="height: 150px; background: #f8fafc; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          ${ad.images?.length > 0 ? `<img src="${ad.images[0]}" style="width: 100%; height: 100%; object-fit: cover;" />` : '<span>📸</span>'}
        </div>
        <h3 style="font-size: 14px; margin: 0 0 4px 0; color: #1e293b;">${ad.title}</h3>
        <p style="font-size: 14px; font-weight: 800; color: #f95e26; margin: 0;">PKR ${ad.price?.toLocaleString()}</p>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">${ad.city}</p>
      </div>
    `;

    const renderGrid = (ads, title) => `
      <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
        <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 24px;">${title}</h1>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
          ${ads.map(ad => renderAdCard(ad)).join('')}
        </div>
      </div>
    `;

    // 1. Home Page
    if (path === '/') {
      const [featuredAds, latestAds] = await Promise.all([
        Ad.find({ isFeatured: true, isActive: true, isApproved: true, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(10).lean(),
        Ad.find({ isActive: true, isApproved: true, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(12).lean()
      ]);
      initialData = { ...initialData, featuredAds, latestAds };
      
      const categoryHtml = `
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 24px; margin-bottom: 20px;">Browse by Category</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px;">
            ${allCategories.slice(0, 12).map(cat => `
              <a href="/${cat.slug}" style="text-decoration: none; color: inherit; text-align: center; border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px; display: block;">
                <div style="font-size: 24px; margin-bottom: 8px;">${cat.icon || '📦'}</div>
                <div style="font-size: 12px; font-weight: 700;">${cat.name}</div>
              </a>
            `).join('')}
          </div>
        </div>
      `;

      const cityHtml = `
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 24px; margin-bottom: 20px;">Browse by City</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;">
            ${allCities.map(city => `
              <a href="/cities/${city.slug}" style="text-decoration: none; color: inherit; text-align: center; border: 1px solid #f1f5f9; padding: 10px; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 11px; font-weight: 700;">
                ${city.name}
              </a>
            `).join('')}
          </div>
        </div>
      `;

      contentHtml = `
        <div style="max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: sans-serif;">
          <h1 style="font-size: 32px; font-weight: 900; text-align: center; margin-bottom: 40px; color: #1e293b;">${seo.title || 'Buy, Sell & Discover Everything in Pakistan'}</h1>
          
          ${categoryHtml}
          ${cityHtml}
          ${renderGrid(featuredAds, 'Featured Ads')}
          ${renderGrid(latestAds, 'Latest Recommendations')}
        </div>
      `;
    }

    // 2. Ad Detail Page (/ads/:slug)
    else if (path.startsWith('/ads/')) {
      const slug = path.replace('/ads/', '');
      const ad = await Ad.findOne({ slug })
        .populate('seller', 'name')
        .populate('area', 'name')
        .lean();

      if (ad) {
        initialData = { ...initialData, ad };
        contentHtml = `
          <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 12px;">${ad.title}</h1>
            <p style="font-size: 24px; font-weight: 800; color: #f95e26; margin-bottom: 24px;">PKR ${ad.price?.toLocaleString()}</p>
            <div style="display: flex; gap: 20px; margin-bottom: 32px;">
              <div style="flex: 1; height: 400px; background: #f8fafc; border-radius: 16px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                ${ad.images?.length > 0 ? `<img src="${ad.images[0]}" style="width: 100%; height: 100%; object-fit: cover;" />` : '<span>📸</span>'}
              </div>
            </div>
            <div style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 24px;">
              <h2 style="font-size: 18px; margin-bottom: 16px;">Description</h2>
              <p style="line-height: 1.6; color: #475569;">${ad.description}</p>
            </div>
          </div>
        `;
      }
    }

    // 3. City / Area / Hotel Routes
    else if (path.startsWith('/cities/')) {
      const parts = path.split('/');
      const citySlug = parts[2];
      const type = parts[3];
      const subSlug = parts[4];

      const city = await City.findOne({ slug: { $regex: new RegExp(`^${citySlug}$`, 'i') } }).lean();
      if (city) {
        let adsQuery = { city: { $regex: `^${city.name}$`, $options: 'i' }, isActive: true, isApproved: true };
        let title = seo.title || `Ads in ${city.name}`;

        if (type === 'areas' && subSlug) {
          const area = await Area.findOne({ slug: { $regex: new RegExp(`^${subSlug}$`, 'i') } }).lean();
          if (area) {
            adsQuery.area = area._id;
            title = seo.title || `Ads in ${area.name}, ${city.name}`;
            initialData.area = area;
          }
        } else if (type === 'hotels' && subSlug) {
          const hotel = await Hotel.findOne({ slug: { $regex: new RegExp(`^${subSlug}$`, 'i') } }).lean();
          if (hotel) {
            adsQuery.hotel = hotel._id;
            title = seo.title || `Ads in ${hotel.name}, ${city.name}`;
            initialData.hotel = hotel;
          }
        }

        const ads = await Ad.find(adsQuery).sort({ createdAt: -1 }).limit(20).lean();
        initialData = { ...initialData, city, ads, title };
        contentHtml = renderHeader(settings) + renderGrid(ads, title);
        console.log(`[SSR-DATA] ✅ City resolved: ${city.name} (${ads.length} ads)`);
      } else {
        console.warn(`[SSR-DATA] ❌ City NOT found for slug: ${citySlug}`);
      }
    }

    // 4. Ads Listing Page (/ads)
    else if (path === '/ads') {
      const ads = await Ad.find({ isActive: true, isApproved: true, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(20).lean();
      initialData = { ...initialData, ads };
      contentHtml = renderHeader(settings) + renderGrid(ads, 'All Advertisements');
    }

    // 5. Category / Subcategory Routes (Unified Router)
    else if (path !== '/login' && path !== '/register' && path !== '/dashboard' && !path.startsWith('/api/')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) {
        const catSlug = parts[0];
        const subSlug = parts[1];
        
        const category = await Category.findOne({ slug: catSlug }).lean();
        if (category) {
          let adsQuery = { category: category._id, isActive: true, isApproved: true };
          let title = category.name;

          if (subSlug) {
            const sub = await Subcategory.findOne({ slug: subSlug, category: category._id }).lean();
            if (sub) {
              adsQuery.subcategory = sub._id;
              title = `${sub.name} in ${category.name}`;
              initialData.subcategory = sub;
            }
          }

          const ads = await Ad.find(adsQuery).sort({ createdAt: -1 }).limit(20).lean();
          initialData = { ...initialData, category, ads, title };
          contentHtml = renderGrid(ads, title);
        }
      }
    }

  } catch (err) {
    console.error('[SSR-DATA] Error resolving route data:', err);
  }

  return { initialData, contentHtml };
};
