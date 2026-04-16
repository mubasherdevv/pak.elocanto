import mongoose from 'mongoose';

const seoSettingsSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      required: true,
      enum: ['homepage', 'ads', 'city', 'area', 'hotel', 'category'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // Null for homepage and generic ads page
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

// Indexing for faster lookups
seoSettingsSchema.index({ pageType: 1, referenceId: 1 });

const SeoSettings = mongoose.model('SeoSettings', seoSettingsSchema);
export default SeoSettings;
