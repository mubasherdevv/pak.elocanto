import React from 'react';

/**
 * Detects URLs in text and converts them into React elements with rel="ugc"
 * @param {string} text - The raw text to process
 * @returns {Array} - An array of strings and React components
 */
export const linkifyText = (text, isAdmin = false) => {
  if (!text) return null;

  // Regex to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Split text by URLs and map them
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      const rel = isAdmin 
        ? "nofollow noopener noreferrer" 
        : "ugc nofollow noopener noreferrer";

      return React.createElement('a', {
        key: index,
        href: part,
        target: "_blank",
        rel: rel,
        className: "text-primary hover:underline break-all"
      }, part);
    }
    return part;
  });
};
