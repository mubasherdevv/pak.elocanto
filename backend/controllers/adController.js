import Ad from '../models/Ad.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import SubSubCategory from '../models/SubSubCategory.js';
import City from '../models/City.js';
import Area from '../models/Area.js';
import Hotel from '../models/Hotel.js';
import ActivityLog from '../models/ActivityLog.js';
import Settings from '../models/Settings.js';
import SimpleAdView from '../models/SimpleAdView.js';
import FeaturedAdView from '../models/FeaturedAdView.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { getCache, setCache } from '../utils/cache.js';
import { deleteFromCloudinary, extractPublicId, isConfigured } from '../utils/cloudinary.js';
import { publishToGoogleIndexing } from '../utils/googleIndexing.js';
import { sendAdRejectionEmail } from '../utils/email.js';

const getSettings = async () => {
  const cachedSettings = getCache('site_settings');
  if (cachedSettings) return cachedSettings;

  let settings = await Settings.findOne({}).lean();
  if (!settings) settings = await Settings.create({});

  setCache('site_settings', settings, 3600);
  return settings;
};

// @desc    Get all ads with filters & pagination
// @route   GET /api/ads
// @access  Public
export const getAds = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const pageSize = parseInt(req.query.pageSize) || settings.featuredAdsPerPage || 12;
  const page = parseInt(req.query.page) || 1;

  const query = {
    isActive: true,
    isApproved: true,
    expiresAt: { $gt: new Date() }
  };

  // Keyword search
  if (req.query.keyword) {
    query.$text = { $search: req.query.keyword };
  }

  // Optimize Filter Resolve: Fetch necessary docs in parallel
  const filterPromises = [];
  if (req.query.category) filterPromises.push(Category.findOne({ $or: [{ slug: req.query.category }, { _id: req.query.category.match(/^[0-9a-fA-F]{24}$/) ? req.query.category : null }] }).lean());
  else filterPromises.push(Promise.resolve(null));

  if (req.query.subcategory) filterPromises.push(Subcategory.findOne({ $or: [{ slug: req.query.subcategory }, { _id: req.query.subcategory.match(/^[0-9a-fA-F]{24}$/) ? req.query.subcategory : null }] }).lean());
  else filterPromises.push(Promise.resolve(null));

  if (req.query.city) filterPromises.push(City.findOne({ slug: req.query.city }).lean());
  else filterPromises.push(Promise.resolve(null));

  const [cat, sub, cityDoc] = await Promise.all(filterPromises);

  if (cat) query.category = cat._id;
  if (sub) query.subcategory = sub._id;
  if (cityDoc) {
    query.city = { $regex: `^${cityDoc.name}$`, $options: 'i' };
  } else if (req.query.city) {
    query.city = { $regex: req.query.city, $options: 'i' };
  }

  // Listing Type / Ad Type Filtering
  const listingType = req.query.listingType || req.query.adType;
  if (listingType === 'featured') {
    query.isFeatured = true;
  } else if (listingType === 'simple') {
    query.isFeatured = false;
  }

  // Sorting
  let sortBy = { isFeatured: -1, createdAt: -1 };
  if (req.query.sort === 'price_asc') sortBy = { isFeatured: -1, price: 1 };
  if (req.query.sort === 'price_desc') sortBy = { isFeatured: -1, price: -1 };
  if (req.query.sort === 'oldest') sortBy = { isFeatured: -1, createdAt: 1 };

  // Parallelize Count and Fetch
  const [count, ads] = await Promise.all([
    Ad.countDocuments(query),
    Ad.find(query)
      .select('title price description category subcategory images city slug createdAt isFeatured views seller badges')
      .populate('seller', 'name profilePhoto city phone createdAt')
      .populate('category', 'name slug icon')
      .populate('subcategory', 'name image slug')
      .populate('subSubCategory', 'name image')
      .sort(sortBy)
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .lean()
  ]);

  res.json({ ads, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get featured ads (for homepage or category rotation)
// @route   GET /api/ads/featured
// @access  Public

// @desc    Get latest ads (for homepage)
// @route   GET /api/ads/latest
// @access  Public
export const getFeaturedAds = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const query = {
    isFeatured: true,
    isActive: true,
    isApproved: true,
    expiresAt: { $gt: new Date() }
  };

  if (req.query.category) {
    const cat = await Category.findOne({ slug: req.query.category });
    if (cat) query.category = cat._id;
  }

  const limit = parseInt(req.query.limit) || settings.featuredAdsLimit || 10;

  const ads = await Ad.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('seller', 'name profilePhoto city phone email')
    .populate('category', 'name slug icon')
    .populate('subcategory', 'name slug')
    .populate('area', 'name slug')
    .populate('hotel', 'name slug');

  res.json(ads);
});

