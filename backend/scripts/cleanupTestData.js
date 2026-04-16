import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Ad from '../models/Ad.js';

dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

const gibberishPatterns = [
  /^fdsf$/i,
  /^fdfd$/i,
  /^fdd+$/i,
  /^zxcfzx$/i,
  /^test$/i,
  /^asdf$/i,
  /^jgvfhj$/i,
  /^[a-z]{1,4}$/ // Very short titles that are likely gibberish
];

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for cleanup...');

    const allAds = await Ad.find({});
    console.log(`Found ${allAds.length} total ads.`);

    let deletedCount = 0;
    for (const ad of allAds) {
      const isGibberish = gibberishPatterns.some(pattern => pattern.test(ad.title)) || 
                          (ad.description && ad.description.length < 5 && ad.description.includes('fdfd'));
      
      if (isGibberish) {
        console.log(`Deleting gibberish ad: "${ad.title}" (ID: ${ad._id})`);
        await Ad.findByIdAndDelete(ad._id);
        deletedCount++;
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} ads.`);
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

cleanup();
