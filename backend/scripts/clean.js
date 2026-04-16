import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import SubSubCategory from '../models/SubSubCategory.js';
import Ad from '../models/Ad.js';
import connectDB from '../config/db.js';

dotenv.config();

const cleanString = (str) => {
    if (!str) return '';
    // Pattern 1: Remove trailing 13 digit timestamp (Date.now())
    let cleaned = str.replace(/-[0-9]{13}$/, '');

    // Pattern 2: Remove trailing 24 char hex ID (Mongo ID)
    cleaned = cleaned.replace(/-[0-9a-fA-F]{24}$/, '');

    return cleaned;
};

const getUniqueSlug = async (Model, baseSlug, docId) => {
    let finalSlug = baseSlug;
    let counter = 1;
    while (await Model.findOne({ slug: finalSlug, _id: { $ne: docId } })) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
    }
    return finalSlug;
};

const migrate = async () => {
    try {
        await connectDB();
        console.log('Connected to DB. Starting migration...');

        // 1. Subcategories
        const subs = await Subcategory.find({});
        console.log(`Checking ${subs.length} subcategories...`);
        for (const sub of subs) {
            const baseSlug = cleanString(sub.slug);
            const uniqueSlug = await getUniqueSlug(Subcategory, baseSlug, sub._id);
            if (uniqueSlug !== sub.slug) {
                sub.slug = uniqueSlug;
                await sub.save();
                console.log(`Updated Sub: ${uniqueSlug}`);
            }
        }

        // 2. SubSubCategories
        const subSubs = await SubSubCategory.find({});
        console.log(`Checking ${subSubs.length} sub-subcategories...`);
        for (const ss of subSubs) {
            const baseSlug = cleanString(ss.slug);
            const uniqueSlug = await getUniqueSlug(SubSubCategory, baseSlug, ss._id);
            if (uniqueSlug !== ss.slug) {
                ss.slug = uniqueSlug;
                await ss.save();
                console.log(`Updated SubSub: ${uniqueSlug}`);
            }
        }

        // 3. Ads
        const ads = await Ad.find({});
        console.log(`Checking ${ads.length} ads...`);
        let adUpdates = 0;
        for (const ad of ads) {
            const baseSlug = cleanString(ad.slug);
            const uniqueSlug = await getUniqueSlug(Ad, baseSlug, ad._id);
            if (uniqueSlug !== ad.slug) {
                ad.slug = uniqueSlug;
                await ad.save();
                adUpdates++;
                if (adUpdates % 50 === 0) console.log(`Updated ${adUpdates} ads so far...`);
            }
        }
        console.log(`Total Ads updated: ${adUpdates}`);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
