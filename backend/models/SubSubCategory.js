import mongoose from 'mongoose';
import { generateSlug } from '../utils/textUtils.js';

const subSubCategorySchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Subcategory',
    },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subSubCategorySchema.pre('save', async function () {
  if (this.isModified('name') || this.isNew) {
    this.slug = generateSlug(this.name);
  }
});

const SubSubCategory = mongoose.model('SubSubCategory', subSubCategorySchema);
export default SubSubCategory;
