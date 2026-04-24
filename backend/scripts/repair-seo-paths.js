import mongoose from 'mongoose';
import SeoSettings from '../models/SeoSettings.js';
import City from '../models/City.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import SubSubCategory from '../models/SubSubCategory.js';
import Ad from '../models/Ad.js';
import Area from '../models/Area.js';
import Hotel from '../models/Hotel.js';
import dotenv from 'dotenv';
dotenv.config();

// Re-implementing the resolution logic here for the script
const normalizePath = (rawPath) => {
  if (!rawPath) return '/';
  let path = rawPath.split('?')[0].toLowerCase().replace(/\/+$/, '');
  if (!path.startsWith('/')) path = '/' + path;
  if (path === '') path = '/';
  return path;
};

const resolvePathForRecord = async (pageType, referenceId) => {
  let path = '/';
  try {
    if (pageType === 'home') path = '/';
    else if (pageType === 'ads') path = '/ads';
    else if (pageType === 'city' && referenceId) {
      const city = await City.findById(referenceId);
      if (city) path = `/cities/${city.slug}`;
    } else if (pageType === 'category' && referenceId) {
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
        const citySlug = area.customCitySlug || area.city.slug;
        path = `/cities/${citySlug}/areas/${area.slug}`;
      } else if (area) {
        path = `/areas/${area.slug}`;
      }
    } else if (pageType === 'hotel' && referenceId) {
      const hotel = await Hotel.findById(referenceId).populate('city');
      if (hotel && hotel.city) {
        const citySlug = hotel.customCitySlug || hotel.city.slug;
        path = `/cities/${citySlug}/hotels/${hotel.slug}`;
      } else if (hotel) {
        path = `/hotels/${hotel.slug}`;
      }
    }
  } catch (e) {
    console.error('Error resolving path:', e);
  }
  return normalizePath(path);
};

async function repairAllSeo() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://admin:password12345@ac-imfoglo-shard-00-00.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-01.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-02.x3fb6wa.mongodb.net:27017/ecomm?ssl=true&replicaSet=atlas-w7le7v-shard-0&authSource=admin&appName=Cluster0";
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const seos = await SeoSettings.find({});
    console.log(`Processing ${seos.length} SEO records...`);

    let count = 0;
    for (const seo of seos) {
      if (seo.pageType === 'custom') continue;
      
      const newPath = await resolvePathForRecord(seo.pageType, seo.referenceId);
      if (seo.pagePath !== newPath) {
        seo.pagePath = newPath;
        await seo.save();
        count++;
        if (count % 50 === 0) console.log(`Updated ${count} records...`);
      }
    }

    console.log(`\nSUCCESS! Updated ${count} SEO paths to match new custom routes.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

repairAllSeo();
