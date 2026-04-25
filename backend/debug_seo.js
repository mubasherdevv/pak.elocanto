import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SeoSettings from './models/SeoSettings.js';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const settings = await SeoSettings.find();
    console.log(JSON.stringify(settings.map(s => ({ 
      _id: s._id, 
      pageType: s.pageType, 
      referenceId: s.referenceId,
      pagePath: s.pagePath 
    })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
