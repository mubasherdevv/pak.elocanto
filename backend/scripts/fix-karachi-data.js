import mongoose from 'mongoose';
import City from '../models/City.js';
import Area from '../models/Area.js';
import dotenv from 'dotenv';
dotenv.config();

async function deepDebug() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://admin:password12345@ac-imfoglo-shard-00-00.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-01.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-02.x3fb6wa.mongodb.net:27017/ecomm?ssl=true&replicaSet=atlas-w7le7v-shard-0&authSource=admin&appName=Cluster0";
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const karachi = await City.findOne({ name: "Karachi" });
    if (!karachi) {
      console.log('Main Karachi not found!');
      process.exit(1);
    }

    console.log(`Karachi ID: ${karachi._id} (${typeof karachi._id})`);

    // Check raw areas
    const rawAreas = await mongoose.connection.db.collection('areas').find({ city: karachi._id }).toArray();
    console.log(`Raw areas found with ObjectId lookup: ${rawAreas.length}`);

    const rawAreasStr = await mongoose.connection.db.collection('areas').find({ city: karachi._id.toString() }).toArray();
    console.log(`Raw areas found with String lookup: ${rawAreasStr.length}`);

    if (rawAreas.length === 0 && rawAreasStr.length > 0) {
       console.log('DATA TYPE MISMATCH DETECTED: City ID is stored as String in Areas collection!');
       // FIX IT: Convert all Karachi area city fields to ObjectId
       console.log('Fixing data types...');
       const result = await mongoose.connection.db.collection('areas').updateMany(
         { city: karachi._id.toString() },
         { $set: { city: karachi._id } }
       );
       console.log(`Fixed ${result.modifiedCount} areas.`);
    }

    // Delete Test Karachi
    const testKarachi = await City.findOne({ name: "Test Karachi" });
    if (testKarachi) {
      console.log('Deleting Test Karachi duplicate...');
      await City.deleteOne({ _id: testKarachi._id });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

deepDebug();
