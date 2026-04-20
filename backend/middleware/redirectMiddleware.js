import Redirect from '../models/Redirect.js';
import { getCache, setCache } from '../utils/cache.js';

/**
 * Middleware to handle URL redirects stored in the database.
 * Supports caching for high performance.
 */
const redirectMiddleware = async (req, res, next) => {
  // Only handle GET requests for redirects
  if (req.method !== 'GET') {
    return next();
  }

  // Skip static assets and uploads (but allow API for redirects)
  const skipPrefixes = ['/uploads', '/assets', '/static', '/api/health'];
  if (skipPrefixes.some(prefix => req.path.startsWith(prefix))) {
    return next();
  }

  // Normalize current path (lowercase, remove trailing slash)
  let rawPath = req.path.toLowerCase();
  const isApiRequest = rawPath.startsWith('/api');

  // For API requests, we look up the path without the /api prefix
  let lookupPath = isApiRequest ? rawPath.replace('/api', '') : rawPath;

  // Standardize lookupPath (ensure starts with /, remove trailing /)
  if (lookupPath.length > 1 && lookupPath.endsWith('/')) {
    lookupPath = lookupPath.slice(0, -1);
  }
  if (lookupPath === '' || lookupPath === '/api') lookupPath = '/';
  if (!lookupPath.startsWith('/')) lookupPath = '/' + lookupPath;

  try {
    // Check cache first
    const cacheKey = `redirect:${lookupPath}`;
    let redirect = getCache(cacheKey);

    if (redirect === undefined) {
      // 1. Try exact match
      redirect = await Redirect.findOne({ fromPath: lookupPath, isActive: true }).lean();

      // 2. If no match and it's an API call, try fuzzy matching by removing common API noise like /slug
      if (!redirect && isApiRequest) {
        // Example: /cities/slug/name -> /cities/name
        let fuzzyLookup = lookupPath.replace('/slug/', '/');
        if (fuzzyLookup !== lookupPath) {
          redirect = await Redirect.findOne({ fromPath: fuzzyLookup, isActive: true }).lean();
        }
      }

      // Cache the result
      setCache(cacheKey, redirect || null, 3600);
    }

    if (redirect) {
      let destination = redirect.toPath;

      // If it's an API request, we should redirect to the API version of the destination
      if (isApiRequest && !destination.startsWith('http')) {
        const cleanDest = destination.startsWith('/') ? destination : '/' + destination;
        destination = `/api${cleanDest}`;
      }

      console.log(`[REDIRECT] ${isApiRequest ? '[API] ' : ''}${rawPath} -> ${destination} (${redirect.statusCode})`);
      return res.redirect(redirect.statusCode || 301, destination);
    }

    next();
  } catch (error) {
    console.error('[REDIRECT] Error in redirect middleware:', error);
    next();
  }
};

export default redirectMiddleware;
