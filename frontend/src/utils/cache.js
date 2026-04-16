/**
 * Simple LocalStorage Caching Utility
 */

const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes default

export const cache = {
  /**
   * Set data into cache
   * @param {string} key 
   * @param {any} data 
   * @param {number} ttl - Time to live in ms
   */
  set: (key, data, ttl = DEFAULT_TTL) => {
    try {
      const entry = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn('Cache set failed', e);
    }
  },

  /**
   * Get data from cache
   * @param {string} key 
   * @returns {any|null}
   */
  get: (key) => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > ttl;

      if (isExpired) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data; 
    } catch (e) {
      return null;
    }
  },

  /**
   * Check if cache exists and is fresh
   * @param {string} key 
   * @returns {boolean}
   */
  isFresh: (key) => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return false;
      const { timestamp, ttl } = JSON.parse(cached);
      return (Date.now() - timestamp) < ttl;
    } catch (e) {
      return false;
    }
  },

  /**
   * Remove a specific key
   */
  remove: (key) => {
    localStorage.removeItem(`cache_${key}`);
  },

  /**
   * Clear all app cache
   */
  clear: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
};
