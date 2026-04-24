import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const URI = process.env.MONGO_URI;

const checkJohar = async () => {
  try {
    await mongoose.connect(URI);
    const Area = mongoose.model('Area', new mongoose.Schema({name: String, slug: String}));
    const area = await Area.findOne({ name: /Johar Town/i });
    console.log(`Area: ${area?.name} | Slug: ${area?.slug}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkJohar();
