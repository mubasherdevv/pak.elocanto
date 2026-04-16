import express from 'express';
import {
  addOrderItems,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  getRecentOrders,
  getOrderAnalytics,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/analytics').get(protect, admin, getOrderAnalytics);
router.route('/recent').get(protect, admin, getRecentOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

export default router;
