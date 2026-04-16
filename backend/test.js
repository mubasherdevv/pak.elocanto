import mongoose from 'mongoose';
import Ad from './models/Ad.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();
connectDB();

const testExpiry = async () => {
    // Find your most recent ad and make it expire 1 hour ago
    const ad = await Ad.findOne().sort({ createdAt: -1 });
    if (ad) {
        ad.expiresAt = new Date(Date.now() - 3600000);
        await ad.save();
        console.log(`Ad "${ad.title}" has been set to EXPIRED.`);
    }
    process.exit();
};

testExpiry();
