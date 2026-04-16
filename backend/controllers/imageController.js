import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import asyncHandler from '../middleware/asyncHandler.js';

const CACHE_DIR = path.join(process.cwd(), 'uploads', '.cache');

const ensureCacheDir = () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
};

const getCachePath = (filename, width) => {
  const ext = '.webp';
  const w = width || 'original';
  return path.join(CACHE_DIR, `${filename}-${w}${ext}`);
};

const isCached = (cachePath) => fs.existsSync(cachePath);

/**
 * Robustly finds a file in the uploads directory by searching subfolders if needed.
 * This handles cases where the folder information might be missing in the request.
 */
const findFileInUploads = (uploadsDir, relativePath) => {
  // 1. Try the direct path (Most common case)
  const directPath = path.join(uploadsDir, relativePath);
  if (fs.existsSync(directPath) && fs.lstatSync(directPath).isFile()) {
    return directPath;
  }

  // 2. Fallback: Check root uploads directory (Legacy/Edited files)
  const filename = path.basename(relativePath);
  const rootPath = path.join(uploadsDir, filename);
  if (fs.existsSync(rootPath) && fs.lstatSync(rootPath).isFile()) {
    return rootPath;
  }

  // 3. Smart Search: Look through subdirectories (Breadth-First Search)
  // This is for files that are in subfolders but requested without path info.
  const queue = [uploadsDir];
  const maxDepth = 4; // Category > Subcategory > subSubCategory + 1
  let depth = 0;

  while (queue.length > 0 && depth < maxDepth) {
    const levelSize = queue.length;
    for (let i = 0; i < levelSize; i++) {
        const currentDir = queue.shift();
        try {
            const files = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const dirent of files) {
                const fullPath = path.join(currentDir, dirent.name);
                if (dirent.isDirectory()) {
                    if (dirent.name !== '.cache' && !dirent.name.startsWith('.')) {
                        queue.push(fullPath);
                    }
                } else if (dirent.name === filename) {
                    return fullPath; // Found it!
                }
            }
        } catch (err) {
            console.error(`Error reading dir ${currentDir}:`, err);
        }
    }
    depth++;
  }

  return null; // Not found anywhere
};

export const getResizedImage = asyncHandler(async (req, res) => {
  // Capture nested path from wildcard & Decode for special characters (spaces, etc)
  const rawPath = req.params[0];
  const relativePath = decodeURIComponent(rawPath);
  const { w } = req.query;
  const width = parseInt(w) || null;

  const uploadsDir = path.join(process.cwd(), 'uploads');
  const finalFilePath = findFileInUploads(uploadsDir, relativePath);

  if (!finalFilePath) {
    const placeholderPath = path.join(process.cwd(), 'assets', 'placeholder.png');
    if (fs.existsSync(placeholderPath)) {
      return res.sendFile(placeholderPath);
    }
    return res.status(404).json({ message: 'Image not found' });
  }

  try {
    ensureCacheDir();
    // Cache key should be unique to the actual file content and requested size
    // We use the absolute path relative to uploads to avoid collisions
    const pathId = path.relative(uploadsDir, finalFilePath).split(path.sep).join('_');
    const cachePath = getCachePath(pathId, width);

    if (isCached(cachePath)) {
      res.set('Content-Type', 'image/webp');
      res.set('Cache-Control', 'public, max-age=2592000, immutable');
      return res.sendFile(cachePath);
    }

    let transform = sharp(finalFilePath);

    if (width) {
      transform = transform.resize({ width, withoutEnlargement: true });
    }

    transform = transform.webp({ quality: 75 });

    const buffer = await transform.toBuffer();

    fs.writeFileSync(cachePath, buffer);

    res.set('Content-Type', 'image/webp');
    res.set('Cache-Control', 'public, max-age=2592000, immutable');
    res.send(buffer);
  } catch (error) {
    console.error('Image processing failed, falling back to original:', error);
    // If anything fails (Sharp, memory, etc), send the original file as a fallback
    res.set('Cache-Control', 'public, max-age=86400'); // Shorter cache for fallback
    res.sendFile(finalFilePath);
  }
});


