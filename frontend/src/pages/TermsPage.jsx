import { useMemo } from 'react';
import LegalPageLayout from '../components/LegalPageLayout';
import { Helmet } from 'react-helmet-async';

const TermsPage = () => {
  const sections = useMemo(() => [
    {
      id: 'acceptance',
      title: 'Acceptance and Agreement to Terms',
      content: (
        <>
          <p>Welcome to Elocanto. By accessing or using our website, you agree to comply with and be bound by these Terms and Conditions. These terms are designed to ensure a safe, fair, and reliable environment for all users of the platform.</p>
          <p>If you do not agree with any part of these terms, you should discontinue using our services immediately.</p>
        </>
      )
    },
    {
      id: 'overview',
      title: 'Platform Overview and Nature of Service',
      content: (
        <>
          <p>Elocanto is an online classified ads platform that enables users to post listings, explore ads, and connect with others for buying, selling, or offering services.</p>
          <p>We do not own, control, or directly sell any of the products or services listed on the platform. All content is generated and managed by individual users. Our role is limited to providing a digital space where users can interact.</p>
        </>
      )
    },
    {
      id: 'obligations',
      title: 'User Obligations and Responsibilities',
      content: (
        <>
          <p>By using Elocanto, you agree to act responsibly, honestly, and in accordance with applicable laws.</p>
          <p>You are solely responsible for the content you post, including text, images, and any other information. All listings must be accurate, genuine, and not misleading. Any misuse of the platform that may harm other users or the integrity of the platform is strictly prohibited.</p>
        </>
      )
    },
    {
      id: 'standards',
      title: 'Listing Standards and Content Compliance',
      content: (
        <>
          <p>All ads posted on Elocanto must meet basic quality and legal standards.</p>
          <p>Users must ensure that their listings are clear, truthful, and relevant. Posting duplicate ads, misleading information, or unauthorized content is not allowed. Any content that violates laws or platform guidelines may be removed without prior notice.</p>
        </>
      )
    },
    {
      id: 'prohibited',
      title: 'Restricted and Prohibited Activities',
      content: (
        <>
          <p>Users are strictly prohibited from engaging in activities that compromise the safety or functionality of the platform.</p>
          <p>This includes fraudulent behavior, scam attempts, spam posting, fake listings, system abuse, or any attempt to manipulate visibility or engagement. Violations may result in immediate action, including account suspension or permanent removal.</p>
        </>
      )
    },
    {
      id: 'transactions',
      title: 'User-to-User Transactions and Deal Responsibility',
      content: (
        <>
          <p>All transactions conducted through Elocanto take place directly between users.</p>
          <p>We do not act as a party to any agreement, payment, or delivery process. Therefore, we do not guarantee the quality, safety, legality, or authenticity of any listing.</p>
          <p>Users are advised to exercise caution and verify all details before completing any transaction.</p>
        </>
      )
    },
    {
      id: 'payment',
      title: 'Payment Disclaimer and Financial Risk',
      content: (
        <>
          <p>Elocanto does not process or facilitate payments between users.</p>
          <p>All financial interactions are carried out at the user’s own discretion and risk. We strongly recommend avoiding advance payments unless you fully trust the other party.</p>
          <p>We are not liable for any financial loss, fraud, or disputes arising from user transactions.</p>
        </>
      )
    },
    {
      id: 'reporting',
      title: 'Reporting System and Complaint Resolution',
      content: (
        <>
          <p>We provide built-in tools that allow users to report listings, users, or any suspicious activity.</p>
          <p>If you encounter fraud, scam, misleading content, or copyright violations, you can submit a complaint through our platform. Our team reviews all reports carefully and aims to take appropriate action within 24 hours.</p>
          <p>Final decisions regarding content removal or account action remain at our sole discretion.</p>
        </>
      )
    },
    {
      id: 'intellectual',
      title: 'Intellectual Property Rights and Content Ownership',
      content: (
        <>
          <p>Users must ensure that they have full rights to use and upload any content on the platform.</p>
          <p>Uploading copyrighted material without proper authorization is strictly prohibited. Any reported violation may result in content removal and further action against the account.</p>
        </>
      )
    },
    {
      id: 'liability',
      title: 'Limitation of Liability and Platform Disclaimer',
      content: (
        <>
          <p>Elocanto is provided on an “as-is” basis without any guarantees or warranties.</p>
          <p>We are not responsible for any direct or indirect loss, damage, or disputes that may occur between users. This includes financial loss, misrepresentation, or issues related to listings or services.</p>
          <p>Your use of the platform is entirely at your own risk.</p>
        </>
      )
    },
    {
      id: 'enforcement',
      title: 'Account Control and Enforcement Rights',
      content: (
        <>
          <p>We reserve the right to monitor, restrict, suspend, or permanently remove user accounts that violate our terms or engage in harmful activity.</p>
          <p>We may also limit access to certain features if required to maintain platform safety and integrity.</p>
        </>
      )
    },
    {
      id: 'updates',
      title: 'Modifications and Updates to Terms',
      content: (
        <>
          <p>Elocanto reserves the right to update or modify these Terms and Conditions at any time without prior notice.</p>
          <p>Users are encouraged to review this page regularly. Continued use of the platform after changes means you accept the updated terms.</p>
        </>
      )
    },
    {
      id: 'contact',
      title: 'Contact Information and User Support',
      content: (
        <>
          <p>If you have any questions, concerns, or need assistance regarding these Terms and Conditions, you can contact us through our official website.</p>
          <p>We are committed to providing support and maintaining a safe experience for all users.</p>
        </>
      )
    }
  ], []);

  return (
    <>
      <Helmet>
        <title>Terms & Conditions | Elocanto Classified Ads Platform</title>
        <meta name="description" content="Read Elocanto’s Terms & Conditions to understand your rights, responsibilities, and platform rules for safe buying, selling, and user interactions." />
      </Helmet>
      <LegalPageLayout 
        title="Terms & Conditions"
        description="Please read these terms carefully before using our platform. Your safety and trust are our top priorities."
        sections={sections}
      />
    </>
  );
};

export default TermsPage;
