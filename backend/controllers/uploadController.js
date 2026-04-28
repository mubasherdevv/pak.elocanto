import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import asyncHandler from '../middleware/asyncHandler.js';
import { addWatermarkToBuffer } from '../utils/watermarkUtils.js';
import { uploadBuffer } from '../utils/cloudinary.js';

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .substring(0, 50);
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const urls = [];

  for (const file of req.files) {
    try {
      console.log(`[UPLOAD] Processing file for Cloudinary: ${file.originalname}`);
      const { category, subcategory, subSubCategory, title, city, area, hotel } = req.body;

      // Determine Cloudinary folder path
      let cloudinaryFolder = 'ads';
      const folderParts = [];
      if (category) folderParts.push(slugify(category));
      if (subcategory) folderParts.push(slugify(subcategory));
      if (subSubCategory) folderParts.push(slugify(subSubCategory));
      if (city) folderParts.push(slugify(city));
      if (area) folderParts.push(slugify(area));
      if (hotel) folderParts.push(slugify(hotel));
      
      if (folderParts.length > 0) {
        cloudinaryFolder = `ads/${folderParts.join('/')}`;
      }

      // Generate a descriptive filename (public_id) using title + random 2-3 digit number
      const randomNum = Math.floor(10 + Math.random() * 989); // 10 to 999
      const baseSlug = slugify(title) || 'ad-image';
      const publicId = `${baseSlug}-${randomNum}`;

      // Helper to sanitize context values for Cloudinary (removes | and =)
      const sanitizeContext = (val) => {
        if (!val) return '';
        return val.toString().replace(/[|=]/g, ' ').trim();
      };

      // Construct SEO Metadata (Cloudinary Context)
      const context = {
        alt: sanitizeContext(title) || 'Ad Image',
        caption: sanitizeContext(`${category}${subcategory ? ' > ' + subcategory : ''}`),
        subject: sanitizeContext(city) || 'Pakistan'
      };

      // Construct Tags
      const tags = ['ad', slugify(category), slugify(city)].filter(Boolean);

      // Check if watermark should be skipped (e.g., for profile photos)
      const skipWatermark = req.body.isProfile === 'true' || req.body.noWatermark === 'true';

      let finalBuffer = file.buffer;
      if (!skipWatermark) {
        console.log(`[UPLOAD] Applying watermark to buffer...`);
        finalBuffer = await addWatermarkToBuffer(file.buffer);
      } else {
        console.log(`[UPLOAD] Skipping watermark (isProfile/noWatermark flag detected)`);
      }

      console.log(`[UPLOAD] Uploading to Cloudinary (Folder: ${cloudinaryFolder}, Name: ${publicId})...`);
      // Upload the final buffer to Cloudinary with SEO metadata
      const result = await uploadBuffer(finalBuffer, cloudinaryFolder, publicId, { context, tags });
      
      console.log(`[UPLOAD] Success: ${result.secure_url}`);
      urls.push(result.secure_url);

    } catch (error) {
      console.error('========================================');
      console.error('[UPLOAD] FATAL ERROR processing image:');
      console.error('File:', file.originalname);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('========================================');
      
      return res.status(500).json({ 
        message: `Upload failed: ${error.message}`, 
        error: error.message,
        file: file.originalname
      });
    }
  }

  res.json({ urls });
});
