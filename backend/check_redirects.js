import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Redirect from './models/Redirect.js';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const redirects = await Redirect.find({ fromPath: { $regex: 'karachi' } });
  console.log(JSON.stringify(redirects, null, 2));
  process.exit(0);
}
run();
