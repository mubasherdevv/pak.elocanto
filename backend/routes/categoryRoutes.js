import express from 'express';
import {
  getCategories, 
  getCategoryBySlug, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  createSubSubCategory,
  updateSubSubCategory,
  deleteSubSubCategory,
  getSubSubCategories,
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCategories).post(protect, admin, createCategory);
router.get('/slug/:slug', getCategoryBySlug);
router.route('/:id').put(protect, admin, updateCategory).delete(protect, admin, deleteCategory);

// SubSubCategory routes
router.route('/subsub').get(getSubSubCategories).post(protect, admin, createSubSubCategory);
router.route('/subsub/:id').put(protect, admin, updateSubSubCategory).delete(protect, admin, deleteSubSubCategory);

export default router;
