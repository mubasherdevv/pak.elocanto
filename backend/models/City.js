import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  image: {
    type: String,
    default: '',
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  showOnHome: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

citySchema.index({ showOnHome: 1 });
citySchema.index({ isPopular: 1 });

citySchema.pre('save', async function () {
  if (this.isModified('name') || this.isNew) {
    if (!this.slug || this.isModified('name')) {
      const generatedSlug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      // Only set if slug wasn't manually provided/modified in this save call
      if (!this.isModified('slug')) {
        this.slug = generatedSlug;
      }
    }
  }
});

const City = mongoose.model('City', citySchema);
export default City;
