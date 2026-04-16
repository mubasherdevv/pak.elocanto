import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Settings from './models/Settings.js';
import dotenv from 'dotenv';

dotenv.config();

const testSettings = async () => {
  try {
    await connectDB();
    
    // Find or create
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }

    console.log("--- Initial Settings ---");
    console.log("Site Name:", settings.siteName);
    
    // Update a nested field
    settings.socialLinks = { facebook: 'https://fb.com/test' };
    settings.featuredAdsLimit = 15;
    
    await settings.save();
    
    const updated = await Settings.findOne({});
    console.log("--- Updated Settings ---");
    console.log("Featured Ads Limit:", updated.featuredAdsLimit);
    console.log("Social Links Facebook:", updated.socialLinks?.facebook);

    if (updated.featuredAdsLimit === 15 && updated.socialLinks?.facebook === 'https://fb.com/test') {
      console.log("\n✅ Verification Successful: Settings schema supports new expanded fields correctly.");
    } else {
      console.log("\n❌ Verification Failed: Data update mismatch.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Verification Error:", err);
    process.exit(1);
  }
};

testSettings();
