import NodeCache from 'node-cache';

// TTL of 1 hour by default
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

export const getCache = (key) => cache.get(key);
export const setCache = (key, value, ttl) => cache.set(key, value, ttl);
export const delCache = (key) => cache.del(key);
export const flushCache = () => cache.flushAll();

export default cache;
