import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Subcategory from './models/Subcategory.js';
import SubSubCategory from './models/SubSubCategory.js';
import Ad from './models/Ad.js';

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};

const importData = async () => {
  try {
    await connectDB();

    // Clear Category related data
    await Category.deleteMany();
    await Subcategory.deleteMany();
    await SubSubCategory.deleteMany();
    await Ad.deleteMany();

    // 1. Create Categories
    const catMobiles = await Category.create({ name: 'Mobiles', icon: '📱', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', slug: 'mobiles' });
    const catElectronics = await Category.create({ name: 'Electronics', icon: '💻', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', slug: 'electronics' });
    const catVehicles = await Category.create({ name: 'Vehicles', icon: '🚗', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400', slug: 'vehicles' });
    const catProperty = await Category.create({ name: 'Property', icon: '🏠', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400', slug: 'property' });
    const catJobs = await Category.create({ name: 'Jobs', icon: '💼', image: 'https://images.unsplash.com/photo-1521737706076-34a9ff3f92b1?w=400', slug: 'jobs' });
    const catFlowers = await Category.create({ name: 'Fashion', icon: '👗', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', slug: 'fashion' });
    const catPersonals = await Category.create({ name: 'Personals', icon: '❤️', image: 'https://images.unsplash.com/photo-1516575150278-77136aed6920?w=400', slug: 'personals' });
    const catHobbies = await Category.create({ name: 'Animals & Pets', icon: '🐕', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400', slug: 'animals-pets' });

    // 2. Create Subcategories
    const subMobiles = await Subcategory.create({ name: 'Mobile Phones', category: catElectronics._id, slug: 'mobile-phones' });
    const subLaptops = await Subcategory.create({ name: 'Laptops', category: catElectronics._id, slug: 'laptops' });
    const subServices = await Subcategory.create({ name: 'Services', category: catPersonals._id, slug: 'services' });

    // 3. Create Sub-Subcategories
    const ssIphone = await SubSubCategory.create({ name: 'iPhone', subcategory: subMobiles._id, slug: 'iphone' });
    const ssAndroid = await SubSubCategory.create({ name: 'Android', subcategory: subMobiles._id, slug: 'android' });
    const ssPhoneCam = await SubSubCategory.create({ name: 'Phone & Cam', subcategory: subServices._id, slug: 'phone-and-cam' });

    // 4. Create Sample Ad
    const seller = await User.findOne({}); // Just get any user if admin not found
    if (seller) {
      await Ad.create({
        seller: seller._id,
        title: 'iPhone 15 Pro Max - Exclusive Service',
        description: 'Premium iPhone service with phone and cam support. High quality guaranteed.',
        price: 1500,
        category: catPersonals._id,
        subcategory: subServices._id,
        subSubCategory: ssPhoneCam._id,
        city: 'Karachi',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'],
        condition: 'new',
        adType: 'simple',
        listingType: 'simple',
        phone: seller.phone || '03001234567',
        isApproved: true,
        isActive: true,
        isFeatured: false,
        tags: ['iphone', 'cam', 'service']
      });
    }

    console.log('✅ 3-Level Hierarchy Seeded Successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Error Seeding Data:', err);
    process.exit(1);
  }
};

importData();
