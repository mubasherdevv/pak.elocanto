import mongoose from 'mongoose';
import dotenv from 'dotenv';
import https from 'https';
dotenv.config();

const URI = process.env.MONGO_URI;

const checkUrl = (url) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => resolve(false));
    });
};

const analyzeImages = async () => {
  try {
    await mongoose.connect(URI);
    const Ad = mongoose.model('Ad', new mongoose.Schema({images: [String]}));
    const ads = await Ad.find({ 'images.0': { $exists: true } });
    
    let working = 0;
    let broken = 0;
    
    console.log(`Analyzing ${ads.length} ads...`);
    
    for (let ad of ads) {
        for (let url of ad.images) {
            if (url.includes('cloudinary.com')) {
                const isOk = await checkUrl(url);
                if (isOk) {
                    working++;
                    console.log('OK:', url);
                } else {
                    broken++;
                    // console.log('FAIL:', url);
                }
            }
        }
    }
    
    console.log(`\nSUMMARY:`);
    console.log(`Working: ${working}`);
    console.log(`Broken: ${broken}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

analyzeImages();
