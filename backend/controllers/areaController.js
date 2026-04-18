import Area from '../models/Area.js';
import City from '../models/City.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get all areas (optionally filter by city slug)
// @route   GET /api/areas?city=city-slug
// @access  Public
export const getAreas = asyncHandler(async (req, res) => {
  const { city, showOnHome } = req.query;
  let filter = {};

  console.log(`[getAreas] City Slug: "${city}"`);
  if (city) {
    let cityDoc = await City.findOne({ slug: city });
    if (!cityDoc) {
      console.log(`[getAreas] Slug lookup failed for "${city}". Trying name fallback...`);
      const nameMatch = city.replace(/-/g, ' ');
      cityDoc = await City.findOne({ name: { $regex: new RegExp(`^${nameMatch}$`, 'i') } });
    }

    if (cityDoc) {
      console.log(`[getAreas] Found City: "${cityDoc.name}" (${cityDoc._id})`);
      // Use $or to be safe for both String and ObjectId during transition
      filter.city = cityDoc._id;
    } else {
      console.log(`[getAreas] City not found for "${city}"`);
      return res.json([]);
    }
  }

  if (showOnHome === 'true') {
    filter.showOnHome = true;
  }

  const areas = await Area.find(filter).populate('city', 'name slug').sort({ name: 1 });
  console.log(`[getAreas] Found ${areas.length} areas for filter:`, filter);
  res.json(areas);
});

// @desc    Get single area by slug
// @route   GET /api/areas/:slug
// @access  Public
export const getAreaBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const area = await Area.findOne({ slug }).populate('city', 'name slug');
  if (area) {
    res.json(area);
  } else {
    res.status(404).json({ message: 'Area not found' });
  }
});

// @desc    Create an area
// @route   POST /api/areas
// @access  Private/Admin
export const createArea = asyncHandler(async (req, res) => {
  const { name, city, showOnHome } = req.body;

  const cityDoc = await City.findById(city);
  if (!cityDoc) {
    return res.status(400).json({ message: 'City not found' });
  }

  const existing = await Area.findOne({ name, city });
  if (existing) {
    return res.status(400).json({ message: 'Area already exists in this city' });
  }

  const area = await Area.create({ name, city, showOnHome });
  const populated = await Area.findById(area._id).populate('city', 'name slug');
  res.status(201).json(populated);
});

// @desc    Update an area
// @route   PUT /api/areas/:id
// @access  Private/Admin
export const updateArea = asyncHandler(async (req, res) => {
  const area = await Area.findById(req.params.id);
  if (!area) {
    return res.status(404).json({ message: 'Area not found' });
  }

  area.name = req.body.name || area.name;
  if (req.body.city) area.city = req.body.city;
  if (req.body.isActive !== undefined) area.isActive = req.body.isActive;
  if (req.body.showOnHome !== undefined) area.showOnHome = req.body.showOnHome;

  const updated = await area.save();
  const populated = await Area.findById(updated._id).populate('city', 'name slug');
  res.json(populated);
});

// @desc    Delete an area
// @route   DELETE /api/areas/:id
// @access  Private/Admin
export const deleteArea = asyncHandler(async (req, res) => {
  const area = await Area.findById(req.params.id);
  if (!area) {
    return res.status(404).json({ message: 'Area not found' });
  }
  await area.deleteOne();
  res.json({ message: 'Area removed' });
});
// @desc    Bulk create areas
// @route   POST /api/areas/bulk
// @access  Private/Admin
export const bulkCreateAreas = asyncHandler(async (req, res) => {
  const { names, cityId } = req.body;

  if (!names || !Array.isArray(names) || !cityId) {
    return res.status(400).json({ message: 'Invalid names or cityId format' });
  }

  const cityDoc = await City.findById(cityId);
  if (!cityDoc) {
    return res.status(400).json({ message: 'City not found' });
  }

  const created = [];
  const skipped = [];

  for (let name of names) {
    name = name.trim();
    if (!name) continue;

    const exists = await Area.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, city: cityId });
    if (exists) {
      skipped.push(name);
      continue;
    }

    const area = await Area.create({ 
      name, 
      city: new mongoose.Types.ObjectId(cityId),
      showOnHome: false 
    });
    created.push(area);
  }

  res.status(201).json({
    message: `Created ${created.length} areas in ${cityDoc.name}, skipped ${skipped.length} duplicates.`,
    created,
    skipped
  });
});
// @desc    Bulk delete areas
// @route   DELETE /api/areas/bulk
// @access  Private/Admin
export const bulkDeleteAreas = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ message: 'Invalid IDs format' });
  }

  const result = await Area.deleteMany({ _id: { $in: ids } });
  res.json({ message: `${result.deletedCount} areas removed successfully.` });
});
