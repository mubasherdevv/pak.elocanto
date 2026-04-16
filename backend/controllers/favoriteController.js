import Favorite from '../models/Favorite.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Toggle favorite (add/remove)
// @route   POST /api/favorites/:adId
// @access  Private
export const toggleFavorite = asyncHandler(async (req, res) => {
  const { adId } = req.params;
  const existing = await Favorite.findOne({ user: req.user._id, ad: adId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ message: 'Removed from favorites', favorited: false });
  }
  await Favorite.create({ user: req.user._id, ad: adId });
  res.json({ message: 'Added to favorites', favorited: true });
});

// @desc    Get user's favorites
// @route   GET /api/favorites
// @access  Private
export const getUserFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id })
    .populate({
      path: 'ad',
      populate: [
        { path: 'seller', select: 'name profilePhoto city' },
        { path: 'category', select: 'name slug icon' }
      ]
    })
    .sort({ createdAt: -1 });
  res.json(favorites.map(f => f.ad).filter(Boolean));
});

// @desc    Check if an ad is favorited by current user
// @route   GET /api/favorites/check/:adId
// @access  Private
export const checkFavorite = asyncHandler(async (req, res) => {
  const fav = await Favorite.findOne({ user: req.user._id, ad: req.params.adId });
  res.json({ favorited: !!fav });
});


