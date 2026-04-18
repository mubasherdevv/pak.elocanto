import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import https from 'https';
import Ad from '../models/Ad.js';
import cloudinary, { extractPublicId } from '../utils/cloudinary.js';
import { addWatermarkToBuffer, WATERMARK_POSITION } from '../utils/watermarkUtils.js';

// Load environmental variables
const envPath = fs.existsSync('./.env') ? './.env' : fs.existsSync('./backend/.env') ? './backend/.env' : null;
if (envPath) dotenv.config({ path: envPath });
else dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Error: ${error.message}`);
    process.exit(1);
  }
};

const getImageBuffer = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${res.statusCode}`));
        return;
      }
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
};

const uploadBuffer = (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        public_id: publicId, 
        overwrite: true, 
        resource_type: 'image',
        format: 'webp' // Consistent format
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const main = async () => {
  await connectDB();

  console.log(`\n--- ${DRY_RUN ? 'DRY RUN' : 'LIVE'} GLOBAL RE-WATERMARKING STARTED ---\n`);
  if (LIMIT !== Infinity) console.log(`LIMIT: ${LIMIT} ads\n`);

  const ads = await Ad.find({}).limit(LIMIT);
  console.log(`Total Ads to process: ${ads.length}`);

  let totalImages = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const ad of ads) {
    console.log(`\nProcessing Ad: ${ad.title} [${ad._id}]`);
    
    if (!ad.images || ad.images.length === 0) {
      console.log(' - No images, skipping.');
      continue;
    }

    const updatedImages = [];
    let adModified = false;

    for (let i = 0; i < ad.images.length; i++) {
      const url = ad.images[i];
      totalImages++;

      if (!url.includes('cloudinary.com')) {
        console.log(`  - Image ${i+1}: Not Cloudinary, skipping.`);
        updatedImages.push(url);
        continue;
      }

      const publicId = extractPublicId(url);
      if (!publicId) {
        console.log(`  - Image ${i+1}: Could not extract Public ID, skipping.`);
        updatedImages.push(url);
        continue;
      }

      console.log(`  - Processing Image ${i+1}: ${publicId}...`);

      if (DRY_RUN) {
        console.log(`  - [DRY] Would re-watermark and overwrite ${publicId}`);
        updatedImages.push(url);
        successCount++;
        continue;
      }

      try {
        // 1. Download
        const originalBuffer = await getImageBuffer(url);
        
        // 2. Re-Watermark
        const watermarkedBuffer = await addWatermarkToBuffer(originalBuffer, {
          position: WATERMARK_POSITION.CENTER,
          watermarkWidth: 400
        });

        // 3. Upload & Overwrite
        const uploadResult = await uploadBuffer(watermarkedBuffer, publicId);
        
        // Cloudinary might change version number, so we update the URL
        updatedImages.push(uploadResult.secure_url);
        adModified = true;
        successCount++;
        console.log(`  - SUCCESS: Image ${i+1} updated.`);
      } catch (err) {
        console.error(`  - ERROR: Image ${i+1} failed: ${err.message}`);
        updatedImages.push(url);
        errorCount++;
      }
    }

    if (adModified) {
      ad.images = updatedImages;
      await ad.save();
      console.log(' -> Database ad records updated.');
    }
  }

  console.log(`\n--- MIGRATION COMPLETE ---`);
  console.log(`Ads Processed:    ${ads.length}`);
  console.log(`Images Attempted: ${totalImages}`);
  console.log(`Success:          ${successCount}`);
  console.log(`Errors:           ${errorCount}`);
  console.log(`--------------------------\n`);

  process.exit(0);
};

main().catch(err => {
  console.error('[FATAL] Script failed:', err);
  process.exit(1);
});
