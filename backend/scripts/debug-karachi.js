import mongoose from 'mongoose';
import City from '../models/City.js';
import Area from '../models/Area.js';
import dotenv from 'dotenv';
dotenv.config();

async function debugKarachi() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://admin:password12345@ac-imfoglo-shard-00-00.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-01.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-02.x3fb6wa.mongodb.net:27017/ecomm?ssl=true&replicaSet=atlas-w7le7v-shard-0&authSource=admin&appName=Cluster0";
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const cities = await City.find({ name: /karachi/i });
    console.log(`Found ${cities.length} city records matching "Karachi":`);
    cities.forEach(c => console.log(`- ID: ${c._id}, Name: ${c.name}, Slug: ${c.slug}`));

    if (cities.length > 0) {
      for (const city of cities) {
        const areas = await Area.find({ city: city._id });
        console.log(`Areas linked to ID ${city._id}: ${areas.length}`);
        if (areas.length > 0) {
           console.log(`Example Area: ${areas[0].name}, Slug: ${areas[0].slug}`);
        }
      }
    }

    const allAreas = await Area.find({}).populate('city');
    const karachiAreas = allAreas.filter(a => a.city?.name?.toLowerCase().includes('karachi'));
    console.log(`\nTotal Areas found for any "Karachi" city via population: ${karachiAreas.length}`);
    
    if (karachiAreas.length > 0) {
        console.log(`Example Karachi Area City Info:`, {
            id: karachiAreas[0].city._id,
            name: karachiAreas[0].city.name,
            slug: karachiAreas[0].city.slug
        });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugKarachi();
