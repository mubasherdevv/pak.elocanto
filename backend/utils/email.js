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

export const sendReportAlertEmail = async (user, ad, reason) => {
  const settings = await getSettings();
  const siteName = settings?.siteName || 'Elocanto';
  
  const subject = `Notice: Your ad "${ad.title}" has been reported`;
  
  const html = `
    <div style="font-family: inherit; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background: white;">
      <div style="padding: 24px; background: #fef3c7; border-radius: 16px 16px 0 0;">
        <h2 style="color: #92400e; margin: 0;">Reputation Alert</h2>
      </div>
      <div style="padding: 32px;">
        <p>Hello ${user.name},</p>
        <p>We received a report from the community regarding your advertisement: <strong>"${ad.title}"</strong>.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Reason Given:</p>
          <p style="margin: 4px 0 0 0; font-weight: bold;">${reason}</p>
        </div>
        <p>Our moderation team is currently reviewing this report. No action is required from you at this moment, but we recommend reviewing our community guidelines.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">This is an automated notification from ${siteName}.</p>
      </div>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};

export const sendWarningEmail = async (user, ad, warningNumber, adminNotes) => {
  const settings = await getSettings();
  const siteName = settings?.siteName || 'Elocanto';
  const siteUrl = settings?.siteUrl || 'https://pk.elocanto.com';
  
  const subject = `Official Warning #${warningNumber}: Account Moderation Notice`;
  
  const html = `
    <div style="font-family: inherit; max-width: 600px; margin: 0 auto; border: 2px solid #ef4444; border-radius: 16px; background: white;">
      <div style="padding: 24px; background: #fee2e2; border-radius: 14px 14px 0 0;">
        <h2 style="color: #b91c1c; margin: 0;">Official Warning #${warningNumber}</h2>
      </div>
      <div style="padding: 32px;">
        <p>Hello ${user.name},</p>
        <p>Following a review of reported activity on your account, an official warning has been issued. This warning is related to your advertisement: <strong>"${ad.title}"</strong>.</p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #b91c1c; font-weight: bold;">Moderator Notes:</p>
          <p style="margin: 4px 0 0 0;">${adminNotes || 'Violation of platform community guidelines.'}</p>
        </div>
        <p style="font-weight: bold; color: #1f2937;">Important Notice:</p>
        <p>Please be aware that your account will be <strong>automatically suspended</strong> upon receiving 3 warnings. We value your presence on ${siteName} and encourage you to adhere to our listing policies.</p>
        <div style="text-align: center; margin-top: 32px;">
          <a href="${siteUrl}/dashboard" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Review My Dashboard</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};

export const sendSuspensionEmail = async (user) => {
  const settings = await getSettings();
  const siteName = settings?.siteName || 'Elocanto';
  
  const subject = `URGENT: Your account on ${siteName} has been suspended`;
  
  const html = `
    <div style="font-family: inherit; max-width: 600px; margin: 0 auto; border: 2px solid #111827; border-radius: 16px; background: white;">
      <div style="padding: 24px; background: #111827; color: white; border-radius: 14px 14px 0 0;">
        <h2 style="margin: 0;">Account Suspended</h2>
      </div>
      <div style="padding: 32px;">
        <p>Hello ${user.name},</p>
        <p>We are writing to inform you that your account on <strong>${siteName}</strong> has been suspended due to repeated violations of our community guidelines and the accumulation of multiple warnings.</p>
        <p>While your account is suspended, you will not be able to post new ads or manage existing listings.</p>
        <p>If you believe this is a mistake, you may contact our support team to appeal this decision.</p>
        <p style="margin-top: 32px; color: #6b7280;">Best regards,<br>${siteName} Trust & Safety Team</p>
      </div>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};

export const reinitTransporter = async () => {
  console.log('Brevo integration active.');
};
