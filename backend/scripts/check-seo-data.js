import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Define a simple schema for checking
const seoSchema = new mongoose.Schema({}, { strict: false });
const SeoSetting = mongoose.model('SeoSetting', seoSchema, 'seosettings');

async function checkSeo() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://admin:password12345@ac-imfoglo-shard-00-00.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-01.x3fb6wa.mongodb.net:27017,ac-imfoglo-shard-00-02.x3fb6wa.mongodb.net:27017/ecomm?ssl=true&replicaSet=atlas-w7le7v-shard-0&authSource=admin&appName=Cluster0";
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const total = await SeoSetting.countDocuments({});
    console.log(`Total SEO Settings: ${total}`);

    const sample = await SeoSetting.find({ pageType: { $in: ['area', 'hotel'] } }).limit(5);
    console.log('\nSample Area/Hotel SEO Entries:');
    sample.forEach(s => {
        console.log(`- Type: ${s.pageType}, RefID: ${s.referenceId}, Title: ${s.title}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSeo();
