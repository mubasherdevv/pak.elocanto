import express from 'express';
import { getHotels, getHotelBySlug, createHotel, updateHotel, deleteHotel, bulkCreateHotels, bulkDeleteHotels, bulkUpdateHotels } from '../controllers/hotelController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getHotels).post(protect, admin, createHotel);
router.route('/bulk')
  .post(protect, admin, bulkCreateHotels)
  .put(protect, admin, bulkUpdateHotels)
  .delete(protect, admin, bulkDeleteHotels);

router.route('/:id').put(protect, admin, updateHotel).delete(protect, admin, deleteHotel);
router.route('/slug/:slug').get(getHotelBySlug);

export default router;
