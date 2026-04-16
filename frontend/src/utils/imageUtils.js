import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file and converts it to WebP format.
 * @param {File} file - The image file to compress.
 * @param {Object} customOptions - Optional custom compression options.
 * @returns {Promise<File>} - The compressed WebP file.
 */
export const compressImage = async (file, customOptions = {}) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    ...customOptions
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Create a new File object from the blob to ensure filename and extension are correct
    const newFileName = file.name.replace(/\.[^/.]+$/, '.webp');
    return new File([compressedBlob], newFileName, { type: 'image/webp' });
  } catch (error) {
    console.error('Image compression failed:', error);
    throw error;
  }
};

/**
 * Transforms a local upload URL or external URL into an optimized version.
 * For local uploads, it redirects to the /api/images proxy for WebP conversion and resizing.
 * @param {string} url - The original image URL.
 * @param {number} width - Optional desired width for resizing.
 * @returns {string} - The optimized image URL.
 */
export const getOptimizedImageUrl = (url, width) => {
  if (!url || typeof url !== 'string') return '/placeholder.png';
  
  // If it's already an optimized proxy URL, don't re-process
  if (url.includes('/api/images/')) return url;

  // Detect Cloudinary or other external URLs
  // We check for common image hosting patterns. 
  // IMPORTANT: Cloudinary URLs should NOT be proxied unless specifically needed.
  if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    // If it's a truly external URL (like Cloudinary), return as is
    // Unless it explicitly contains /uploads/ which might mean it's our own prod URL
    const uploadsIdx = url.indexOf('/uploads/');
    if (uploadsIdx === -1) {
      return url;
    }
  }

  // Handle local development or relative paths
  let internalPath = url;
  
  // Strip hostname if it's a local absolute URL
  if (url.startsWith('http')) {
    const uploadsIdx = url.indexOf('/uploads/');
    if (uploadsIdx !== -1) {
      internalPath = url.substring(uploadsIdx);
    }
  }

  let relativePath = internalPath;
  if (internalPath.includes('/uploads/')) {
    relativePath = internalPath.split('/uploads/').pop();
  } else if (internalPath.includes('uploads/')) {
    relativePath = internalPath.split('uploads/').pop();
  } else if (internalPath.startsWith('/')) {
    relativePath = internalPath.substring(1);
  }

  // Clean up any remaining leading/double slashes
  relativePath = relativePath.replace(/^\/+/, '');

  if (!relativePath || relativePath.startsWith('http')) return url;

  // Use the optimized backend proxy
  const query = width ? `?w=${width}` : '';
  // Encode the path to handle special characters (spaces, etc) in filenames
  const encodedPath = relativePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return `/images/${encodedPath}${query}`;
};

/**
 * Utility to handle multiple image uploads with compression.
 * @param {FileList|Array} files - List of files to compress.
 * @param {Object} options - Compression options.
 * @returns {Promise<Array>} - Array of compressed File objects.
 */
export const compressMultipleImages = async (files, options = {}) => {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map(file => compressImage(file, options)));
};
