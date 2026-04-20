import { useMemo } from 'react';
import LegalPageLayout from '../components/LegalPageLayout';
import { Helmet } from 'react-helmet-async';

const CopyrightPage = () => {
  const sections = useMemo(() => [
    {
      id: 'respect',
      title: 'Respect for Intellectual Property Rights',
      content: (
        <>
          <p>At Elocanto, we respect the intellectual property rights of others and expect all users of our platform to do the same. We are committed to maintaining a safe and lawful environment where original content is protected and unauthorized use of copyrighted material is strictly prohibited.</p>
          <p>All content published on Elocanto, including text, images, logos, design elements, and layout, is either owned by Elocanto or used with proper authorization. Any unauthorized copying, reproduction, or distribution of this content is not allowed.</p>
        </>
      )
    },
    {
      id: 'user-responsibility',
      title: 'User Responsibility for Uploaded Content',
      content: (
        <>
          <p>Elocanto is a user-generated content platform, which means all listings, including images, descriptions, and other materials, are created and uploaded by users.</p>
          <p>By posting content on Elocanto, you confirm that you own the rights to that content or have proper permission to use it. You also confirm that your content does not infringe on any third-party copyright, trademark, or intellectual property rights.</p>
          <p>Users are fully responsible for ensuring that their content is legal and authorized.</p>
        </>
      )
    },
    {
      id: 'reporting',
      title: 'Reporting Copyright Infringement',
      content: (
        <>
          <p>If you believe that any content on Elocanto violates your copyright or intellectual property rights, you can report it to us immediately.</p>
          <p>When submitting a complaint, please include clear details such as the link to the content, a description of the copyrighted material, and proof of ownership if available. This helps us review your request quickly and accurately.</p>
          <p>We take all valid copyright complaints seriously and investigate them as soon as they are received.</p>
        </>
      )
    },
    {
      id: 'enforcement',
      title: 'Enforcement Actions and Content Removal',
      content: (
        <>
          <p>We are committed to protecting intellectual property rights on our platform.</p>
          <p>If any content is found to be infringing or violating copyright laws, we may take immediate action. This may include removing the content, restricting access, or suspending the user account responsible for repeated violations.</p>
          <p>Our goal is to maintain a fair and respectful platform for all users.</p>
        </>
      )
    },
    {
      id: 'disclaimer',
      title: 'Platform Liability Disclaimer',
      content: (
        <>
          <p>Elocanto acts as a platform that allows users to post and view classified ads. We do not pre-verify all content uploaded by users.</p>
          <p>While we make efforts to address copyright complaints promptly, we cannot guarantee that all content on the platform is free from infringement. Users acknowledge that they use the platform at their own risk regarding content ownership and accuracy.</p>
        </>
      )
    },
    {
      id: 'updates',
      title: 'Updates to This Policy',
      content: (
        <>
          <p>We may update or modify this Copyright Policy at any time to reflect legal, operational, or platform changes.</p>
          <p>Users are encouraged to review this page regularly. Continued use of Elocanto after updates means acceptance of the revised policy.</p>
        </>
      )
    },
    {
      id: 'contact',
      title: 'Contact for Copyright Concerns',
      content: (
        <>
          <p>If you need to report copyright infringement or have any related concerns, you can contact us directly:</p>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-6">
            <p className="font-bold text-slate-900 mb-2">Support Channels:</p>
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
          <p className="mt-4">We aim to respond to valid complaints as quickly as possible and take appropriate action.</p>
        </>
      )
    }
  ], []);

  return (
    <>
      <Helmet>
        <title>Copyright Policy | Elocanto Intellectual Property Protection</title>
        <meta name="description" content="Read Elocanto Copyright Policy to understand intellectual property rules, user responsibilities, and how to report copyright infringement on our platform" />
      </Helmet>
      <LegalPageLayout 
        title="Copyright Policy"
        description="Understanding intellectual property rights and content ownership on our platform."
        sections={sections}
      />
    </>
  );
};

export default CopyrightPage;
