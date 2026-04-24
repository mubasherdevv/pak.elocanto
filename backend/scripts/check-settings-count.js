import mongoose from 'mongoose';
import Settings from '../models/Settings.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://admin:password12345@ac-imfoglo-shard-00-00.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-01.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-02.x3fb6wa.mongodb.net:27017/ecomm?ssl=true&replicaSet=atlas-w7le7v-shard-0&authSource=admin&appName=Cluster0";
    await mongoose.connect(uri);
    const count = await Settings.countDocuments({});
    console.log('Total Settings Docs:', count);
    const all = await Settings.find({});
    all.forEach((s, i) => {
      console.log(`Doc ${i}: ID=${s._id}, Registration=${s.enableUserRegistration}, Login=${s.enableUserLogin}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
