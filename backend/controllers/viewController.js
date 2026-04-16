import Ad from '../models/Ad.js';
import FeaturedAdView from '../models/FeaturedAdView.js';
import SimpleAdView from '../models/SimpleAdView.js';
import asyncHandler from '../middleware/asyncHandler.js';

const BOT_USER_AGENTS = [
  'bot', 'crawl', 'spider', 'slurp', 'search', 'indexer', 'scraper',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot'
];

const isBot = (userAgent) => {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
};


export const trackAdView = asyncHandler(async (req, res) => {
  const { adId } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  
  if (isBot(userAgent)) {
    return res.json({ success: true, message: 'Bot detected, view not counted' });
  }

  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
  const userId = req.user?._id || null;
  const localStorageId = req.body.localStorageId || null;
  const page = req.body.page || 'ads';

  const ad = await Ad.findById(adId);
  if (!ad) {
    return res.status(404).json({ message: 'Ad not found' });
  }

  if (ad.listingType === 'featured' || ad.adType === 'featured') {
    await FeaturedAdView.create({
      adId,
      page,
      ipAddress,
      userAgent
    });
    
    await Ad.findByIdAndUpdate(adId, { $inc: { views: 1 } });
    
    return res.json({ success: true, type: 'featured', impressions: true });
  }

  const existingView = await SimpleAdView.findOne({
    adId,
    $or: [
      { userId: userId },
      { localStorageId: localStorageId },
      { 
        userId: null, 
        localStorageId: null,
        ipAddress: ipAddress,
        expiresAt: { $gt: new Date() }
      }
    ]
  });

  if (existingView) {
    return res.json({ success: true, type: 'simple', unique: false, message: 'Already viewed' });
  }

  await SimpleAdView.create({
    adId,
    userId,
    ipAddress,
    userAgent,
    localStorageId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await Ad.findByIdAndUpdate(adId, { $inc: { views: 1 } });

  res.json({ success: true, type: 'simple', unique: true });
});

export const trackBulkViews = asyncHandler(async (req, res) => {
  const { adIds } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  
  if (isBot(userAgent)) {
    return res.json({ success: true, message: 'Bot detected' });
  }

  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
  const userId = req.user?._id || null;
  const localStorageId = req.body.localStorageId || null;

  const featuredViews = [];
  const simpleViewsToCheck = [];

  for (const adId of adIds) {
    const ad = await Ad.findById(adId);
    if (!ad) continue;

    if (ad.listingType === 'featured' || ad.adType === 'featured') {
      featuredViews.push({
        adId,
        page: 'ads',
        ipAddress,
        userAgent
      });
    } else {
      simpleViewsToCheck.push(adId);
    }
  }

  if (featuredViews.length > 0) {
    await FeaturedAdView.insertMany(featuredViews);
    
    await Ad.updateMany(
      { _id: { $in: featuredViews.map(v => v.adId) } },
      { $inc: { views: 1 } }
    );
  }

  const existingSimpleViews = await SimpleAdView.find({
    adId: { $in: simpleViewsToCheck },
    $or: [
      { userId: userId },
      { localStorageId: localStorageId }
    ]
  }).select('adId');

  const existingIds = new Set(existingSimpleViews.map(v => v.adId.toString()));

  const newSimpleViews = [];
  const newViewAdIds = [];

  for (const adId of simpleViewsToCheck) {
    if (!existingIds.has(adId.toString())) {
      newSimpleViews.push({
        adId,
        userId,
        ipAddress,
        userAgent,
        localStorageId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      newViewAdIds.push(adId);
    }
  }

  if (newSimpleViews.length > 0) {
    await SimpleAdView.insertMany(newSimpleViews);
    
    await Ad.updateMany(
      { _id: { $in: newViewAdIds } },
      { $inc: { views: 1 } }
    );
  }

  res.json({
    success: true,
    featuredTracked: featuredViews.length,
    simpleTracked: newViewAdIds.length
  });
});

export const getAdViews = asyncHandler(async (req, res) => {
  const { adId } = req.params;
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || 'unknown';
  const userId = req.user?._id || null;
  const localStorageId = req.query.localStorageId || null;

  if (!adId || !adId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid ad ID format' });
  }

  const ad = await Ad.findById(adId);
  if (!ad) {
    return res.status(404).json({ message: 'Ad not found' });
  }

  const totalViews = ad.views || 0;

  let uniqueViews = 0;
  let hasViewed = false;

  if (ad.listingType === 'featured' || ad.adType === 'featured') {
    uniqueViews = await FeaturedAdView.countDocuments({ adId });
  } else {
    uniqueViews = await SimpleAdView.countDocuments({ adId });
    hasViewed = await SimpleAdView.findOne({
      adId,
      $or: [
        { userId: userId },
        { localStorageId: localStorageId }
      ]
    }).lean();
  }

  res.json({
    adId,
    totalViews,
    uniqueViews,
    listingType: ad.listingType || ad.adType,
    hasViewed: !!hasViewed
  });
});


