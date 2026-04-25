import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function repairIslamabadSeoBySlug() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const City = mongoose.model('City', new mongoose.Schema({ name: String, slug: String }));
    const Area = mongoose.model('Area', new mongoose.Schema({ name: String, slug: String, customCitySlug: String, city: mongoose.Schema.Types.ObjectId }));
    const Hotel = mongoose.model('Hotel', new mongoose.Schema({ name: String, slug: String, customCitySlug: String, city: mongoose.Schema.Types.ObjectId }));
    const SeoSetting = mongoose.model('SeoSetting', new mongoose.Schema({ 
      pagePath: String, 
      referenceId: mongoose.Schema.Types.ObjectId, 
      pageType: String 
    }), 'seosettings');

    const islamabad = await City.findOne({ name: /Islamabad/i });
    if (!islamabad) {
      console.error('Islamabad city not found!');
      process.exit(1);
    }

    const seoEntries = await SeoSetting.find({ 
      pagePath: /islamabad/i,
      pageType: { $in: ['area', 'hotel'] }
    });

    console.log(`Processing ${seoEntries.length} SEO entries by Slug matching...`);

    let updatedCount = 0;
    let deletedCount = 0;

    for (const seo of seoEntries) {
      const pathParts = seo.pagePath.split('/');
      const slugFromPath = pathParts[pathParts.length - 1];

      let target = null;
      if (seo.pageType === 'area') {
        target = await Area.findOne({ slug: slugFromPath, city: islamabad._id });
      } else {
        target = await Hotel.findOne({ slug: slugFromPath, city: islamabad._id });
      }

      if (target) {
        const cityPart = target.customCitySlug || islamabad.slug;
        const typePart = seo.pageType === 'area' ? 'areas' : 'hotels';
        const newPath = `/cities/${cityPart}/${typePart}/${target.slug}`;

        const existing = await SeoSetting.findOne({ pagePath: newPath, _id: { $ne: seo._id } });

        if (existing) {
          await SeoSetting.deleteOne({ _id: seo._id });
          deletedCount++;
        } else {
          await SeoSetting.updateOne(
            { _id: seo._id },
            { 
              $set: { 
                referenceId: target._id,
                pagePath: newPath 
              } 
            }
          );
          updatedCount++;
        }
      }
    }

    console.log('------------------------------------');
    console.log(`Successfully updated ${updatedCount} entries using Slug matching.`);
    console.log(`Deleted ${deletedCount} redundant entries.`);
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

repairIslamabadSeoBySlug();
