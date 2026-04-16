import express from 'express';
import {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoryAds
} from '../controllers/subcategoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getSubcategories)
  .post(protect, admin, createSubcategory);

router.route('/:id')
  .put(protect, admin, updateSubcategory)
  .delete(protect, admin, deleteSubcategory);

router.get('/:id/ads', protect, admin, getSubcategoryAds);

export default router;
