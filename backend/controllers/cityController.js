import City from '../models/City.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { delCache } from '../utils/cache.js';

// @desc    Get all cities
// @route   GET /api/cities
// @access  Public
export const getCities = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.showOnHome === 'true') {
    filter.showOnHome = true;
  }
  
  const cities = await City.find(filter).sort({ name: 1 });
  
  // Auto-migrate: generate slugs for cities that don't have one
  for (const city of cities) {
    if (!city.slug) {
      city.slug = city.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await city.save();
    }
  }
  
  res.json(cities);
});

// @desc    Get a single city by slug
// @route   GET /api/cities/slug/:slug
// @access  Public
export const getCityBySlug = asyncHandler(async (req, res) => {
  let city = await City.findOne({ slug: req.params.slug });
  
  // If not found by slug, maybe it doesn't have a slug but exists by name?
  if (!city) {
    // Try finding by name if slug-like match
    const nameMatch = req.params.slug.replace(/-/g, ' ');
    city = await City.findOne({ name: { $regex: new RegExp(`^${nameMatch}$`, 'i') } });
    
    if (city && !city.slug) {
      city.slug = city.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await city.save();
    }
  }

  if (city) {
    res.json(city);
  } else {
    res.status(404).json({ message: 'City not found' });
  }
});

// @desc    Create a city
// @route   POST /api/cities
// @access  Private/Admin
export const createCity = asyncHandler(async (req, res) => {
  const { name, image, isPopular, showOnHome } = req.body;
  const cityExists = await City.findOne({ name });

  if (cityExists) {
    return res.status(400).json({ message: 'City already exists' });
  }

  const city = await City.create({ name, image, isPopular, showOnHome });
  delCache('global_sitemap_xml');
  res.status(201).json(city);
});

// @desc    Update a city
// @route   PUT /api/cities/:id
// @access  Private/Admin
export const updateCity = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id);

  if (city) {
    city.name = req.body.name || city.name;
    city.image = req.body.image !== undefined ? req.body.image : city.image;
    city.isPopular = req.body.isPopular !== undefined ? req.body.isPopular : city.isPopular;
    city.showOnHome = req.body.showOnHome !== undefined ? req.body.showOnHome : city.showOnHome;
    
    // Allow manual slug override
    if (req.body.slug) {
      city.slug = req.body.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    const updatedCity = await city.save();
    delCache('global_sitemap_xml');
    res.json(updatedCity);
  } else {
    res.status(404).json({ message: 'City not found' });
  }
});

// @desc    Delete a city
// @route   DELETE /api/cities/:id
// @access  Private/Admin
export const deleteCity = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id);

  if (city) {
    await city.deleteOne();
    delCache('global_sitemap_xml');
    res.json({ message: 'City removed' });
  } else {
    res.status(404).json({ message: 'City not found' });
  }
});

// @desc    Bulk delete cities
// @route   DELETE /api/cities/bulk
// @access  Private/Admin
export const bulkDeleteCities = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ message: 'Invalid IDs format' });
  }

  const result = await City.deleteMany({ _id: { $in: ids } });
  delCache('global_sitemap_xml');
  res.json({ message: `${result.deletedCount} cities removed successfully.` });
});

// @desc    Bulk update cities (e.g. toggle popular)
// @route   PUT /api/cities/bulk
// @access  Private/Admin
export const bulkUpdateCities = asyncHandler(async (req, res) => {
  const { ids, updateData } = req.body;

  if (!ids || !Array.isArray(ids) || !updateData) {
    return res.status(400).json({ message: 'Invalid request format' });
  }

  const result = await City.updateMany(
    { _id: { $in: ids } },
    { $set: updateData }
  );

  res.json({ message: `Updated ${result.modifiedCount} cities successfully.` });
});

// @desc    Bulk create cities
// @route   POST /api/cities/bulk
// @access  Private/Admin
export const bulkCreateCities = asyncHandler(async (req, res) => {
  const { names } = req.body;

  if (!names || !Array.isArray(names)) {
    return res.status(400).json({ message: 'Invalid names format' });
  }

  const created = [];
  const skipped = [];

  for (let entry of names) {
    let name, slug;
    
    if (typeof entry === 'object') {
      name = entry.name?.trim();
      slug = entry.slug?.trim();
    } else {
      const parts = entry.split('|').map(p => p.trim());
      name = parts[0];
      slug = parts[1];
    }

    if (!name) continue;

    const exists = await City.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (exists) {
      skipped.push(name);
      continue;
    }

    const cityData = { name };
    if (slug) cityData.slug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const city = await City.create(cityData);
    created.push(city);
  }

  res.status(201).json({
    message: `Created ${created.length} cities, skipped ${skipped.length} duplicates.`,
    created,
    skipped
  });
});
