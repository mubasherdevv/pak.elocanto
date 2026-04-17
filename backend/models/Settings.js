import mongoose from 'mongoose';

const settingsSchema = mongoose.Schema(
  {
    // 1. General Settings
    siteName: { type: String, default: 'MarketX' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    contactEmail: { type: String, default: 'admin@marketx.pk' },
    supportPhone: { type: String, default: '' },
    isMaintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { 
      type: String, 
      default: "We are currently undergoing scheduled maintenance. We'll be back shortly!" 
    },

    // 2. Homepage Settings
    featuredAdsLimit: { type: Number, default: 10 },
    latestAdsLimit: { type: Number, default: 10 },
    enableFeaturedAdsSection: { type: Boolean, default: true },
    enableSeoContentSection: { type: Boolean, default: true },

    // 3. Ads Settings
    simpleAdsDuration: { type: Number, default: 30 }, // days
    featuredAdsDuration: { type: Number, default: 7 }, // days
    maxImagesPerAd: { type: Number, default: 5 },
    enableAutoExpiry: { type: Boolean, default: true },
    priceFormat: { type: String, default: 'Rs' }, // currency symbol

    // 4. Featured Ads Rotation
    featuredAdsPerPage: { type: Number, default: 10 },
    rotationLogic: { type: String, enum: ['random', 'round-robin'], default: 'random' },
    rotationInterval: { type: Number, default: 0 }, // in seconds/minutes (0 to disable)

    // 5. User Settings
    enableUserRegistration: { type: Boolean, default: true },
    enableEmailVerification: { type: Boolean, default: false },
    allowTemporaryEmails: { type: Boolean, default: false },
    defaultUserRole: { type: String, enum: ['user', 'seller'], default: 'user' },

    // 6. Seller & Badge Settings
    enableSellerBadges: { type: Boolean, default: true },
    visibleBadges: { 
      type: [String], 
      default: ['Verified', 'Top Seller', 'Featured Seller'] 
    },
    autoAssignBadgeRules: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // 7. SEO Settings
    defaultMetaTitle: { type: String, default: '' },
    defaultMetaDescription: { type: String, default: '' },
    defaultKeywords: { type: String, default: '' },
    enableDynamicSeoContent: { type: Boolean, default: true },

    // 8. Social & External Links
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      whatsapp: { type: String, default: '' }
    },
    appLinks: {
      playStore: { type: String, default: '' },
      appStore: { type: String, default: '' }
    },

    // 9. Security Settings
    jwtExpiryTime: { type: String, default: '30d' },
    passwordRules: {
      minLength: { type: Number, default: 6 },
      requireStrongPassword: { type: Boolean, default: false }
    },
    loginAttemptLimit: { type: Number, default: 5 },

    // Email Settings
    emailSettings: {
      fromName: { type: String, default: 'OLX Marketplace' },
      fromEmail: { type: String, default: '' },
      smtpHost: { type: String, default: 'smtp.gmail.com' },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: '' },
      smtpPass: { type: String, default: '' },
      enableEmailVerification: { type: Boolean, default: true },
      codeExpiryMinutes: { type: Number, default: 5 }
    },

    // Email Templates
    emailTemplates: {
      verification: {
        subject: { type: String, default: 'Verify your OLX account' },
        body: { type: String, default: '<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;"><h2 style="color: #3e6fe1;">Verify Your Email</h2><p>Your verification code is:</p><h1 style="background: #f3f4f6; padding: 16px; text-align: center; letter-spacing: 4px;">{CODE}</h1><p style="color: #6b7280; font-size: 14px;">This code expires in {EXPIRY} minutes.</p></div>' }
      },
      passwordReset: {
        subject: { type: String, default: 'Reset your OLX password' },
        body: { type: String, default: '<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;"><h2 style="color: #3e6fe1;">Reset Your Password</h2><p>Your password reset code is:</p><h1 style="background: #f3f4f6; padding: 16px; text-align: center; letter-spacing: 4px;">{CODE}</h1><p style="color: #6b7280; font-size: 14px;">This code expires in {EXPIRY} minutes.</p></div>' }
      },
      passwordChanged: {
        subject: { type: String, default: 'Your OLX password has been changed' },
        body: { type: String, default: '<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;"><h2 style="color: #3e6fe1;">Password Changed</h2><p>Your password has been successfully changed.</p><p style="color: #6b7280; font-size: 14px;">If you didn\'t change your password, please contact us immediately.</p></div>' }
      }
    },

    // 10. UI/UX Controls
    enableDarkMode: { type: Boolean, default: false },
    showPhoneOnAds: { type: Boolean, default: true },
    enableChat: { type: Boolean, default: true },

    // 11. Analytics & Tracking
    googleAnalyticsId: { type: String, default: '' },
    googleSearchConsoleId: { type: String, default: '' }, // For site verification
    headerScripts: { type: String, default: '' }, // Custom scripts for <head>
    footerScripts: { type: String, default: '' },  // Custom scripts before </body>

    // 12. Google Indexing API
    siteUrl: { type: String, default: 'https://pk.elocanto.com' },
    enableGoogleIndexing: { type: Boolean, default: false },
    googleIndexingKey: { type: String, default: '' } // Service Account JSON
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

