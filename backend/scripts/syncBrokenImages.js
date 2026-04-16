import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import Ad from '../models/Ad.js';
import { extractPublicId } from '../utils/cloudinary.js';

// Load environment variables
const envPath = fs.existsSync('./backend/.env') ? './backend/.env' : './.env';
dotenv.config({ path: envPath });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const syncBrokenImages = async () => {
  try {
    console.log('--- Database & Cloudinary Sync Started ---');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);

    const ads = await Ad.find({ images: { $exists: true, $not: { $size: 0 } } });
    console.log(`Found ${ads.length} ads with images to verify.`);

    let totalFixed = 0;

    for (const ad of ads) {
      let isModified = false;
      const validImages = [];

      for (const url of ad.images) {
        const pid = extractPublicId(url);
        if (!pid) {
          validImages.push(url);
          continue;
        }

        try {
          // Check if resource exists in Cloudinary
          await cloudinary.api.resource(pid);
          validImages.push(url);
        } catch (error) {
          if (error.http_code === 404) {
            console.log(`[BROKEN] Removing link for ad "${ad.title}": ${url}`);
            isModified = true;
          } else {
            console.error(`[ERROR] Checking ${pid}:`, error.message);
            validImages.push(url); // Keep if error is not 404 (timeout, etc)
          }
        }
      }

      if (isModified) {
        ad.images = validImages;
        await ad.save();
        totalFixed++;
      }
    }

    console.log(`\nSync complete! Fixed ${totalFixed} ads.`);

  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

syncBrokenImages();
