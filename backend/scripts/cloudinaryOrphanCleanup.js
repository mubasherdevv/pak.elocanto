import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import Ad from '../models/Ad.js';
import { extractPublicId } from '../utils/watermarkUtils.js'; // Wait, I put it in cloudinary.js earlier too

// Load environment variables
const envPath = fs.existsSync('./backend/.env') ? './backend/.env' : './.env';
dotenv.config({ path: envPath });

// Re-configure cloudinary just in case (standalone script)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cleanupOrphans = async () => {
  try {
    console.log('--- Cloudinary Orphan Cleanup Started ---');
    
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // 2. Get all images currently in the database
    const ads = await Ad.find({}).select('images');
    const dbPublicIds = new Set();
    
    // Import helper from our utility (Need to be careful with paths in standalone)
    const { extractPublicId } = await import('../utils/cloudinary.js');

    ads.forEach(ad => {
      (ad.images || []).forEach(url => {
        const pid = extractPublicId(url);
        if (pid) dbPublicIds.add(pid);
      });
    });

    console.log(`Found ${dbPublicIds.size} unique image references in the database.`);

    // 3. List all resources in Cloudinary (under 'ads' folder)
    console.log('Fetching files from Cloudinary...');
    let cloudinaryResources = [];
    let nextCursor = null;

    do {
      const response = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'ads/',
        max_results: 500,
        next_cursor: nextCursor
      });
      
      cloudinaryResources = cloudinaryResources.concat(response.resources);
      nextCursor = response.next_cursor;
    } while (nextCursor);

    console.log(`Found ${cloudinaryResources.length} files in Cloudinary 'ads/' folder.`);

    // 4. Find Orphans
    const orphans = cloudinaryResources.filter(res => !dbPublicIds.has(res.public_id));
    
    if (orphans.length === 0) {
      console.log('No orphan images found. Everything is in sync!');
      return;
    }

    console.log(`Found ${orphans.length} orphan images. Preparing to delete...`);

    // 5. Delete Orphans
    for (const orphan of orphans) {
      console.log(`[DELETE] ${orphan.public_id} (${orphan.secure_url})`);
      await cloudinary.uploader.destroy(orphan.public_id);
    }

    console.log(`\nCleanup complete! Deleted ${orphans.length} orphans.`);

  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Check if running directly
if (import.meta.url === `file:///${path.resolve(process.argv[1]).replace(/\\/g, '/')}`) {
    cleanupOrphans();
}

export default cleanupOrphans;
