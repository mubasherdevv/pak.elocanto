import mongoose from 'mongoose';

const seoSettingsSchema = new mongoose.Schema(
  {
    pagePath: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true
    },
    pageType: {
      type: String,
      required: true,
      enum: ['home', 'ads', 'ad', 'city', 'city-hotels', 'city-areas', 'area', 'hotel', 'category', 'profile', 'custom'],
    },
    referenceId: {
      type: String, 
      default: null, // String ID for compatibility across all entities
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    metaDescription: {
      type: String,
      required: true,
      trim: true,
    },
    keywords: {
      type: String,
      default: '',
      trim: true,
    },
    ogTitle: {
      type: String,
      trim: true,
    },
    ogDescription: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexing for faster entity-based lookups
seoSettingsSchema.index({ pageType: 1, referenceId: 1 });

const SeoSettings = mongoose.model('SeoSettings', seoSettingsSchema);
export default SeoSettings;
