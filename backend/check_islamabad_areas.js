import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Area from './models/Area.js';
import City from './models/City.js';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const city = await City.findOne({ name: /Islamabad/i });
  if (city) {
    const areas = await Area.find({ city: city._id }).select('name slug customCitySlug');
    console.log('Islamabad City ID:', city._id);
    console.log('Islamabad City Slug:', city.slug);
    console.log('Areas for Islamabad:', JSON.stringify(areas, null, 2));
  } else {
    console.log('Islamabad city not found');
  }
  process.exit(0);
}
run();
