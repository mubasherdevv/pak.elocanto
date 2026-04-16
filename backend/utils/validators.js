const TEMPORARY_EMAIL_DOMAINS = [
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwaway.email',
  'fakeinbox.com',
  'yopmail.com',
  'tempmail.com',
  'dispostable.com',
  'sharklasers.com',
  'spam4.me',
  'trashmail.com',
  'getnada.com',
  'maildrop.cc',
  'emailondeck.com',
  'temp-mail.io',
  'tempmailaddress.com',
  'burnermail.io',
  'mailcatch.com',
  'spamfree24.org',
  'mintemail.com',
  'tempinbox.com',
  'mohmal.com',
  'tempail.com',
  'emailfake.com',
  'tempr.email',
  'discard.email',
  'spamgourmet.com',
  'mytrashmail.com',
  'mt2009.com',
  'thankyou2010.com',
  'trash2009.com',
  'mt2014.com',
  'temp.emkei.cz',
  'mailforspam.com',
  'incognitomail.com',
  'fakemailgenerator.com',
  'email-temp.com',
];

export const isTemporaryEmail = (email) => {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return TEMPORARY_EMAIL_DOMAINS.includes(domain);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }
  if (isTemporaryEmail(email)) {
    return { valid: false, message: 'Temporary email addresses are not allowed' };
  }
  return { valid: true };
};
