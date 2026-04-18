import LegalPageLayout from '../components/LegalPageLayout';
import { Helmet } from 'react-helmet-async';

const AboutUsPage = () => {
  const sections = [
    {
      id: 'vision',
      title: 'Our Vision: Connecting People Through Digital Classifieds',
      content: (
        <>
          <p>Elocanto is a modern online classified ads platform designed to connect people across Pakistan through simple, fast, and reliable listings. Our goal is to make buying, selling, and offering services easier for everyone by providing a digital space where real people can interact directly.</p>
          <p>We believe that opportunities should be accessible to everyone, whether you are selling a product, searching for a job, renting a property, or offering a service. Elocanto is built to bring these opportunities together in one place.</p>
        </>
      )
    },
    {
      id: 'offers',
      title: 'Platform Overview: What Elocanto Offers',
      content: (
        <>
          <p>Elocanto allows users to post and explore a wide range of classified ads across multiple categories.</p>
          <p>From jobs and real estate to vehicles, services, and personal items, our platform is designed to support everyday needs and business opportunities.</p>
          <p>We provide a simple and user-friendly system where users can create listings, reach potential buyers, and communicate directly without unnecessary complexity.</p>
        </>
      )
    },
    {
      id: 'marketplace',
      title: 'How Elocanto Works: A User-Driven Marketplace',
      content: (
        <>
          <p>Elocanto is a user-generated platform, which means all ads are created and managed by individual users.</p>
          <p>We do not sell products or services directly. Instead, we provide the platform where users can connect, communicate, and complete transactions independently.</p>
          <p>This model gives users full control over their listings while allowing flexibility and freedom in how they interact with others.</p>
        </>
      )
    },
    {
      id: 'safety',
      title: 'Our Commitment to Platform Quality and Safety',
      content: (
        <>
          <p>Our priority is to create a safe, easy, and reliable experience for all users.</p>
          <p>We continuously work to improve platform performance, reduce fake listings, and maintain a clean and trustworthy environment. We also provide reporting tools so users can report suspicious ads or activity.</p>
          <p>User feedback is important to us, and we aim to respond to concerns as quickly as possible to maintain a positive user experience.</p>
        </>
      )
    },
    {
      id: 'trust',
      title: 'Building Trust and User Safety Awareness',
      content: (
        <>
          <p>We understand that trust is essential in any online marketplace.</p>
          <p>While we provide tools and systems to help maintain safety, we also encourage users to stay alert and make informed decisions when interacting with others.</p>
          <p>Elocanto is built for real users and real opportunities, but users are always advised to follow safe practices when dealing online.</p>
        </>
      )
    },
    {
      id: 'mission',
      title: 'Our Mission and Core Objectives',
      content: (
        <>
          <p>Our mission is to make online classifieds simple, accessible, and reliable for everyone in Pakistan.</p>
          <p>We aim to empower individuals and businesses by giving them a platform where they can connect without barriers and grow their opportunities in a digital environment.</p>
        </>
      )
    },
    {
      id: 'support',
      title: 'Contact Us and User Support',
      content: (
        <>
          <p>We are always open to feedback, suggestions, and support requests.</p>
          <p>If you have any questions or need assistance, you can reach us through our support channels:</p>
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
          <p className="mt-4">We are committed to helping our users and continuously improving the platform experience.</p>
        </>
      )
    }
  ];

  return (
    <>
      <Helmet>
        <title>About Us | Elocanto Classified Ads Platform Pakistan</title>
        <meta name="description" content="Learn about Elocanto, a trusted classified ads platform in Pakistan connecting buyers and sellers for jobs, property, vehicles, and services." />
      </Helmet>
      <LegalPageLayout 
        title="About Elocanto"
        description="Empowering connections through a simple, safe, and reliable marketplace across Pakistan."
        sections={sections}
      />
    </>
  );
};

export default AboutUsPage;
