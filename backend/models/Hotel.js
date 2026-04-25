import mongoose from 'mongoose';
import { generateSlug } from '../utils/textUtils.js';

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    customCitySlug: { type: String, trim: true },

    city: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'City',
    },
    isActive: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for performance
hotelSchema.index({ city: 1 });
hotelSchema.index({ slug: 1 });
hotelSchema.index({ customCitySlug: 1 });
hotelSchema.index({ city: 1, slug: 1 });
hotelSchema.index({ isActive: 1 });
hotelSchema.index({ showOnHome: 1 });

hotelSchema.pre('save', function () {
  if (this.isNew || this.isModified('name')) {
    if (!this.slug || (this.isModified('name') && !this.isModified('slug'))) {
      this.slug = generateSlug(this.name);
    }
  }
});


const Hotel = mongoose.model('Hotel', hotelSchema);
export default Hotel;
