import LegalPageLayout from '../components/LegalPageLayout';
import { Helmet } from 'react-helmet-async';

const AntiScamPage = () => {
  const sections = [
    {
      id: 'commitment',
      title: 'Our Commitment to Transparency and Trust',
      content: (
        <>
          <p>At Elocanto, we believe that trust is the foundation of any successful online marketplace. When you visit our platform, you are not just scrolling through ads—you are interacting with real people, real opportunities, and real intentions. Because of that, we want to speak to you clearly and honestly.</p>
          <p>We want you to feel confident while using our platform. That’s why it’s important for us to make one thing very clear: Elocanto itself does not engage in any kind of scam, fraud, or misleading activity. We do not create fake listings, we do not trick users, and we do not manipulate any transactions.</p>
          <p>Our role is simple—we provide a platform where users can connect with each other.</p>
        </>
      )
    },
    {
      id: 'operates',
      title: 'Understanding How Our Platform Operates',
      content: (
        <>
          <p>To understand safety, it’s important to understand how the platform works.</p>
          <p>Elocanto is a user-driven classified ads website. This means that every ad you see is posted by an individual user. Whether it’s a product for sale, a job offer, a property listing, or a service, it is created and managed by the person who posted it.</p>
          <p>We do not own the products being sold. We are not directly involved in transactions between buyers and sellers. We do not act as a middleman in deals.</p>
          <p>Think of Elocanto as a digital meeting place—similar to a marketplace where people come together, connect, and make deals on their own terms.</p>
        </>
      )
    },
    {
      id: 'efforts',
      title: 'Our Ongoing Efforts to Maintain a Safe Marketplace',
      content: (
        <>
          <p>Even though we are not directly involved in transactions, your safety still matters to us.</p>
          <p>We actively monitor the platform and take steps to reduce misuse. If we come across suspicious activity, fake listings, or behavior that violates our policies, we take action. This may include removing ads, limiting accounts, or blocking users who misuse the platform.</p>
          <p>We also provide reporting options so that users like you can help us identify problems. When something is reported, we review it carefully and take it seriously.</p>
          <p>Our goal is to create a space where genuine users feel comfortable, respected, and protected.</p>
        </>
      )
    },
    {
      id: 'reality',
      title: 'The Reality of Online Classified Platforms',
      content: (
        <>
          <p>No online platform in the world can completely eliminate the risk of scams. Whether it’s a small website or a global marketplace, there is always a chance that some individuals may try to misuse the system.</p>
          <p>This is not unique to Elocanto—it is simply the nature of open online platforms. What matters is how we deal with it, and how aware users are while using the platform. That’s why we believe in being transparent with you instead of making unrealistic promises.</p>
        </>
      )
    },
    {
      id: 'responsibility',
      title: 'Your Responsibility as a Platform User',
      content: (
        <>
          <p>When you are dealing with someone online, it’s always a good idea to approach things with a practical mindset. If something feels too good to be true, it usually is.</p>
          <p>In real life, you wouldn’t hand over money to a stranger without checking what you’re getting in return. The same thinking should apply here. Take your time to communicate properly, ask questions, and understand the deal before making any decision.</p>
        </>
      )
    },
    {
      id: 'payment',
      title: 'Payment Safety and Financial Awareness',
      content: (
        <>
          <p>One of the most common risks in online marketplaces involves payments. We strongly encourage you to avoid making advance payments, especially when dealing with someone you do not know or have not verified. Sending money before receiving a product or service can be risky.</p>
          <p>If a seller insists on urgent payment without giving you enough time to verify details, that should be treated as a warning sign. Whenever possible, try to complete transactions in a way where both sides feel secure. Meeting in person, checking the product, and then making payment is always a safer approach.</p>
        </>
      )
    },
    {
      id: 'communication',
      title: 'Safe Communication and In-Person Deal Practices',
      content: (
        <>
          <p>When you decide to move forward with a deal, communication becomes important. Always keep conversations clear and simple. Ask direct questions and expect clear answers. If someone avoids your questions or gives unclear responses, it’s okay to step back.</p>
          <p>If you are meeting someone, choose a safe and public place. Avoid isolated locations, especially when dealing with high-value items. It’s also a good idea to let someone you trust know about your meeting, just as a precaution.</p>
        </>
      )
    },
    {
      id: 'identifying',
      title: 'Identifying and Avoiding Suspicious Activity',
      content: (
        <>
          <p>Sometimes, you don’t need technical knowledge to spot a problem. Your instinct is often your best guide. If someone is pressuring you to act quickly, offering deals that seem unrealistically cheap, or asking for personal or financial information, take a step back and think.</p>
          <p>Genuine users usually communicate in a straightforward and respectful way. They don’t rush you, and they don’t try to confuse you. Whenever something feels off, trust that feeling.</p>
        </>
      )
    },
    {
      id: 'protection',
      title: 'User Protection, Reporting System, and Quick Action Commitment',
      content: (
        <>
          <p>At Elocanto, we have not only built a platform for listings, but we have also made sure that users have full control when it comes to safety and reporting concerns.</p>
          <p>We have enabled multiple options across the website that allow users to report any kind of issue they may face. Whether it is related to a suspicious listing, potential fraud, misleading information, or even copyright concerns, you are always given a way to raise a complaint directly with us.</p>
          <p>Once a complaint is submitted, our team reviews it carefully and takes appropriate action. We are committed to responding quickly and responsibly. In most cases, we aim to review and resolve reported issues within 24 hours.</p>
        </>
      )
    },
    {
      id: 'shared',
      title: 'Shared Responsibility for a Safer Community',
      content: (
        <>
          <p>Creating a safe online environment is a shared effort. We are committed to providing a reliable and honest platform. We work continuously to improve safety, remove harmful content, and maintain trust.</p>
          <p>At the same time, your awareness, patience, and careful decision-making play an equally important role. When both sides do their part, the platform becomes stronger, safer, and more useful for everyone.</p>
        </>
      )
    },
    {
      id: 'final',
      title: 'Final Thoughts and User Assurance',
      content: (
        <>
          <p>Elocanto is built for real people looking for real opportunities. Whether you are buying, selling, or offering services, we want your experience to be smooth and secure.</p>
          <p>We do not support scams, and we actively work against them. At the same time, we encourage you to stay alert, take your time, and make informed decisions.</p>
          <p>If something doesn’t feel right, trust your judgment. And if you ever need help, we are here to listen.</p>
        </>
      )
    }
  ];

  return (
    <>
      <Helmet>
        <title>Anti-Scam Policy & User Safety Guidelines | Elocanto Pakistan</title>
        <meta name="description" content="Learn how Elocanto protects users from scams and fraud. Read our anti-scam policy, safety guidelines, and how to report suspicious ads with 24-hour response support." />
      </Helmet>
      <LegalPageLayout 
        title="Anti-Scam Policy"
        description="Your safety is our priority. Learn how to identify and stay protected from common online fraud."
        sections={sections}
      />
    </>
  );
};

export default AntiScamPage;
