import express from 'express';
import { toggleFavorite, getUserFavorites, checkFavorite } from '../controllers/favoriteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getUserFavorites);
router.get('/check/:adId', protect, checkFavorite);
router.post('/:adId', protect, toggleFavorite);

export default router;
