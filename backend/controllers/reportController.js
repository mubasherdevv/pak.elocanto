import asyncHandler from '../middleware/asyncHandler.js';
import Report from '../models/Report.js';
import Ad from '../models/Ad.js';
import User from '../models/User.js';
import { sendReportAlertEmail } from '../utils/email.js';

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
export const createReport = asyncHandler(async (req, res) => {
  const { adId, reason, message } = req.body;

  const ad = await Ad.findById(adId);
  if (!ad) {
    res.status(404);
    throw new Error('Ad not found');
  }

  // Optional: Check if user already reported this ad
  const existingReport = await Report.findOne({ reporter: req.user._id, ad: adId, status: 'pending' });
  if (existingReport) {
    res.status(400);
    throw new Error('You have already reported this ad and it is under review.');
  }

  const report = await Report.create({
    reporter: req.user._id,
    ad: adId,
    reason,
    message,
  });

  // Notify Seller
  try {
    const seller = await User.findById(ad.seller);
    if (seller) {
      await sendReportAlertEmail(seller, ad, reason);
    }
  } catch (err) {
    console.error('Failed to notify seller of report:', err);
  }

  res.status(201).json(report);
});

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
// @access  Private/Admin
export const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({})
    .populate('reporter', 'name email')
    .populate('ad', 'title images price slug')
    .sort({ createdAt: -1 });
  res.json(reports);
});

// @desc    Get reports submitted by current user
// @route   GET /api/reports/my
// @access  Private
export const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reporter: req.user._id })
    .populate('ad', 'title images price slug')
    .sort({ createdAt: -1 });

  res.json(reports);
});

export default { createReport, getReports, getMyReports };
