import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { createReport, getReports, getMyReports } from '../controllers/reportController.js';

const router = express.Router();

router.route('/')
  .post(createReport)
  .get(protect, admin, getReports);

router.get('/my', protect, getMyReports);

export default router;
