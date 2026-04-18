import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Ad from '../models/Ad.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import cloudinary, { extractPublicId } from '../utils/cloudinary.js';

// Load env
const envPath = fs.existsSync('./.env') ? './.env' : fs.existsSync('./backend/.env') ? './backend/.env' : null;
if (envPath) dotenv.config({ path: envPath });
else dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .substring(0, 50);
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Error: ${error.message}`);
    process.exit(1);
  }
};

const migrate = async () => {
  await connectDB();

  console.log(`\n--- ${DRY_RUN ? 'DRY RUN' : 'LIVE'} IMAGE MIGRATION STARTED ---\n`);

  const ads = await Ad.find({})
    .populate('category', 'name')
    .populate('subcategory', 'name');

  console.log(`Total Ads to process: ${ads.length}`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const ad of ads) {
    console.log(`\nAd [${ad._id}]: ${ad.title}`);
    
    if (!ad.images || ad.images.length === 0) {
      console.log('  -> No images found, skipping.');
      skippedCount++;
      continue;
    }

    const newImages = [...ad.images];
    let adModified = false;

    for (let i = 0; i < ad.images.length; i++) {
        const url = ad.images[i];
        if (!url.includes('cloudinary.com')) {
          console.log(`  - Image ${i+1}: Not a Cloudinary URL, skipping.`);
          continue;
        }

        const currentPublicId = extractPublicId(url);
        if (!currentPublicId) {
            console.log(`  - Image ${i+1}: Could not extract public_id, skipping.`);
            continue;
        }

        // Generate new naming
        const randomNum = Math.floor(10 + Math.random() * 989); // 10 to 999
        const baseSlug = slugify(ad.title) || 'ad-image';
        
        // Keep the same folder if possible
        const folder = currentPublicId.includes('/') ? currentPublicId.split('/').slice(0, -1).join('/') : 'ads';
        const newPublicId = `${folder}/${baseSlug}-${randomNum}`;

        if (currentPublicId === newPublicId) {
            console.log(`  - Image ${i+1}: Already correctly named, updating metadata only.`);
        }

        console.log(`  - Image ${i+1}: ${currentPublicId} -> ${newPublicId}`);

        if (!DRY_RUN) {
          try {
            // 1. Rename on Cloudinary
            if (currentPublicId !== newPublicId) {
                await cloudinary.uploader.rename(currentPublicId, newPublicId, { overwrite: true });
            }

            // 2. Update Metadata (Context & Tags)
            const context = {
                alt: ad.title,
                caption: `${ad.category?.name || 'Ad'}${ad.subcategory?.name ? ' > ' + ad.subcategory.name : ''}`,
                subject: ad.city || 'Pakistan'
            };
            const tags = ['ad', 'migrated', slugify(ad.category?.name), slugify(ad.city)].filter(Boolean);

            await cloudinary.uploader.explicit(newPublicId, {
                type: 'upload',
                context,
                tags
            });

            // 3. Update URL in array
            // Cloudinary URLs follow a pattern, we can replace the publicId segment
            const oldPublicIdWithVersion = url.split('/upload/')[1].split('.').slice(0, -1).join('.');
            // However, it's safer to just let Cloudinary return the new result or construct it
            // For simplicity and speed, we'll swap the publicId segment in the string
            // Cloudinary URLs: .../upload/[version]/[public_id].[ext]
            const urlParts = url.split('/upload/');
            const versionAndRest = urlParts[1].split('/');
            // If the first part is a version (starts with 'v'), keep it, otherwise it's just publicId
            let newUrlRest;
            if (versionAndRest[0].startsWith('v')) {
                newUrlRest = [versionAndRest[0], ...newPublicId.split('/')].join('/') + '.' + url.split('.').pop();
            } else {
                newUrlRest = newPublicId + '.' + url.split('.').pop();
            }
            
            newImages[i] = `${urlParts[0]}/upload/${newUrlRest}`;
            adModified = true;
            successCount++;

          } catch (err) {
            console.error(`    ERROR migrating image ${i+1}:`, err.message);
            errorCount++;
          }
        } else {
          successCount++;
          adModified = true; // Mark as modified for log purposes
        }
    }

    if (adModified && !DRY_RUN) {
        ad.images = newImages;
        await ad.save();
        console.log('  -> Database updated.');
    }
  }

  console.log(`\n--- MIGRATION SUMMARY ---`);
  console.log(`Processed: ${ads.length} ads`);
  console.log(`Success:   ${successCount} images`);
  console.log(`Skipped:   ${skippedCount} ads`);
  console.log(`Errors:    ${errorCount} images`);
  console.log(`-------------------------\n`);

  process.exit();
};

migrate().catch(err => {
  console.error('[FATAL] Migration failed:', err);
  process.exit(1);
});
