import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

const envPath = fs.existsSync('./backend/.env') ? './backend/.env' : './.env';
dotenv.config({ path: envPath });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const syncCloudinaryToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Ad = mongoose.model('Ad', new mongoose.Schema({ title: String, images: [String], phone: String }));

    console.log('Fetching all resources from Cloudinary "ads" folder...');
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'ads/',
      max_results: 500
    });

    console.log(`Found ${result.resources.length} images on Cloudinary.`);

    let updatedCount = 0;

    for (let res of result.resources) {
      const publicId = res.public_id;
      const secureUrl = res.secure_url;

      // Extract meaningful part (e.g. 03276333001-beautiful-luxury...)
      const filename = publicId.split('/').pop();
      const cleanName = filename.replace(/-\d+$/, '');

      if (cleanName.length < 5) {
        console.log(`[SKIPPING] Filename too short: ${filename}`);
        continue;
      }

      const phoneMatch = filename.match(/\d{10,}/); // Match 10+ digits
      const phoneNumber = phoneMatch ? phoneMatch[0] : null;

      let ad = null;
      if (phoneNumber) {
        ad = await Ad.findOne({ phone: new RegExp(phoneNumber.slice(-10), 'i') });
      }

      if (!ad) {
        // Fuzzy match by title keywords
        const keywords = cleanName.split('-').filter(k => k.length > 3);
        if (keywords.length > 1) {
          ad = await Ad.findOne({ title: new RegExp(keywords.slice(0, 3).join('.*'), 'i') });
        }
      }

      if (ad) {
        console.log(`[SYNCING] "${filename}" -> Ad: "${ad.title}"`);

        // Clear old cloudinary URLs and add the new working one
        // We keep local uploads just in case, but replace cloudinary ones
        const nonCloudinaryImages = ad.images.filter(img => !img.includes('cloudinary.com'));

        if (!ad.images.includes(secureUrl)) {
          // If it's the first match for this ad, we replace. 
          // If it's a subsequent match (multiple images), we append.
          if (ad.images.some(img => img.includes('cloudinary.com') && !img.startsWith('http'))) {
            // This is a complex case, let's just push unique
            ad.images.push(secureUrl);
          } else {
            // Simplest: keep unique working URLs
            const currentWorking = ad.images.filter(img => img.startsWith('https://res.cloudinary.com/dvoks2cvj/image/upload/v177'));
            ad.images = [...new Set([...currentWorking, secureUrl, ...nonCloudinaryImages])];
          }

          await ad.save();
          updatedCount++;
        }
      }
    }

    console.log(`\nSynchronization complete! Updated ${updatedCount} ads.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

syncCloudinaryToDb();
