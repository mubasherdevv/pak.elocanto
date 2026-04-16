
export const generateAdSlug = (ad) => {
  if (!ad) return '';
  // If ad has a slug already, use it. Otherwise generate one.
  if (ad.slug) return ad.slug;
  if (!ad.title) return '';
  
  return ad.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

export const extractIdFromSlug = (slug) => {
  // Now we use the slug itself as the identifier for fetching
  return slug || '';
};