// @desc    Get latest ads (for homepage)
// @route   GET /api/ads/latest
// @access  Public
export const getLatestAds = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const limit = settings.latestAdsLimit || 12;
  const ads = await Ad.find({
    isActive: true,
    isApproved: true,
    expiresAt: { $gt: new Date() }
  })
    .select('title price description category subcategory images city slug createdAt isFeatured views seller badges')
    .populate('seller', 'name profilePhoto city phone')
    .populate('category', 'name slug icon')
    .populate('subcategory', 'name image slug')
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json(ads);
});

// @desc    Get single ad by id or slug
// @route   GET /api/ads/:id
// @access  Public
export const getAdById = asyncHandler(async (req, res) => {
  const identifier = req.params.id; // Could be slug, ID, or title-ID
  if (!identifier) return res.status(400).json({ message: 'No identifier provided' });

  const cleanSlug = identifier.toLowerCase().trim();

  // 1. Try finding by slug exactly (Normalized)
  let ad = await Ad.findOne({ slug: cleanSlug })
    .populate('seller', 'name profilePhoto city phone bio createdAt isAdmin')
    .populate('category', 'name slug icon')
    .populate('subcategory', 'name image slug')
    .populate('area', 'name slug')
    .populate('hotel', 'name slug');

  // 2. Fallback: Check if identifier is a raw 24-char ID
  if (!ad && identifier.match(/^[0-9a-fA-F]{24}$/)) {
    ad = await Ad.findById(identifier)
      .populate('seller', 'name profilePhoto city phone bio createdAt isAdmin')
      .populate('category', 'name slug icon')
      .populate('subcategory', 'name image slug')
      .populate('area', 'name slug')
      .populate('hotel', 'name slug');
  }

  // 3. Fallback: If it's a "dirty" slug (title-17759... or title-69d8fa...), try to extract the ID from the end
  if (!ad && identifier.includes('-')) {
    const parts = identifier.split('-');
    const potentialId = parts[parts.length - 1];

    if (potentialId.match(/^[0-9a-fA-F]{24}$/)) {
      ad = await Ad.findById(potentialId)
        .populate('seller', 'name profilePhoto city phone bio createdAt isAdmin')
        .populate('category', 'name slug icon')
        .populate('subcategory', 'name image slug')
        .populate('area', 'name slug')
        .populate('hotel', 'name slug');
    }
  }

  if (!ad) return res.status(404).json({ message: 'Ad not found' });

  // Restrict public view of unapproved ads. Admin or Seller can see.
  if (!ad.isApproved && (!req.user || (req.user._id.toString() !== ad.seller._id.toString() && !req.user.isAdmin))) {
    return res.status(403).json({ message: 'This advertisement is pending approval.' });
  }

  // Increment views without updating updatedAt timestamp
  await Ad.updateOne({ _id: ad._id }, { $inc: { views: 1 } }, { timestamps: false });

  // Get other ads by same seller
  const sellerAds = await Ad.find({
    seller: ad.seller._id,
    _id: { $ne: ad._id },
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
    .populate('category', 'name slug icon')
    .limit(4)
    .sort({ createdAt: -1 });

  res.json({ ...ad.toObject(), sellerAds });
});

// @desc    Create ad
// @route   POST /api/ads
// @access  Private
export const createAd = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const { title, description, price, category, subcategory, city, images, condition, adType, listingType, phone, brand, isNegotiable, area, hotel, website } = req.body;

  const finalAdType = adType || listingType || 'simple';
  const duration = finalAdType === 'featured'
    ? settings.featuredAdsDuration
    : settings.simpleAdsDuration;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + duration);

  // Link Moderation Logic
  const linkMatches = description?.match(/https?:\/\/[^\s]+/g) || [];
  const linkCount = linkMatches.length;
  let isApproved = true;
  let rejectionReason = '';

  if (linkCount > 3 && !req.user.isAdmin) {
    isApproved = false;
    rejectionReason = "Description contains too many external links (max 3 allowed).";
  }

  const ad = await Ad.create({
    seller: req.user._id,
    title, description, price, category, subcategory, city,
    isApproved,
    rejectionReason,
    images: (images || []).slice(0, settings.maxImagesPerAd),
    condition: condition || 'used',
    adType: finalAdType,
    listingType: finalAdType,
    phone: phone || req.user.phone,
    brand,
    isNegotiable: isNegotiable || false,
    expiresAt,
    area: area || undefined,
    hotel: hotel || undefined,
    website: website || undefined
  });
  const populated = await ad.populate([
    { path: 'seller', select: 'name profilePhoto city' },
    { path: 'category', select: 'name slug icon' },
    { path: 'subcategory', select: 'name image slug' }
  ]);

  await ActivityLog.create({
    userId: req.user._id,
    actionType: 'POST_AD',
    description: `Posted new ad: ${title}`,
    targetId: ad._id,
    targetType: 'Ad'
  });

  // Auto-Indexing for newly created ads (if approved)
  if (ad.isApproved && settings.enableGoogleIndexing) {
    const adUrl = `${settings.siteUrl || 'https://pk.elocanto.com'}/ads/${ad.slug}`;
    publishToGoogleIndexing(adUrl, 'URL_UPDATED').catch(err => console.error('[Indexing] Error:', err));
  }

  res.status(201).json(populated);
});

