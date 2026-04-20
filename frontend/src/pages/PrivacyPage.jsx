import { useMemo } from 'react';
import LegalPageLayout from '../components/LegalPageLayout';
import { Helmet } from 'react-helmet-async';

const PrivacyPage = () => {
  const sections = useMemo(() => [
    {
      id: 'overview',
      title: 'Overview and Commitment to Privacy',
      content: (
        <>
          <p>Welcome to Elocanto. Your privacy is very important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website.</p>
          <p>By using Elocanto, you agree to the practices described in this policy. If you do not agree, please stop using the platform.</p>
        </>
      )
    },
    {
      id: 'collect',
      title: 'Information We Collect from Users',
      content: (
        <>
          <p>When you use Elocanto, we may collect different types of information to provide and improve our services.</p>
          <p>This includes information you directly provide, such as your name, email address, phone number, and details you include in your ads when creating an account or posting listings.</p>
          <p>We also collect basic technical data automatically, such as IP address, browser type, device information, and pages visited, to help us improve platform performance and security.</p>
        </>
      )
    },
    {
      id: 'use',
      title: 'How We Use Your Information',
      content: (
        <>
          <p>We use collected information to operate, maintain, and improve the Elocanto platform.</p>
          <p>This includes enabling ad posting, account management, user communication, customer support, platform security, fraud prevention, and service improvement.</p>
          <p>We may also use your information to send important updates related to platform usage and safety.</p>
          <p>We do not use your data for any illegal or unauthorized purpose.</p>
        </>
      )
    },
    {
      id: 'public',
      title: 'Public Content and User Responsibility',
      content: (
        <>
          <p>Elocanto is a user-generated content platform. Any information you publish in ads, including images and descriptions, may be visible to other users.</p>
          <p>We strongly recommend avoiding the sharing of sensitive personal or financial details in public listings, as this information becomes accessible to others.</p>
        </>
      )
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking Technologies',
      content: (
        <>
          <p>We use cookies and similar technologies to improve user experience, analyze traffic, and enhance platform functionality.</p>
          <p>Cookies help us remember user preferences and understand how users interact with the website.</p>
          <p>You may disable cookies through your browser settings, but some features of the platform may not work properly if cookies are turned off.</p>
        </>
      )
    },
    {
      id: 'sharing',
      title: 'Data Sharing and Third-Party Services',
      content: (
        <>
          <p>We do not sell or rent your personal data to third parties.</p>
          <p>However, we may share limited information with trusted service providers who help us operate the platform, such as hosting providers, analytics tools, or security partners.</p>
          <p>These third parties are required to handle your data securely and only for service-related purposes.</p>
          <p>We may also disclose information if required by law or to protect the rights and safety of users or the platform.</p>
        </>
      )
    },
    {
      id: 'protection',
      title: 'Data Protection and Security Measures',
      content: (
        <>
          <p>We take reasonable security measures to protect your personal data from unauthorized access, misuse, or loss.</p>
          <p>However, no online system is completely secure. Users are also responsible for keeping their account information safe and avoiding sharing sensitive data publicly.</p>
        </>
      )
    },
    {
      id: 'safety',
      title: 'User Data Responsibility and Safe Usage',
      content: (
        <>
          <p>Users are responsible for the information they choose to share on the platform.</p>
          <p>We strongly advise users not to post sensitive information such as passwords, bank details, or identification numbers in public areas of the website.</p>
        </>
      )
    },
    {
      id: 'external',
      title: 'Third-Party Links and External Websites',
      content: (
        <>
          <p>Elocanto may contain links to external websites or third-party services.</p>
          <p>We are not responsible for the privacy practices or content of these external sites. Users are encouraged to review their policies before sharing any personal information.</p>
        </>
      )
    },
    {
      id: 'children',
      title: 'Children’s Privacy Protection',
      content: (
        <>
          <p>Elocanto is not intended for use by individuals under the age of 18 without supervision.</p>
          <p>We do not knowingly collect personal data from minors. If such data is identified, it will be removed promptly.</p>
        </>
      )
    },
    {
      id: 'updates',
      title: 'Updates and Changes to This Privacy Policy',
      content: (
        <>
          <p>We may update this Privacy Policy from time to time to reflect changes in services or legal requirements.</p>
          <p>Users are encouraged to review this page regularly. Continued use of the platform after updates means acceptance of the revised policy.</p>
        </>
      )
    },
    {
      id: 'contact',
      title: 'Contact Information and User Support',
      content: (
        <>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, you can contact us at any time.</p>
          <p>We are committed to maintaining transparency and providing support to all users of Elocanto.</p>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-6">
            <p className="font-bold text-slate-900 mb-2">You can reach us through:</p>
            <ul className="list-none p-0 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-orange-500 font-bold">Email:</span>
                <a href="mailto:support@elocanto.pk" className="text-orange-600 hover:underline">support@elocanto.pk</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-500 font-bold">WhatsApp:</span>
                <a href="https://wa.me/447490809237" className="text-orange-600 hover:underline">+44 7490 809237</a>
              </li>
            </ul>
          </div>
          <p className="mt-4">Our team will review your queries and respond as soon as possible to assist you with your concerns.</p>
        </>
      )
    }
  ], []);

  return (
    <>
      <Helmet>
        <title>Privacy Policy | Elocanto - Data Protection & User Privacy Terms</title>
        <meta name="description" content="Learn how Elocanto handles user data, cookies, and privacy protection. Understand your rights and how your information is used on our platform." />
      </Helmet>
      <LegalPageLayout 
        title="Privacy Policy"
        description="Your privacy is our priority. Learn how we handle your data with care and transparency."
        sections={sections}
      />
    </>
  );
};

export default PrivacyPage;
