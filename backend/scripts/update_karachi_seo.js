import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function updateKarachiSeoLinks() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const City = mongoose.model('City', new mongoose.Schema({ name: String, slug: String }));
    const Area = mongoose.model('Area', new mongoose.Schema({ name: String, slug: String, customCitySlug: String, city: mongoose.Schema.Types.ObjectId }));
    const Hotel = mongoose.model('Hotel', new mongoose.Schema({ name: String, slug: String, customCitySlug: String, city: mongoose.Schema.Types.ObjectId }));
    const SeoSetting = mongoose.model('SeoSetting', new mongoose.Schema({ pagePath: String, referenceId: mongoose.Schema.Types.ObjectId, pageType: String }), 'seosettings');

    const karachi = await City.findOne({ name: /Karachi/i });
    if (!karachi) {
      console.error('Karachi city not found!');
      process.exit(1);
    }

    console.log(`Found Karachi (ID: ${karachi._id}, Slug: ${karachi.slug})`);

    const areas = await Area.find({ city: karachi._id });
    const hotels = await Hotel.find({ city: karachi._id });

    console.log(`Processing ${areas.length} Areas and ${hotels.length} Hotels...`);

    let updatedCount = 0;

    // Update Areas
    for (const area of areas) {
      const cityPart = area.customCitySlug || karachi.slug;
      const newPath = `/cities/${cityPart}/areas/${area.slug}`;
      
      const result = await SeoSetting.updateOne(
        { referenceId: area._id, pageType: 'area' },
        { $set: { pagePath: newPath } }
      );
      
      if (result.modifiedCount > 0) updatedCount++;
    }

    // Update Hotels
    for (const hotel of hotels) {
      const cityPart = hotel.customCitySlug || karachi.slug;
      const newPath = `/cities/${cityPart}/hotels/${hotel.slug}`;
      
      const result = await SeoSetting.updateOne(
        { referenceId: hotel._id, pageType: 'hotel' },
        { $set: { pagePath: newPath } }
      );
      
      if (result.modifiedCount > 0) updatedCount++;
    }

    // Update City page itself if needed
    const cityResult = await SeoSetting.updateOne(
      { referenceId: karachi._id, pageType: 'city' },
      { $set: { pagePath: `/cities/${karachi.slug}` } }
    );
    if (cityResult.modifiedCount > 0) updatedCount++;

    console.log('------------------------------------');
    console.log(`Successfully updated ${updatedCount} SEO links for Karachi.`);
    console.log('------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

updateKarachiSeoLinks();