// @desc    Update ad
// @route   PUT /api/ads/:id
// @access  Private (seller or admin)
export const updateAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) return res.status(404).json({ message: 'Ad not found' });
  if (ad.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const fields = ['title', 'description', 'price', 'category', 'subcategory', 'subSubCategory', 'city', 'images', 'condition', 'adType', 'listingType', 'isActive', 'isApproved', 'isFeatured', 'phone', 'expiresAt', 'brand', 'isNegotiable', 'area', 'hotel', 'badges', 'website'];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      if (['subcategory', 'subSubCategory', 'area', 'hotel'].includes(f) && req.body[f] === '') {
        ad[f] = null;
      } else if (f === 'price') {
        // Strip commas and ensure it's a number
        const val = typeof req.body[f] === 'string' ? req.body[f].replace(/,/g, '') : req.body[f];
        ad[f] = Number(val) || 0;
      } else {
        ad[f] = req.body[f];
      }
    }
  });

  // Link Moderation Logic on Update
  if (req.body.description !== undefined && !req.user.isAdmin) {
    const linkMatches = ad.description?.match(/https?:\/\/[^\s]+/g) || [];
    if (linkMatches.length > 3) {
      ad.isApproved = false;
      ad.rejectionReason = "Description contains too many external links (max 3 allowed).";
    }
  }

  try {
    // Detect removed images to clean up Cloudinary
    if (req.body.images !== undefined && isConfigured) {
      const oldImages = ad.images || [];
      const newImages = req.body.images || [];
      const removedImages = oldImages.filter(img => typeof img === 'string' && !newImages.includes(img));

      if (removedImages.length > 0) {
        console.log(`[CLEANUP] Removing ${removedImages.length} images from Cloudinary during update...`);
        for (const imgUrl of removedImages) {
          const publicId = extractPublicId(imgUrl);
          if (publicId) {
            deleteFromCloudinary(publicId).catch(err =>
              console.error(`[CLEANUP] Failed to delete image ${publicId}:`, err.message)
            );
          }
        }
      }
      ad.images = newImages;
    }

    // Check for rejection to send email
    const isRejecting = ad.isApproved === true && req.body.isApproved === false;
    const rejectionReason = req.body.rejectionReason;

    const updated = await ad.save();

    // Send rejection email if applicable
    // We send it if isApproved is false and a reason is newly provided or the ad's approval is being revoked
    if (req.body.isApproved === false && rejectionReason) {
      const seller = await User.findById(ad.seller);
      if (seller && seller.email) {
        sendAdRejectionEmail(seller, updated, rejectionReason)
          .catch(err => console.error('[EMAIL] Failed to send rejection email:', err));
      }
    }

    if (req.user.isAdmin) {
      await ActivityLog.create({
        adminId: req.user._id,
        actionType: 'EDIT_AD',
        description: `Edited ad: ${ad.title}`,
        targetId: ad._id,
        targetType: 'Ad'
      });
    } else {
      await ActivityLog.create({
        userId: req.user._id,
        actionType: 'EDIT_USER_AD',
        description: `Edited own ad: ${ad.title}`,
        targetId: ad._id,
        targetType: 'Ad'
      });
    }

    // Auto-Indexing on Update
    const settings = await getSettings();
    if (updated.isApproved && settings.enableGoogleIndexing) {
      const adUrl = `${settings.siteUrl || 'https://pk.elocanto.com'}/ads/${updated.slug}`;
      publishToGoogleIndexing(adUrl, 'URL_UPDATED').catch(err => console.error('[Indexing] Error:', err));
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update ad' });
  }
});

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private (seller or admin)
export const deleteAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) return res.status(404).json({ message: 'Ad not found' });
  if (ad.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const adTitle = ad.title;
  const isAdmin = req.user.isAdmin;

  // DOUBLE LAYER CLEANUP: Explicitly cleanup images before calling ad.deleteOne()
  // This serves as a backup to the middleware in Ad.js
  if (ad.images && ad.images.length > 0 && isConfigured) {
    console.log(`[CLEANUP-BACKUP] Delete triggered for ad: ${adTitle}. Cleaning up ${ad.images.length} images.`);
    for (const imgUrl of ad.images) {
      const pid = extractPublicId(imgUrl);
      if (pid) {
        deleteFromCloudinary(pid).catch(err =>
          console.error(`[CLEANUP-BACKUP] Failed for image ${pid}:`, err.message)
        );
      }
    }
  }

  await ad.deleteOne();

  if (isAdmin) {
    await ActivityLog.create({
      adminId: req.user._id,
      actionType: 'DELETE_AD',
      description: `Deleted ad: ${adTitle}`,
      targetType: 'Ad'
    });
  } else {
    await ActivityLog.create({
      userId: req.user._id,
      actionType: 'DELETE_USER_AD',
      description: `Deleted own ad: ${adTitle}`,
      targetType: 'Ad'
    });
  }

  // Auto-Indexing for Deletion
  const settings = await getSettings();
  if (settings.enableGoogleIndexing) {
    const adUrl = `${settings.siteUrl || 'https://pk.elocanto.com'}/ads/${ad.slug}`;
    publishToGoogleIndexing(adUrl, 'URL_DELETED').catch(err => console.error('[Indexing] Error:', err));
  }

  res.json({ message: 'Ad removed' });
});

