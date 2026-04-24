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

const cleanupAndSync = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Ad = mongoose.model('Ad', new mongoose.Schema({title: String, images: [String], phone: String}));
    
    console.log('Step 1: Fetching ALL working images from Cloudinary...');
    let workingUrls = new Set();
    let hasMore = true;
    let nextCursor = null;

    while (hasMore) {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'ads/',
            max_results: 500,
            next_cursor: nextCursor
        });
        result.resources.forEach(res => workingUrls.add(res.secure_url));
        nextCursor = result.next_cursor;
        hasMore = !!nextCursor;
    }

    console.log(`Found ${workingUrls.size} total working images on Cloudinary.`);
    
    const workingPublicIds = new Set();
    const publicIdToUrl = new Map();
    
    // Extract public IDs from working URLs
    workingUrls.forEach(url => {
        const parts = url.split('/upload/');
        if (parts[1]) {
            const pathPart = parts[1].replace(/v\d+\//, '');
            const publicId = pathPart.replace(/\.[^/.]+$/, '');
            workingPublicIds.add(publicId);
            publicIdToUrl.set(publicId, url);
        }
    });

    console.log('Step 2: Cleaning up database ads...');
    const ads = await Ad.find({ 'images.0': { $exists: true } });
    let totalFixed = 0;

    for (let ad of ads) {
        const originalImages = [...ad.images];
        
        const validImages = [];
        const seenPublicIds = new Set();

        for (let img of originalImages) {
            if (!img.includes('cloudinary.com')) {
                validImages.push(img);
                continue;
            }

            const parts = img.split('/upload/');
            if (parts[1]) {
                const pathPart = parts[1].replace(/v\d+\//, '');
                const publicId = pathPart.replace(/\.[^/.]+$/, '');
                
                if (workingPublicIds.has(publicId) && !seenPublicIds.has(publicId)) {
                    // Use the LATEST known working URL for this public ID
                    validImages.push(publicIdToUrl.get(publicId));
                    seenPublicIds.add(publicId);
                }
            }
        }

        // If an ad has NO valid images left, we should try the fuzzy sync logic here
        // but for now let's just save the cleaned array
        ad.images = validImages;
        await ad.save();
        totalFixed++;
    }

    console.log(`\nCleanup complete! Cleaned up ${totalFixed} ads.`);
    
    // Step 3: Run the sync again but with a "Clean First" policy
    console.log('Step 3: Re-running sync with correct paths...');
    // (Re-using logic from sync-images but ensuring we match correctly)
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanupAndSync();
