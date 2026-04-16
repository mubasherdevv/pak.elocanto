import dns from 'dns';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Settings from '../models/Settings.js';
dotenv.config();

let transporter = null;

const initTransporter = async () => {
  const settings = await Settings.findOne();
  const emailSettings = settings?.emailSettings || {};

  const smtpUser = emailSettings.smtpUser || process.env.EMAIL_USER;
  const smtpPass = emailSettings.smtpPass || process.env.EMAIL_PASS;
  const smtpHost = emailSettings.smtpHost || 'smtp.gmail.com';
  const smtpPort = emailSettings.smtpPort || 587;

  console.log(`Configuring email transporter: Host=${smtpHost}, Port=${smtpPort}, User=${smtpUser ? '***' + smtpUser.slice(-4) : 'undefined'}`);

  if (!smtpUser || !smtpPass) {
    console.error('Email credentials not configured: EMAIL_USER or EMAIL_PASS missing');
    return null;
  }


  const isGmail = smtpHost.includes('gmail.com');
  
  // Nuclear Option: resolve the address manually to ensure an IPv4 string is used as 'host'
  let resolvedHost = smtpHost;
  try {
    const { address } = await dns.promises.lookup(smtpHost, { family: 4 });
    resolvedHost = address;
    console.log(`Resolved ${smtpHost} to IPv4: ${resolvedHost}`);
  } catch (err) {
    console.warn(`DNS lookup for ${smtpHost} failed, falling back to hostname line: ${err.message}`);
  }

  const transportConfig = {
    host: resolvedHost,
    port: isGmail ? 587 : smtpPort,
    secure: isGmail ? false : (smtpPort === 465),
    auth: {
      user: smtpUser?.trim(),
      pass: smtpPass?.trim(),
    },
    family: 4, // Still force IPv4 just in case
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 20000,
    socketTimeout: 30000,
    debug: true,
    logger: true,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
      servername: isGmail ? 'smtp.gmail.com' : undefined // Important when host is numeric IP
    }
  };


  transporter = nodemailer.createTransport(transportConfig);




  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter error:', error.message);
    } else {
      console.log('Email transporter ready');
    }
  });
};

setTimeout(() => {
  initTransporter().catch(console.error);
}, 2000);

export const reinitTransporter = async () => {
  await initTransporter();
};

const getSettings = async () => {
  return await Settings.findOne();
};

const sendEmail = async (to, subject, html) => {
  try {
    if (!transporter) {
      await initTransporter();
    }
    if (!transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const settings = await getSettings();
    const fromName = settings?.emailSettings?.fromName || 'OLX Marketplace';
    const fromEmail = settings?.emailSettings?.fromEmail || process.env.EMAIL_USER;

    transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    }).then(() => console.log(`Email sent to ${to}`)).catch(err => console.error('Email error:', err.message));
    return true;
  } catch (error) {
    console.error('Email error:', error.message);
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
