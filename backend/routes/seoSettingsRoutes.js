import express from 'express';
import { 
  getSeoSettings, 
  getAllSeoSettings, 
  saveSeoSettings, 
  deleteSeoSetting 
} from '../controllers/seoSettingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to fetch SEO for a page
router.get('/public', getSeoSettings);

// Protected admin routes
router.use(protect);
router.use(admin);

router.route('/')
  .get(getAllSeoSettings)
  .post(saveSeoSettings);

router.delete('/:id', deleteSeoSetting);

export default router;
