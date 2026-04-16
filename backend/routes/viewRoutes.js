import express from 'express';
import { trackAdView, trackBulkViews, getAdViews } from '../controllers/viewController.js';

const router = express.Router();

router.post('/track', trackAdView);
router.post('/track-bulk', trackBulkViews);
router.get('/ad/:adId', getAdViews);

export default router;
