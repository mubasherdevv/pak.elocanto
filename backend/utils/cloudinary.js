import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Find and load .env from backend or current dir
const envPath = fs.existsSync('./backend/.env') 
  ? './backend/.env' 
  : fs.existsSync('./.env') ? './.env' : null;

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // Fallback
}

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (!isConfigured) {
  console.warn('[CLOUDINARY] WARNING: Cloudinary credentials missing. Persistent storage and cleanup will not work.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { isConfigured };

/**
 * Uploads a buffer to Cloudinary
 * @param {Buffer} buffer - The image buffer to upload
 * @param {String} folder - The folder in Cloudinary to store the image
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export const uploadBuffer = (buffer, folder = 'ads', publicId = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: folder,
      resource_type: 'auto',
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Deletes an image from Cloudinary
 * @param {String} publicId - The public_id of the image (including folder)
 * @returns {Promise<Object>} - The Cloudinary destroy result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`[CLOUDINARY] Delete error for ${publicId}:`, error.message);
    throw error;
  }
};

/**
 * Extracts the public_id from a Cloudinary URL
 * @param {String} url - The absolute Cloudinary secure_url
 * @returns {String|null} - The public_id or null if not valid
 */
export const extractPublicId = (url) => {
  try {
    if (!url || !url.includes('/upload/')) return null;
    
    // Split by /upload/ and take the part after it
    const parts = url.split('/upload/')[1].split('/');
    
    // Remove the version segment (e.g., v12345678) if it exists
    if (parts[0].startsWith('v') && /^\d+$/.test(parts[0].substring(1))) {
      parts.shift();
    }
    
    // Rejoin and remove the file extension
    const publicIdWithExt = parts.join('/');
    const publicId = publicIdWithExt.split('.').slice(0, -1).join('.');
    
    return publicId;
  } catch (error) {
    console.warn(`[CLOUDINARY] Could not extract public_id from URL: ${url}`);
    return null;
  }
};

export default cloudinary;
