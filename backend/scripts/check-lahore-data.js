import mongoose from 'mongoose';
import City from '../models/City.js';
import Area from '../models/Area.js';
import Hotel from '../models/Hotel.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const lahore = await City.findOne({ name: /lahore/i });
    if (!lahore) {
      console.log('Lahore not found');
      process.exit(1);
    }

    console.log(`Lahore ID: ${lahore._id}`);
    console.log(`Lahore Slug: ${lahore.slug}`);

    const areas = await Area.find({ city: lahore._id });
    console.log(`Found ${areas.length} areas for Lahore ID`);

    const hotels = await Hotel.find({ city: lahore._id });
    console.log(`Found ${hotels.length} hotels for Lahore ID`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
