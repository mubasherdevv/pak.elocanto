import mongoose from 'mongoose';
import { generateSlug } from '../utils/textUtils.js';

const areaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
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
areaSchema.index({ city: 1 });

areaSchema.pre('save', function () {
  if (this.isModified('name') || this.isNew) {
    this.slug = generateSlug(this.name);
  }
});

const Area = mongoose.model('Area', areaSchema);
export default Area;
