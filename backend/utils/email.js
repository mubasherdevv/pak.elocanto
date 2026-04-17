import { BrevoClient } from '@getbrevo/brevo';
import dotenv from 'dotenv';
import Settings from '../models/Settings.js';
dotenv.config();

const getSettings = async () => {
  return await Settings.findOne();
};

const sendEmail = async (to, subject, html) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('BREVO_API_KEY not found in environment variables');
      return false;
    }

    // Initialize Brevo Client
    const client = new BrevoClient({
      apiKey: apiKey,
    });

    const settings = await getSettings();
    const fromName = settings?.emailSettings?.fromName || 'OLX Marketplace';
    const fromEmail = settings?.emailSettings?.fromEmail || 'noreply@olx-marketplace.com';

    const response = await client.transactionalEmails.sendTransacEmail({
      subject: subject,
      htmlContent: html,
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
    });

    console.log(`Email sent successfully to ${to}. Message ID: ${response.messageId || 'sent'}`);
    return true;
  } catch (error) {
    // Detailed error logging for Brevo v5
    console.error('Brevo API error:', error.message || error);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    return false;
  }
};

export const sendVerificationEmail = async (user) => {
  const settings = await getSettings();
  const templates = settings?.emailTemplates?.verification || {};
  const emailSettings = settings?.emailSettings || {};
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiryMinutes = emailSettings.codeExpiryMinutes || 5;
  
  user.verificationCode = code;
  user.verificationCodeExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);
  await user.save();

  const subject = templates.subject || 'Verify your OLX account';
  const bodyTemplate = templates.body || '<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;"><h2 style="color: #3e6fe1;">Verify Your Email</h2><p>Your verification code is:</p><h1 style="background: #f3f4f6; padding: 16px; text-align: center; letter-spacing: 4px;">{CODE}</h1><p style="color: #6b7280; font-size: 14px;">This code expires in {EXPIRY} minutes.</p></div>';
  
  const html = bodyTemplate.replace(/{CODE}/g, code).replace(/{EXPIRY}/g, expiryMinutes);

  return sendEmail(user.email, subject, html);
};

export const sendPasswordResetEmail = async (user) => {
  const settings = await getSettings();
  const templates = settings?.emailTemplates?.passwordReset || {};
  const emailSettings = settings?.emailSettings || {};
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiryMinutes = emailSettings.codeExpiryMinutes || 5;
  
  user.resetPasswordCode = code;
  user.resetPasswordExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);
  await user.save();

  const subject = templates.subject || 'Reset your OLX password';
  const bodyTemplate = templates.body || '<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;"><h2 style="color: #3e6fe1;">Reset Your Password</h2><p>Your password reset code is:</p><h1 style="background: #f3f4f6; padding: 16px; text-align: center; letter-spacing: 4px;">{CODE}</h1><p style="color: #6b7280; font-size: 14px;">This code expires in {EXPIRY} minutes.</p></div>';
  
  const html = bodyTemplate.replace(/{CODE}/g, code).replace(/{EXPIRY}/g, expiryMinutes);

  return sendEmail(user.email, subject, html);
};

export const sendPasswordChangeNotification = async (user) => {
  const settings = await getSettings();
  const templates = settings?.emailTemplates?.passwordChanged || {};
  
  const subject = templates.subject || 'Your OLX password has been changed';
  const bodyTemplate = templates.body || '<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;"><h2 style="color: #3e6fe1;">Password Changed</h2><p>Your password has been successfully changed.</p><p style="color: #6b7280; font-size: 14px;">If you didn\'t change your password, please contact us immediately.</p></div>';
  
  const html = bodyTemplate;

  return sendEmail(user.email, subject, html);
};

export const sendAdRejectionEmail = async (user, ad, reason) => {
  const settings = await getSettings();
  const siteName = settings?.siteName || 'Elocanto';
  const siteUrl = settings?.siteUrl || 'https://pk.elocanto.com';
  
  const subject = `Listing Update: Your ad "${ad.title}" has been rejected`;
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; borderRadius: 16px; overflow: hidden;">
      <div style="background: #3e6fe1; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Listing Update</h1>
      </div>
      <div style="padding: 32px; background: white;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${user.name},</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Thank you for posting on <strong>${siteName}</strong>. After reviewing your advertisement, our moderation team has decided to <strong>reject</strong> your listing at this time.
        </p>
        
        <div style="background: #fdf2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="color: #991b1b; margin-top: 0; font-size: 16px;">Reason for Rejection:</h3>
          <p style="color: #b91c1c; margin-bottom: 0; font-weight: 600;">"${reason}"</p>
        </div>

        <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">Ad Details:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;">Title:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${ad.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Price:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">Rs ${ad.price.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">City:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${ad.city}</td>
          </tr>
        </table>

        <p style="color: #4b5563; line-height: 1.6;">
          Please review our <a href="${siteUrl}/terms" style="color: #3e6fe1;">Terms of Service</a> and community guidelines before reposting. You can edit your ad from your dashboard to address the issues mentioned above.
        </p>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="${siteUrl}/dashboard" style="background: #3e6fe1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to My Dashboard</a>
        </div>
      </div>
      <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};

export const reinitTransporter = async () => {
  console.log('Brevo integration active.');
};
