import express from 'express';
import { getAreas, getAreaBySlug, createArea, updateArea, deleteArea, bulkCreateAreas, bulkDeleteAreas } from '../controllers/areaController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getAreas).post(protect, admin, createArea);
router.route('/bulk')
  .post(protect, admin, bulkCreateAreas)
  .delete(protect, admin, bulkDeleteAreas);
  
router.route('/:id').put(protect, admin, updateArea).delete(protect, admin, deleteArea);
router.route('/slug/:slug').get(getAreaBySlug);

export default router;
