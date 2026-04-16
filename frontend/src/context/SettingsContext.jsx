import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';
import { cache } from '../utils/cache';

const SettingsContext = createContext();
const SETTINGS_CACHE_TIME = 10 * 60 * 1000; // 10 minutes cache for settings

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => cache.get('settings'));
  const [loading, setLoading] = useState(!settings);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
      cache.set('settings', data, SETTINGS_CACHE_TIME);
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load site settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, []);

  // Update document title, favicon and inject Analytics dynamically
  useEffect(() => {
    if (settings) {
      // Favicon
      if (settings.favicon) {
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = settings.favicon;
        document.getElementsByTagName('head')[0].appendChild(link);
      }

      // Google Analytics Injection
      if (settings.googleAnalyticsId) {
        const id = settings.googleAnalyticsId;
        // Check if script already exists to prevent duplicates
        if (!document.getElementById('ga-script')) {
          const script1 = document.createElement('script');
          script1.id = 'ga-script';
          script1.async = true;
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
          document.head.appendChild(script1);

          const script2 = document.createElement('script');
          script2.id = 'ga-config';
          script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${id}');
          `;
          document.head.appendChild(script2);
          console.log(`[ANALYTICS] Google Analytics (${id}) injected.`);
        }
      }

      // Google Search Console Meta Injection
      if (settings.googleSearchConsoleId) {
        if (!document.querySelector('meta[name="google-site-verification"]')) {
          const meta = document.createElement('meta');
          meta.name = "google-site-verification";
          meta.content = settings.googleSearchConsoleId;
          document.head.appendChild(meta);
          console.log(`[SEO] Google Site Verification injected.`);
        }
      }
    }
  }, [settings]);


  // Function to manually refresh settings (e.g., after admin save)
  const refreshSettings = () => {
    fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
