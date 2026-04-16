import express from 'express';
import {
  getCities,
  getCityBySlug,
  createCity,
  updateCity,
  deleteCity,
  bulkCreateCities,
  bulkDeleteCities,
  bulkUpdateCities,
} from '../controllers/cityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getCities)
  .post(protect, admin, createCity);

router.route('/bulk')
  .post(protect, admin, bulkCreateCities)
  .put(protect, admin, bulkUpdateCities)
  .delete(protect, admin, bulkDeleteCities);

router.route('/slug/:slug').get(getCityBySlug);

router.route('/:id')
  .put(protect, admin, updateCity)
  .delete(protect, admin, deleteCity);

export default router;
