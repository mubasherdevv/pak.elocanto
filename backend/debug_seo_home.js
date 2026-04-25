import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SeoSettings from './models/SeoSettings.js';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const home = await SeoSettings.findOne({ pageType: 'home' });
    console.log('Home by Type:', home);
    
    const root = await SeoSettings.findOne({ pagePath: '/' });
    console.log('Root by Path:', root);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
