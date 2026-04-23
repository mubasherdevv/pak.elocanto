/**
 * Returns the server-injected initial data only if the current path matches 
 * the path for which the data was generated.
 */
export const getInitialData = () => {
  const data = window.__INITIAL_DATA__;
  if (!data) return null;

  // Normalise paths for comparison (remove trailing slashes, etc.)
  const normalize = (p) => (p || '').replace(/\/+$/, '') || '/';
  
  if (normalize(window.location.pathname) === normalize(data.path)) {
    return data;
  }

  return null;
};

/**
 * Returns global settings which are always valid regardless of the path.
 */
export const getGlobalSettings = () => {
  return window.__INITIAL_DATA__?.settings || null;
};
