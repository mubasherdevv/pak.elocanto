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

export const reinitTransporter = async () => {
  console.log('Brevo integration active.');
};
