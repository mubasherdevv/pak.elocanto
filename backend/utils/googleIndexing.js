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

    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/indexing'],
      null
    );

    const tokens = await jwtClient.authorize();
    
    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({
        url: url,
        type: type,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Google Indexing] API Error:', data);
      return { error: data.error?.message || 'Google API Error' };
    }

    console.log(`[Google Indexing] Success (${type}): ${url}`);
    return data;
  } catch (error) {
    console.error('[Google Indexing] Catch Error:', error.message);
    return { error: error.message };
  }
};
