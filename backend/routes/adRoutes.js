import express from 'express';
import {
  getAds, getFeaturedAds, getLatestAds, getAdById,
  createAd, updateAd, deleteAd, getMyAds, getSellerAds, getAllAdsAdmin, getAdsByUserAdmin, getSimilarAds, getSellerAnalytics,
  bulkDeleteAds, bulkUpdateAds
} from '../controllers/adController.js';
import { diagnoseCloudinary } from '../controllers/diagnosisController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAds);
router.get('/featured', getFeaturedAds);
router.get('/latest', getLatestAds);
router.get('/my/analytics', protect, getSellerAnalytics);
router.get('/my', protect, getMyAds);
router.get('/admin/all', protect, admin, getAllAdsAdmin);
router.get('/admin/user/:userId', protect, admin, getAdsByUserAdmin);
router.get('/seller/:sellerId', getSellerAds);
router.get('/similar/:id', getSimilarAds);
router.get('/:id', getAdById);
router.post('/', protect, createAd);
router.put('/:id', protect, updateAd);
router.delete('/:id', protect, deleteAd);


// Bulk Actions
router.post('/bulk-delete', protect, admin, bulkDeleteAds);
router.post('/bulk-update', protect, admin, bulkUpdateAds);

// Debug/Diagnosis (Restored Private)
router.get('/diagnosis/cloudinary', protect, admin, diagnoseCloudinary);

export default router;
