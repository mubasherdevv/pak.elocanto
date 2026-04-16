import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const updateExistingAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const result = await User.updateMany(
      { isAdmin: true },
      { $addToSet: { permissions: 'superadmin' } }
    );

    console.log(`Updated ${result.nModified || result.modifiedCount || 0} existing admin users with superadmin permission.`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

updateExistingAdmins();
