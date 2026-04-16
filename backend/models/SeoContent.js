import mongoose from 'mongoose';

const seoContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }, // rich text HTML
  pageType: { type: String, default: 'home' }, // e.g. 'home', 'category', 'subcategory', 'ad_detail', 'login', 'register'
  targetSlug: { type: String, default: '' }, // 'cars', 'mobiles' etc
  isActive: { type: Boolean, default: true },
  keywords: { type: [String], default: [] },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
}, { timestamps: true });

const SeoContent = mongoose.models.SeoContent || mongoose.model('SeoContent', seoContentSchema);
export default SeoContent;
