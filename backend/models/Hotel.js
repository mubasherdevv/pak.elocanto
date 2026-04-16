import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema(
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
hotelSchema.index({ city: 1 });
hotelSchema.index({ isActive: 1 });
hotelSchema.index({ showOnHome: 1 });

hotelSchema.pre('save', function () {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
});

const Hotel = mongoose.model('Hotel', hotelSchema);
export default Hotel;
