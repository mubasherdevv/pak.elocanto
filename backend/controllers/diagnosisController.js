import asyncHandler from '../middleware/asyncHandler.js';
import { isConfigured, deleteFromCloudinary } from '../utils/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Diagnose Cloudinary connectivity
// @route   GET /api/ads/diagnosis/cloudinary
// @access  Private/Admin
export const diagnoseCloudinary = asyncHandler(async (req, res) => {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'PRESENT' : 'MISSING',
    api_key: process.env.CLOUDINARY_API_KEY ? 'PRESENT' : 'MISSING',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING',
  };

  const status = {
    isConfiguredUtility: isConfigured,
    envStatus: config,
    nodeEnv: process.env.NODE_ENV
  };

  try {
    // Attempt a ping to Cloudinary API
    const ping = await cloudinary.api.ping();
    status.cloudinaryPing = ping;
  } catch (error) {
    status.cloudinaryPingError = error.message;
  }

  res.json(status);
});
