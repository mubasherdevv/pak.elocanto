import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const URI = process.env.MONGO_URI;

const reconcileImages = async () => {
  try {
    await mongoose.connect(URI);
    const Ad = mongoose.model('Ad', new mongoose.Schema({title: String, images: [String]}));
    
    // Sample public IDs from Cloudinary list
    const cloudinaryPaths = [
        'ads/call-girls/college-girls/call-girls-in-pakistan-03076468884-free-home-deliv-640',
        'ads/call-girls/college-girls/gfd-764',
        'ads/03276333001-beautiful-luxury-high-class-profession-204'
    ];

    console.log('Searching for ads matching these Cloudinary paths...');
    
    for (let cp of cloudinaryPaths) {
        const filename = cp.split('/').pop();
        const ad = await Ad.findOne({ 'images.0': { $regex: new RegExp(filename, 'i') } });
        
        if (ad) {
            console.log(`\nMATCH FOUND!`);
            console.log(`Ad Title: ${ad.title}`);
            console.log(`DB Image Path: ${ad.images[0]}`);
            console.log(`Cloudinary Path: ${cp}`);
        } else {
            console.log(`No match for ${filename}`);
        }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

reconcileImages();
