import express from 'express';
import { getSeoContents, getMatchedSeoContent, createSeoContent, updateSeoContent, deleteSeoContent } from '../controllers/seoContentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to fetch matching content
router.get('/match', getMatchedSeoContent);

// Admin routes
router.route('/')
  .get(protect, admin, getSeoContents)
  .post(protect, admin, createSeoContent);

router.route('/:id')
  .put(protect, admin, updateSeoContent)
  .delete(protect, admin, deleteSeoContent);

export default router;
