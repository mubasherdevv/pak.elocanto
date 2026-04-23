import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SeoSettings from '../models/SeoSettings.js';

dotenv.config();

const analyzeSeoDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const totalSettings = await SeoSettings.countDocuments();
    const activeSettings = await SeoSettings.countDocuments({ isActive: true });
    
    const byType = await SeoSettings.aggregate([
      { $group: { _id: '$pageType', count: { $sum: 1 } } }
    ]);

    console.log('\n--- SEO SETTINGS ANALYSIS ---');
    console.log(`Total SEO Records: ${totalSettings}`);
    console.log(`Active SEO Records: ${activeSettings}`);
    console.log('\nBreakdown by Page Type:');
    byType.forEach(type => {
      console.log(`- ${type._id}: ${type.count}`);
    });
    console.log('-----------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Error analyzing SEO DB:', err);
    process.exit(1);
  }
};

analyzeSeoDb();