// @desc    Get current user's ads
// @route   GET /api/ads/my
// @access  Private
export const getMyAds = asyncHandler(async (req, res) => {
  const ads = await Ad.find({ seller: req.user._id })
    .populate('category', 'name slug icon')
    .sort({ createdAt: -1 });
  res.json(ads);
});

// @desc    Get ads by seller id
// @route   GET /api/ads/seller/:sellerId
// @access  Public
export const getSellerAds = asyncHandler(async (req, res) => {
  const ads = await Ad.find({
    seller: req.params.sellerId,
    isActive: true,
    isApproved: true,
    expiresAt: { $gt: new Date() }
  })
    .populate('seller', 'name profilePhoto city phone badges createdAt')
    .populate('category', 'name slug icon')
    .sort({ createdAt: -1 });
  res.json(ads);
});

// @desc    Admin â€“ get all ads
// @route   GET /api/ads/admin/all
// @access  Admin
export const getAllAdsAdmin = asyncHandler(async (req, res) => {
  const ads = await Ad.find({})
    .populate('seller', 'name email profilePhoto phone city')
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .sort({ createdAt: -1 });
  res.json(ads);
});

// @desc    Admin â€“ Get all ads for a specific user
// @route   GET /api/ads/admin/user/:userId
// @access  Admin
export const getAdsByUserAdmin = asyncHandler(async (req, res) => {
  const ads = await Ad.find({ seller: req.params.userId })
    .populate('category', 'name')
    .sort({ createdAt: -1 });
  res.json(ads);
});

// @desc    Get similar ads by category
// @route   GET /api/ads/similar/:id
// @access  Public
export const getSimilarAds = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) return res.status(404).json({ message: 'Ad not found' });

  const similarAds = await Ad.find({
    category: ad.category,
    _id: { $ne: ad._id },
    isActive: true,
    isApproved: true,
    expiresAt: { $gt: new Date() }
  })
    .populate('seller', 'name profilePhoto city phone')
    .populate('category', 'name slug icon')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(similarAds);
});
// @desc    Get analytics for logged-in seller
// @route   GET /api/ads/my/analytics
// @access  Private/Seller
export const getSellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const myAds = await Ad.find({ seller: sellerId }).select('_id');
  const adIds = myAds.map(ad => ad._id);

  if (adIds.length === 0) {
    return res.json({ stats: [], summary: { totalViews: 0, totalImpressions: 0, topAd: null } });
  }

  const daysToFetch = 14;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToFetch);
  startDate.setHours(0, 0, 0, 0);

  // Aggregation for Views (clicks on detail page)
  const viewsData = await SimpleAdView.aggregate([
    { $match: { adId: { $in: adIds }, viewedAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" } },
        count: { $sum: 1 }
      }
    }
  ]);

  // Aggregation for Impressions (views on listing/homepage)
  const impressionsData = await FeaturedAdView.aggregate([
    { $match: { adId: { $in: adIds }, viewedAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" } },
        count: { $sum: 1 }
      }
    }
  ]);

  // Merge the data for Recharts
  const stats = [];
  for (let i = 0; i <= daysToFetch; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const views = viewsData.find(v => v._id === dateStr)?.count || 0;
    const impressions = impressionsData.find(v => v._id === dateStr)?.count || 0;

    stats.push({
      date: dateStr,
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views,
      impressions
    });
  }

  // Summary Data
  const totalViews = await Ad.aggregate([
    { $match: { seller: sellerId } },
    { $group: { _id: null, total: { $sum: "$views" } } }
  ]);

  const topAd = await Ad.findOne({ seller: sellerId })
    .sort({ views: -1 })
    .select('title views images slug');

  res.json({
    stats,
    summary: {
      totalViews: totalViews[0]?.total || 0,
      totalImpressions: impressionsData.reduce((acc, curr) => acc + curr.count, 0),
      topAd
    }
  });
});
