import express from 'express';
import { 
  getSeoSettings, 
  getAllSeoSettings, 
  getSeoSettingById,
  saveSeoSettings, 
  deleteSeoSetting,
  getSeoByPath
} from '../controllers/seoSettingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/public', getSeoSettings); // Legacy compat
router.get('/path', getSeoByPath);     // Professional path-based

// Protected admin routes
router.use(protect);
router.use(admin);

router.route('/')
  .get(getAllSeoSettings)
  .post(saveSeoSettings);

router.route('/:id')
  .get(getSeoSettingById)
  .delete(deleteSeoSetting);

export default router;
