import mongoose from 'mongoose';
import { generateSlug } from '../utils/textUtils.js';

const subcategorySchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subcategorySchema.pre('save', async function () {
  if (this.isModified('name') || this.isNew) {
    this.slug = generateSlug(this.name);
  }
});

const Subcategory = mongoose.model('Subcategory', subcategorySchema);
export default Subcategory;
