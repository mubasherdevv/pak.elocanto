import mongoose from 'mongoose';
import { generateSlug } from '../utils/textUtils.js';

const categorySchema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    icon: { type: String, default: '📦' },
    description: { type: String, default: '' },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ isActive: 1 });
categorySchema.index({ parentId: 1 });

categorySchema.pre('save', async function () {
  if (this.isModified('name') || this.isNew) {
    this.slug = generateSlug(this.name);
  }
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
