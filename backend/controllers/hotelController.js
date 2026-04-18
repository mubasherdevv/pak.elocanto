import Hotel from '../models/Hotel.js';
import City from '../models/City.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get all hotels (optionally filter by city slug)
// @route   GET /api/hotels?city=city-slug
// @access  Public
export const getHotels = asyncHandler(async (req, res) => {
  const { city, showOnHome } = req.query;
  let filter = {};

  if (city) {
    let cityDoc = await City.findOne({ slug: city });
    if (!cityDoc) {
      // Fallback: search by name if slug fails
      const nameMatch = city.replace(/-/g, ' ');
      cityDoc = await City.findOne({ name: { $regex: new RegExp(`^${nameMatch}$`, 'i') } });
    }

    if (cityDoc) {
      filter.city = cityDoc._id;
    } else {
      return res.json([]);
    }
  }

  if (showOnHome === 'true') {
    filter.showOnHome = true;
  }

  const hotels = await Hotel.find(filter).populate('city', 'name slug').sort({ name: 1 });
  res.json(hotels);
});

// @desc    Get single hotel by slug
// @route   GET /api/hotels/:slug
// @access  Public
export const getHotelBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const hotel = await Hotel.findOne({ slug }).populate('city', 'name slug');
  if (hotel) {
    res.json(hotel);
  } else {
    res.status(404).json({ message: 'Hotel not found' });
  }
});

// @desc    Create a hotel
// @route   POST /api/hotels
// @access  Private/Admin
export const createHotel = asyncHandler(async (req, res) => {
  const { name, city, showOnHome } = req.body;

  const cityDoc = await City.findById(city);
  if (!cityDoc) {
    return res.status(400).json({ message: 'City not found' });
  }

  const existing = await Hotel.findOne({ name, city });
  if (existing) {
    return res.status(400).json({ message: 'Hotel already exists in this city' });
  }

  const hotel = await Hotel.create({ name, city, showOnHome });
  const populated = await Hotel.findById(hotel._id).populate('city', 'name slug');
  res.status(201).json(populated);
});

// @desc    Update a hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
export const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) {
    return res.status(404).json({ message: 'Hotel not found' });
  }

  hotel.name = req.body.name || hotel.name;
  if (req.body.city) hotel.city = req.body.city;
  if (req.body.isActive !== undefined) hotel.isActive = req.body.isActive;
  if (req.body.showOnHome !== undefined) hotel.showOnHome = req.body.showOnHome;

  const updated = await hotel.save();
  const populated = await Hotel.findById(updated._id).populate('city', 'name slug');
  res.json(populated);
});

// @desc    Delete a hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
export const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) {
    return res.status(404).json({ message: 'Hotel not found' });
  }
  await hotel.deleteOne();
  res.json({ message: 'Hotel removed' });
});
// @desc    Bulk create hotels
// @route   POST /api/hotels/bulk
// @access  Private/Admin
export const bulkCreateHotels = asyncHandler(async (req, res) => {
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

    const exists = await Hotel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, city: cityId });
    if (exists) {
      skipped.push(name);
      continue;
    }

    const hotel = await Hotel.create({ 
      name, 
      city: new mongoose.Types.ObjectId(cityId),
      showOnHome: false 
    });
    created.push(hotel);
  }

  res.status(201).json({
    message: `Created ${created.length} hotels in ${cityDoc.name}, skipped ${skipped.length} duplicates.`,
    created,
    skipped
  });
});
// @desc    Bulk delete hotels
// @route   DELETE /api/hotels/bulk
// @access  Private/Admin
export const bulkDeleteHotels = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ message: 'Invalid IDs format' });
  }

  const result = await Hotel.deleteMany({ _id: { $in: ids } });
  res.json({ message: `${result.deletedCount} hotels removed successfully.` });
});
