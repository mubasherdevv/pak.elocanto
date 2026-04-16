import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const findAdmin = async () => {
  try {
    await connectDB();
    const admins = await User.find({ isAdmin: true });
    if (admins.length > 0) {
      console.log("Admin Users Found:");
      admins.forEach(u => console.log(`Email: ${u.email}, Name: ${u.name}`));
    } else {
      console.log("No admins found!");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findAdmin();
