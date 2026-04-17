import SeoSettings from '../models/SeoSettings.js';
import { flushCache } from '../utils/cache.js';

// @desc    Get SEO settings for a specific page
// @route   GET /api/public/seo
// @access  Public
export const getSeoSettings = async (req, res) => {
  try {
    const { pageType, referenceId } = req.query;
    
    let query = { pageType, isActive: true };
    // Handle null, undefined, or 'null' string for referenceId
    if (!referenceId || referenceId === 'null' || referenceId === 'undefined') {
      query.referenceId = null;
    } else {
      query.referenceId = referenceId;
    }

    let settings = await SeoSettings.findOne(query);

    // Cascading Fallback: If no specific setting, try generic (referenceId: null)
    if (!settings && referenceId && referenceId !== 'null') {
      settings = await SeoSettings.findOne({ pageType, referenceId: null, isActive: true });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all SEO settings (Admin)
// @route   GET /api/admin/seo-settings
// @access  Private/Admin
export const getAllSeoSettings = async (req, res) => {
  try {
    const settings = await SeoSettings.find({}).sort({ createdAt: -1 });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update SEO settings
// @route   POST /api/admin/seo-settings
// @access  Private/Admin
export const saveSeoSettings = async (req, res) => {
  try {
    const { pageType, title, metaDescription, keywords, whatsappNumber, isActive } = req.body;
    const referenceId = req.body.referenceId || null;

    // Check if it already exists to update
    const query = { pageType, referenceId };
    let settings = await SeoSettings.findOne(query);

    if (settings) {
      settings.title = title;
      settings.metaDescription = metaDescription;
      settings.keywords = keywords;
      settings.whatsappNumber = whatsappNumber || '';
      settings.isActive = isActive;
      await settings.save();
    } else {
      settings = await SeoSettings.create({
        pageType,
        referenceId,
        title,
        metaDescription,
        keywords,
        whatsappNumber: whatsappNumber || '',
        isActive
      });
    }

    // Flush cache for immediate update
    flushCache();

    res.status(201).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete SEO setting
// @route   DELETE /api/admin/seo-settings/:id
// @access  Private/Admin
export const deleteSeoSetting = async (req, res) => {
  try {
    const settings = await SeoSettings.findById(req.params.id);
    if (!settings) return res.status(404).json({ message: 'Not found' });

    await settings.deleteOne();
    
    // Flush cache for immediate update
    flushCache();

    res.json({ message: 'SEO setting removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
