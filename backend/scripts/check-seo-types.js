import mongoose from 'mongoose';
import SeoSettings from '../models/SeoSettings.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://admin:password12345@ac-imfoglo-shard-00-00.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-01.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-02.x3fb6wa.mongodb.net:27017/ecomm?ssl=true&replicaSet=atlas-w7le7v-shard-0&authSource=admin&appName=Cluster0";
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const sample = await SeoSettings.find({ pageType: 'area' }).limit(10);
    sample.forEach(s => {
      console.log(`Title: ${s.title}`);
      console.log(`- RefID: ${s.referenceId}`);
      console.log(`- Type: ${typeof s.referenceId}`);
      console.log(`- Is ObjectId: ${s.referenceId instanceof mongoose.Types.ObjectId}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
