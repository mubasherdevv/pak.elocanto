import mongoose from 'mongoose';
import { deleteFromCloudinary, extractPublicId, isConfigured } from '../utils/cloudinary.js';
import { generateSlug } from '../utils/textUtils.js';

const adSchema = mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
    },
    subSubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubSubCategory',
    },
    city: { type: String, required: true },
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
    },
    images: [{ type: String }],
    condition: {
      type: String,
      enum: ['new', 'used', 'refurbished'],
      default: 'used',
    },
    adType: {
      type: String,
      enum: ['simple', 'featured'],
      default: 'simple',
    },
    listingType: {
      type: String,
      enum: ['simple', 'featured', 'boosted'],
      default: 'simple',
    },
    isFeatured: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
      }
    },
    phone: { type: String },
    brand: { type: String },
    isNegotiable: { type: Boolean, default: false },
    tags: [{ type: String }],
    badges: [{ 
      type: String, 
      enum: ['High Demand', 'Popular', 'Hot Premium', 'Trending Now', 'Recommended']
    }],
    slug: { type: String },
    rejectionReason: { type: String },
    website: { type: String, trim: true },
  },
  { timestamps: true }
);

// Text index for search
adSchema.index({ title: 'text', description: 'text', tags: 'text' });
adSchema.index({ slug: 1 });
adSchema.index({ category: 1, isActive: 1, isApproved: 1, createdAt: -1 });
adSchema.index({ subcategory: 1, isActive: 1, isApproved: 1, createdAt: -1 });
adSchema.index({ city: 1, isActive: 1, isApproved: 1, createdAt: -1 });
adSchema.index({ area: 1, isActive: 1, isApproved: 1, createdAt: -1 });
adSchema.index({ hotel: 1, isActive: 1, isApproved: 1, createdAt: -1 });
adSchema.index({ seller: 1, createdAt: -1 });
adSchema.index({ isActive: 1, isApproved: 1, expiresAt: 1, createdAt: -1 });

// Auto-generate slug from title
adSchema.pre('save', async function () {
  if (this.isModified('title') || this.isNew) {
    this.slug = generateSlug(this.title).substring(0, 70); // Limit length slightly longer for SEO
  }

  // Synch adType and listingType for backward compatibility
  if (this.isModified('adType')) {
    this.listingType = this.adType;
  } else if (this.isModified('listingType')) {
    this.adType = this.listingType === 'featured' ? 'featured' : 'simple';
  }

  // Expiry Logic
  if (this.isNew || this.isModified('adType') || this.isModified('listingType')) {
    if (this.adType === 'featured') {
      this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      this.isFeatured = true;
    } else {
      // If it's simple, give it 30 days if not already set or if just converted from featured
      if (this.isNew || this.isModified('adType')) {
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        this.isFeatured = false;
      }
    }
  }

  // Automatic conversion of expired featured ads to simple ads
  if (this.adType === 'featured' && this.expiresAt < new Date()) {
    this.adType = 'simple';
    this.listingType = 'simple';
    this.isFeatured = false;
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
});

// Cloudinary Cleanup Middleware (Fail-Safe)
adSchema.pre('deleteOne', { document: true, query: false }, async function () {
  try {
    if (!isConfigured) {
      console.log('[MIDDLEWARE] Skipping Cloudinary cleanup: Credentials missing.');
      return;
    }

    const imagesToDelete = this.images || [];
    if (imagesToDelete.length > 0) {
      console.log(`[MIDDLEWARE] Cleaning up ${imagesToDelete.length} images for ad: ${this.title}`);
      
      const lastId = this._id;
      
      for (const imgUrl of imagesToDelete) {
        if (typeof imgUrl !== 'string') continue;
        
        const publicId = extractPublicId(imgUrl);
        if (publicId) {
          // Fire and forget, don't block deletion if one image fails
          deleteFromCloudinary(publicId).catch(err => 
            console.error(`[MIDDLEWARE] Cleanup error for ad ${lastId}:`, err?.message || err || 'Unknown error')
          );
        }
      }
    }
  } catch (error) {
    console.error('[MIDDLEWARE] Ad deletion cleanup swallowed error:', error.message);
    // We swallow errors here so the ad itself is ALWAYS deleted even if Cloudinary fails
  }
});

const Ad = mongoose.model('Ad', adSchema);
export default Ad;
