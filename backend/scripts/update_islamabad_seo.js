import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function updateIslamabadSeoLinks() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const City = mongoose.model('City', new mongoose.Schema({ name: String, slug: String }));
    const Area = mongoose.model('Area', new mongoose.Schema({ name: String, slug: String, customCitySlug: String, city: mongoose.Schema.Types.ObjectId }));
    const Hotel = mongoose.model('Hotel', new mongoose.Schema({ name: String, slug: String, customCitySlug: String, city: mongoose.Schema.Types.ObjectId }));
    const SeoSetting = mongoose.model('SeoSetting', new mongoose.Schema({ pagePath: String, referenceId: mongoose.Schema.Types.ObjectId, pageType: String }), 'seosettings');

    const islamabad = await City.findOne({ name: /Islamabad/i });
    if (!islamabad) {
      console.error('Islamabad city not found!');
      process.exit(1);
    }

    const areas = await Area.find({ city: islamabad._id });
    const hotels = await Hotel.find({ city: islamabad._id });

    let updatedCount = 0;

    for (const area of areas) {
      const cityPart = area.customCitySlug || islamabad.slug;
      const newPath = `/cities/${cityPart}/areas/${area.slug}`;
      const result = await SeoSetting.updateOne(
        { referenceId: area._id, pageType: 'area' },
        { $set: { pagePath: newPath } }
      );
      if (result.modifiedCount > 0) updatedCount++;
    }

    for (const hotel of hotels) {
      const cityPart = hotel.customCitySlug || islamabad.slug;
      const newPath = `/cities/${cityPart}/hotels/${hotel.slug}`;
      const result = await SeoSetting.updateOne(
        { referenceId: hotel._id, pageType: 'hotel' },
        { $set: { pagePath: newPath } }
      );
      if (result.modifiedCount > 0) updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} SEO links for Islamabad.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateIslamabadSeoLinks();
