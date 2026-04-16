import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import SubSubCategory from '../models/SubSubCategory.js';
import Ad from '../models/Ad.js';
import ActivityLog from '../models/ActivityLog.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { getCache, setCache, delCache } from '../utils/cache.js';

// @desc    Fetch all categories with counts
// @route   GET /api/categories
// @access  Public
// @desc    Fetch all categories with counts
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const cacheKey = 'category_tree';
  const cachedData = getCache(cacheKey);
  if (cachedData) return res.json(cachedData);

  // Fetch all levels in parallel to avoid N+1 queries
  const [categories, subcategories, subSubCategories, adCounts] = await Promise.all([
    Category.find({}).sort({ name: 1 }).lean(),
    Subcategory.find({}).lean(),
    SubSubCategory.find({}).lean(),
    Ad.aggregate([
      { $match: { isActive: true, isApproved: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
  ]);

  // Aggregate counts for quick lookup
  const adCountMap = adCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  // Build the tree in memory
  const tree = categories.map(cat => {
    const catId = cat._id.toString();
    const catSubcategories = subcategories
      .filter(sub => sub.category.toString() === catId)
      .map(sub => {
        const subId = sub._id.toString();
        const subSubCats = subSubCategories.filter(ssub => ssub.subcategory.toString() === subId);
        return {
          ...sub,
          subSubCategories: subSubCats,
          adCount: 0 // Subcategory specific counts can be added if indexed
        };
      });

    return {
      ...cat,
      subcategories: catSubcategories,
      adCount: adCountMap[catId] || 0,
      subcategoryCount: catSubcategories.length
    };
  });

  setCache(cacheKey, tree, 3600); // Cache for 1 hour
  res.json(tree);
});

// @desc    Get single category by slug or id
// @route   GET /api/categories/:slug
// @access  Public
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ slug: req.params.slug });
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  res.json(cat);
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, description, parentId, image } = req.body;
  const exists = await Category.findOne({ name });
  if (exists) return res.status(400).json({ message: 'Category already exists' });
  const category = await Category.create({ name, icon, description, parentId: parentId || null, image: image || '' });
  
  delCache('category_tree');

  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'CREATE_CATEGORY',
    description: `Created category: ${name}`,
    targetId: category._id,
    targetType: 'Category'
  });
  
  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  const { name, icon, description, parentId, image, isActive } = req.body;
  if (name) category.name = name;
  if (icon !== undefined) category.icon = icon;
  if (description !== undefined) category.description = description;
  if (parentId !== undefined) category.parentId = parentId;
  if (image !== undefined) category.image = image;
  if (isActive !== undefined) category.isActive = isActive;
  const updated = await category.save();
  
  delCache('category_tree');

  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'EDIT_CATEGORY',
    description: `Updated category: ${category.name}`,
    targetId: category._id,
    targetType: 'Category'
  });
  
  res.json(updated);
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  const subCount = await Subcategory.countDocuments({ category: category._id });
  if (subCount > 0) {
    return res.status(400).json({ message: `Cannot delete. ${subCount} subcategories belong to this category.` });
  }
  const adCount = await Ad.countDocuments({ category: category._id });
  if (adCount > 0) {
    return res.status(400).json({ message: `Cannot delete. ${adCount} ads use this category.` });
  }
  const categoryName = category.name;
  await category.deleteOne();
  
  delCache('category_tree');

  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'DELETE_CATEGORY',
    description: `Deleted category: ${categoryName}`,
    targetType: 'Category'
  });
  
  res.json({ message: 'Category removed' });
});

// @desc    Create a sub-sub-category
// @route   POST /api/categories/subsub
// @access  Private/Admin
const createSubSubCategory = asyncHandler(async (req, res) => {
  const { name, subcategory, description, image } = req.body;
  const exists = await SubSubCategory.findOne({ name, subcategory });
  if (exists) return res.status(400).json({ message: 'Sub-sub-category already exists in this subcategory' });
  
  const subSub = await SubSubCategory.create({ name, subcategory, description, image: image || '' });
  
  delCache('category_tree');

  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'CREATE_SUBSUBCATEGORY',
    description: `Created sub-sub-category: ${name}`,
    targetId: subSub._id,
    targetType: 'SubSubCategory'
  });
  
  res.status(201).json(subSub);
});

// @desc    Update a sub-sub-category
// @route   PUT /api/categories/subsub/:id
// @access  Private/Admin
const updateSubSubCategory = asyncHandler(async (req, res) => {
  const subSub = await SubSubCategory.findById(req.params.id);
  if (!subSub) return res.status(404).json({ message: 'Sub-sub-category not found' });
  
  const { name, description, image, isActive } = req.body;
  if (name) subSub.name = name;
  if (description !== undefined) subSub.description = description;
  if (image !== undefined) subSub.image = image;
  if (isActive !== undefined) subSub.isActive = isActive;
  
  const updated = await subSub.save();
  
  delCache('category_tree');

  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'EDIT_SUBSUBCATEGORY',
    description: `Updated sub-sub-category: ${subSub.name}`,
    targetId: subSub._id,
    targetType: 'SubSubCategory'
  });
  
  res.json(updated);
});

// @desc    Delete a sub-sub-category
// @route   DELETE /api/categories/subsub/:id
// @access  Private/Admin
const deleteSubSubCategory = asyncHandler(async (req, res) => {
  const subSub = await SubSubCategory.findById(req.params.id);
  if (!subSub) return res.status(404).json({ message: 'Sub-sub-category not found' });
  
  const adCount = await Ad.countDocuments({ subSubCategory: subSub._id });
  if (adCount > 0) {
    return res.status(400).json({ message: `Cannot delete. ${adCount} ads use this sub-sub-category.` });
  }
  
  const name = subSub.name;
  await subSub.deleteOne();
  
  delCache('category_tree');

  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'DELETE_SUBSUBCATEGORY',
    description: `Deleted sub-sub-category: ${name}`,
    targetType: 'SubSubCategory'
  });
  
  res.json({ message: 'Sub-sub-category removed' });
});

// @desc    Get sub-sub-categories by subcategory ID
// @route   GET /api/categories/subsub
// @access  Public
const getSubSubCategories = asyncHandler(async (req, res) => {
  const { subcategoryId } = req.query;
  const filter = subcategoryId ? { subcategory: subcategoryId } : {};
  const subSubs = await SubSubCategory.find(filter).lean();
  res.json(subSubs);
});

export { 
  getCategories, 
  getCategoryBySlug, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  createSubSubCategory,
  updateSubSubCategory,
  deleteSubSubCategory,
  getSubSubCategories,
};


