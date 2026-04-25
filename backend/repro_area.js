import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Area from './models/Area.js';
import City from './models/City.js';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const city = await City.findOne({ name: /Karachi/i });
  if (city) {
    const areas = await Area.find({ city: city._id }).select('name slug customCitySlug');
    console.log('Karachi City Slug:', city.slug);
    console.log('Karachi Areas:', JSON.stringify(areas.slice(0, 5), null, 2));
  }
  process.exit(0);
}
run();
