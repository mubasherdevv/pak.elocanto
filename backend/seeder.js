import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Ad from './models/Ad.js';

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};

const categories = [
  { name: 'Mobiles', icon: '📱', description: 'Mobile phones and accessories', slug: 'mobiles' },
  { name: 'Vehicles', icon: '🚗', description: 'Cars, bikes and other vehicles', slug: 'vehicles' },
  { name: 'Property', icon: '🏠', description: 'Houses, apartments for rent and sale', slug: 'property' },
  { name: 'Electronics', icon: '💻', description: 'Laptops, TVs and electronics', slug: 'electronics' },
  { name: 'Jobs', icon: '💼', description: 'Job listings and opportunities', slug: 'jobs' },
  { name: 'Fashion', icon: '👗', description: 'Clothes, shoes and accessories', slug: 'fashion' },
  { name: 'Animals & Pets', icon: '🐕', description: 'Pets and animals for sale', slug: 'animals-pets' },
  { name: 'Furniture', icon: '🛋️', description: 'Sofa, beds, chairs and more', slug: 'furniture' },
];

const sampleImages = [
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=600',
  'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600',
  'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=600',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
  'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=600',
];

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

const importData = async () => {
  try {
    await connectDB();

    // Clear all
    await User.deleteMany();
    await Category.deleteMany();
    await Ad.deleteMany();

    // Create admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@olx.pk',
      password: 'admin123456',
      phone: '03001234567',
      city: 'Karachi',
      isAdmin: true,
    });

    // Create sellers
    const sellers = await User.insertMany([
      { name: 'Ali Hassan', email: 'ali@example.com', password: 'password123', phone: '03011112222', city: 'Lahore', bio: 'Selling quality items since 2019' },
      { name: 'Sara Khan', email: 'sara@example.com', password: 'password123', phone: '03022223333', city: 'Karachi', bio: 'Trusted seller with 5 star ratings' },
      { name: 'Usman Raza', email: 'usman@example.com', password: 'password123', phone: '03033334444', city: 'Islamabad', bio: 'Electronics specialist' },
      { name: 'Fatima Malik', email: 'fatima@example.com', password: 'password123', phone: '03044445555', city: 'Rawalpindi' },
    ]);

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    const catMap = {};
    createdCategories.forEach(c => { catMap[c.name] = c._id; });

    // Create ads
    const ads = [
      // Mobiles
      { seller: sellers[0]._id, title: 'iPhone 14 Pro Max 256GB – Space Black', description: 'Bilkul original iPhone 14 Pro Max, 10/10 condition. Box pack, full accessories. No scratches. SIM lock nahi hai.', price: 285000, category: catMap['Mobiles'], city: 'Lahore', images: [sampleImages[0], sampleImages[1]], condition: 'used', listingType: 'featured', isFeatured: true, phone: '03011112222' },
      { seller: sellers[1]._id, title: 'Samsung Galaxy S23 Ultra 512GB', description: 'Samsung Galaxy S23 Ultra barely used, bought 3 months ago. Official PTA approved. Complete with box and accessories.', price: 245000, category: catMap['Mobiles'], city: 'Karachi', images: [sampleImages[6]], condition: 'used', listingType: 'boosted', phone: '03022223333' },
      { seller: sellers[2]._id, title: 'OnePlus 11 5G – 16GB RAM', description: 'OnePlus 11 5G, 256GB storage, 16GB RAM. Dual SIM. Screen has minor usage marks but works perfectly.', price: 120000, category: catMap['Mobiles'], city: 'Islamabad', images: [sampleImages[0]], condition: 'used', listingType: 'simple', phone: '03033334444' },
      { seller: sellers[3]._id, title: 'Xiaomi Redmi Note 12 – Brand New', description: 'Redmi Note 12 sealed box, 8GB RAM 256GB. Black colour. PTA approved.', price: 48000, category: catMap['Mobiles'], city: 'Rawalpindi', images: [sampleImages[7]], condition: 'new', listingType: 'simple', phone: '03044445555' },
      // Vehicles
      { seller: sellers[0]._id, title: 'Toyota Corolla 2020 GLi Manual', description: 'Corolla 2020 GLi, first owner, complete Original condition. 78,000 km done. New tires. No accidents. Serious buyers only.', price: 4200000, category: catMap['Vehicles'], city: 'Lahore', images: [sampleImages[1]], condition: 'used', listingType: 'featured', isFeatured: true, phone: '03011112222' },
      { seller: sellers[1]._id, title: 'Honda Civic 2022 Oriel CVT', description: 'Honda Civic 2022 Oriel CVT, 30,000 km only. Full house options, sunroof, push start. Mint condition.', price: 6800000, category: catMap['Vehicles'], city: 'Karachi', images: [sampleImages[1]], condition: 'used', listingType: 'simple', phone: '03022223333' },
      // Property
      { seller: sellers[2]._id, title: '10 Marla House for Sale – DHA Lahore', description: '10 Marla double storey house in DHA Phase 6. 5 bedrooms, 4 bathrooms, servant quarter. Corner plot. 24/7 electricity.', price: 45000000, category: catMap['Property'], city: 'Lahore', images: [sampleImages[4]], condition: 'used', listingType: 'featured', isFeatured: true, phone: '03033334444' },
      { seller: sellers[3]._id, title: '2 Bedroom Flat for Rent – Gulshan-e-Iqbal', description: 'Furnished 2 bed flat for rent. 2nd floor, lift available. Attached baths, drawing room. Rent: 45000/month.', price: 45000, category: catMap['Property'], city: 'Karachi', images: [sampleImages[4]], condition: 'used', listingType: 'simple', phone: '03044445555' },
      // Electronics
      { seller: sellers[0]._id, title: 'Dell XPS 15 Laptop – Core i7 12th Gen', description: 'Dell XPS 15 2022 model, i7-12700H, 32GB RAM, 512GB SSD, NVIDIA RTX 3050Ti. 15.6" 4K OLED display. 9/10 condition.', price: 285000, category: catMap['Electronics'], city: 'Islamabad', images: [sampleImages[3]], condition: 'used', listingType: 'boosted', phone: '03011112222' },
      { seller: sellers[1]._id, title: 'Sony 55" 4K Smart Android TV', description: 'Sony Bravia 55 inch 4K UHD, Android 11 TV. HDR, Dolby Vision. Netflix, YouTube built-in. Bought 6 months ago.', price: 185000, category: catMap['Electronics'], city: 'Lahore', images: [sampleImages[9]], condition: 'used', listingType: 'simple', phone: '03022223333' },
      // Jobs
      { seller: sellers[2]._id, title: 'PHP Web Developer Required – Islamabad', description: 'We are looking for a PHP developer with 2+ years experience. Laravel, MySQL knowledge required. Salary: 80k-120k.', price: 100000, category: catMap['Jobs'], city: 'Islamabad', images: [], condition: 'new', listingType: 'simple', phone: '03033334444' },
      // Fashion
      { seller: sellers[3]._id, title: 'Branded Suits Collection – Gents Stitched', description: 'Premium quality gents suits, 3-piece stitched. Multiple sizes available. Fabric: Luxury wool blend. Price per suit.', price: 8500, category: catMap['Fashion'], city: 'Lahore', images: [sampleImages[2]], condition: 'new', listingType: 'simple', phone: '03044445555' },
      // Animals
      { seller: sellers[0]._id, title: 'Golden Retriever Puppies for Sale', description: 'Pure breed Golden Retriever puppies, 7 weeks old. Vaccinated and dewormed. Both male and female available.', price: 35000, category: catMap['Animals & Pets'], city: 'Karachi', images: [sampleImages[8]], condition: 'new', listingType: 'simple', phone: '03011112222' },
      // Furniture
      { seller: sellers[1]._id, title: 'L-Shape Sofa Set – 7 Seater', description: '7 seater L-shape sofa set, premium fabric, wooden frame. Very comfortable. Slightly used, 9/10 condition.', price: 65000, category: catMap['Furniture'], city: 'Rawalpindi', images: [sampleImages[5]], condition: 'used', listingType: 'featured', isFeatured: true, phone: '03022223333' },
    ];

    await Ad.insertMany(ads);

    console.log('✅ Data seeded successfully!');
    console.log('\nAdmin Login:');
    console.log('  Email: admin@olx.pk');
    console.log('  Password: admin123456');
    console.log('\nSeller Login:');
    console.log('  Email: ali@example.com');
    console.log('  Password: password123');
    process.exit();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Category.deleteMany();
    await Ad.deleteMany();
    console.log('✅ Data destroyed!');
    process.exit();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
