import Subcategory from '../models/Subcategory.js';
import Ad from '../models/Ad.js';
import ActivityLog from '../models/ActivityLog.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { delCache } from '../utils/cache.js';

// @desc    Fetch all subcategories with counts
// @route   GET /api/subcategories
// @access  Public
const getSubcategories = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  const filter = categoryId ? { category: categoryId } : {};
  
  const subcategories = await Subcategory.find(filter).populate('category', 'name _id slug').lean();
  const subWithCounts = await Promise.all(
    subcategories.map(async (sub) => {
      const adCount = await Ad.countDocuments({ subcategory: sub._id, isActive: true, isApproved: true });
      return { ...sub, adCount };
    })
  );
  res.json(subWithCounts);
});

// @desc    Create a subcategory
// @route   POST /api/subcategories
// @access  Private/Admin
const createSubcategory = asyncHandler(async (req, res) => {
  const { name, category, description, image } = req.body;
  const subcategory = await Subcategory.create({ name, category, description, image });
  
  delCache('category_tree');

  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'CREATE_SUBCATEGORY',
    description: `Created subcategory: ${name}`,
    targetId: subcategory._id,
    targetType: 'Subcategory'
  });
  
  res.status(201).json(subcategory);
});

// @desc    Update a subcategory
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
const updateSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });
  
  const { name, category, description, image, isActive } = req.body;
  if (name) subcategory.name = name;
  if (category) subcategory.category = category;
  if (description !== undefined) subcategory.description = description;
  if (image !== undefined) subcategory.image = image;
  if (isActive !== undefined) subcategory.isActive = isActive;

  const updated = await subcategory.save();
  
  delCache('category_tree');

  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'EDIT_SUBCATEGORY',
    description: `Updated subcategory: ${subcategory.name}`,
    targetId: subcategory._id,
    targetType: 'Subcategory'
  });
  
  res.json(updated);
});

// @desc    Delete a subcategory
// @route   DELETE /api/subcategories/:id
// @access  Private/Admin
const deleteSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });
  
  const adCount = await Ad.countDocuments({ subcategory: subcategory._id });
  if (adCount > 0) {
    return res.status(400).json({ message: `Cannot delete. ${adCount} ads use this subcategory.` });
  }
  
  const subcategoryName = subcategory.name;
  await subcategory.deleteOne();
  
  delCache('category_tree');

  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'DELETE_SUBCATEGORY',
    description: `Deleted subcategory: ${subcategoryName}`,
    targetType: 'Subcategory'
  });
  
  res.json({ message: 'Subcategory removed' });
});

// @desc    Get ads for a subcategory
// @route   GET /api/subcategories/:id/ads
// @access  Private/Admin
const getSubcategoryAds = asyncHandler(async (req, res) => {
  const ads = await Ad.find({ subcategory: req.params.id })
    .populate('seller', 'name email')
    .sort({ createdAt: -1 });
  res.json(ads);
});

export { 
  getSubcategories, 
  createSubcategory, 
  updateSubcategory, 
  deleteSubcategory,
  getSubcategoryAds
};


