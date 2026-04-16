import express from 'express';
import Settings from '../models/Settings.js';

const router = express.Router();

// @desc    Get site settings (Public)
// @route   GET /api/settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      // Create default settings if none exists
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch settings' });
  }
});

export default router;
