import Area from '../models/Area.js';
import City from '../models/City.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { delCache, flushCache } from '../utils/cache.js';
import mongoose from 'mongoose';


// @desc    Get all areas (optionally filter by city slug)
// @route   GET /api/areas?city=city-slug
// @access  Public
export const getAreas = asyncHandler(async (req, res) => {
  const { city, showOnHome } = req.query;
  let filter = {};

  if (city) {

    if (mongoose.Types.ObjectId.isValid(city)) {
      const cityId = new mongoose.Types.ObjectId(city);
      const cityDoc = await City.findById(cityId);
      
      // Attempt 1: By ID or Custom Slug
      let searchFilter = {
        $or: [
          { city: cityId }
        ]
      };
      if (cityDoc) {
        searchFilter.$or.push({ customCitySlug: cityDoc.slug });
      }
      
      let results = await Area.find({ ...filter, ...searchFilter }).populate('city', 'name slug').sort({ name: 1 });
      
      // Fallback: If 0 results and we have a city name, try searching by city name
      if (results.length === 0 && cityDoc) {
        const otherCitiesWithSameName = await City.find({ name: cityDoc.name });
        const cityIds = otherCitiesWithSameName.map(c => c._id);
        results = await Area.find({ 
           ...filter, 
           city: { $in: cityIds } 
        }).populate('city', 'name slug').sort({ name: 1 });
      }
      
      return res.json(results);
    } else {
      // ... existing slug/name logic ...
      let cityDoc = await City.findOne({ slug: city });
      if (!cityDoc) {
        const nameMatch = city.replace(/-/g, ' ');
        cityDoc = await City.findOne({ name: { $regex: new RegExp(`^${nameMatch}$`, 'i') } });
      }

      if (cityDoc) {
        filter = {
          ...filter,
          $or: [
            { city: cityDoc._id },
            { customCitySlug: city }
          ]
        };
      } else {
        filter = { ...filter, customCitySlug: city };
      }
    }
  }


  if (showOnHome === 'true') {
    filter.showOnHome = true;
  }

  const areas = await Area.find(filter).populate('city', 'name slug').sort({ name: 1 });
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

  const area = await Area.create({ name, slug: req.body.slug, customCitySlug: req.body.customCitySlug, city, showOnHome });

  delCache('global_sitemap_xml');
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
  if (req.body.slug) area.slug = req.body.slug;
  if (req.body.customCitySlug !== undefined) area.customCitySlug = req.body.customCitySlug;
  if (req.body.city) area.city = req.body.city;

  if (req.body.isActive !== undefined) area.isActive = req.body.isActive;
  if (req.body.showOnHome !== undefined) area.showOnHome = req.body.showOnHome;


  const updated = await area.save();
  delCache('global_sitemap_xml');
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
  delCache('global_sitemap_xml');
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

  if (created.length > 0) flushCache();

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
  if (result.deletedCount > 0) flushCache();
  res.json({ message: `${result.deletedCount} areas removed successfully.` });
});

// @desc    Bulk update areas (slugs/names)
// @route   PUT /api/areas/bulk
// @access  Private/Admin
export const bulkUpdateAreas = asyncHandler(async (req, res) => {
  const { ids, updateData, pattern } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ message: 'Invalid IDs format' });
  }

  // If pattern is provided, we auto-generate slugs based on area name
  if (pattern === 'clean-name') {
    const areas = await Area.find({ _id: { $in: ids } });
    for (let area of areas) {
      area.slug = area.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      await area.save();
    }
    flushCache();
    return res.json({ message: `${areas.length} area slugs cleaned successfully.` });
  }

  const result = await Area.updateMany({ _id: { $in: ids } }, { $set: updateData });
  flushCache();
  res.json({ message: `${result.modifiedCount} areas updated successfully.` });
});

