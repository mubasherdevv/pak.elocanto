import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const URI = process.env.MONGO_URI;

const searchLahoreAreas = async () => {
  try {
    await mongoose.connect(URI);
    const Area = mongoose.model('Area', new mongoose.Schema({name: String, city: mongoose.Schema.Types.Mixed}));
    const City = mongoose.model('City', new mongoose.Schema({name: String}));
    
    // Search for common Lahore areas
    const names = ['Gulberg', 'DHA', 'Johar Town', 'Model Town'];
    for (let name of names) {
        const area = await Area.findOne({ name: new RegExp(name, 'i') });
        if (area) {
            const city = await City.findById(area.city);
            console.log(`Found ${area.name} | City: ${city ? city.name : 'Unknown'}`);
        } else {
            console.log(`${name} not found in database.`);
        }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

searchLahoreAreas();
