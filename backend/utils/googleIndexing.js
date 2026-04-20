import { google } from 'googleapis';
import Settings from '../models/Settings.js';

/**
 * Publishes a URL notification to the Google Indexing API.
 * @param {string} url - The URL to be indexed or removed.
 * @param {string} type - The type of notification: 'URL_UPDATED' or 'URL_DELETED'.
 * @returns {Promise<object>} - The response from the Google Indexing API.
 */
export const publishToGoogleIndexing = async (url, type = 'URL_UPDATED') => {
  try {
    const settings = await Settings.findOne({}).lean();
    
    if (!settings || !settings.enableGoogleIndexing || !settings.googleIndexingKey) {
      console.log('[Google Indexing] Skipping: Disabled or credentials missing.');
      return null;
    }

    let key;
    try {
      key = JSON.parse(settings.googleIndexingKey);
    } catch (err) {
      console.error('[Google Indexing] Error: Invalid JSON in googleIndexingKey');
      return { error: 'Invalid Service Account JSON key' };
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: key.client_email,
        private_key: key.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const accessToken = await auth.getAccessToken();
    
    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: url,
        type: type,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Google Indexing] API Error:', data);
      const msg = data.error?.message || 'Google API Error';
      if (msg.toLowerCase().includes('quota') || data.error?.status === 'RESOURCE_EXHAUSTED') {
        return { error: 'Daily Google Quota Exceeded (Limit: 200 URLs). Please try again tomorrow or request a quota increase.' };
      }
      if (msg.toLowerCase().includes('permission') || data.error?.status === 'PERMISSION_DENIED') {
        return { error: 'Permission Denied: Ensure the Service Account Email is added as an OWNER in Google Search Console.' };
      }
      return { error: msg };
    }

    console.log(`[Google Indexing] Success (${type}): ${url}`);
    return data;
  } catch (error) {
    console.error('[Google Indexing] Catch Error:', error.message);
    return { error: error.message };
  }
};
