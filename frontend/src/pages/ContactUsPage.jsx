import { Helmet } from 'react-helmet-async';

const ContactUsPage = () => {
  const supportChannels = [
    {
      title: 'WhatsApp Support',
      description: 'Chat with our support team instantly for quick resolutions.',
      value: '+44 7490 809237',
      link: 'https://wa.me/447490809237',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      cta: 'Message us on WhatsApp'
    },
    {
      title: 'Email Support',
      description: 'For detailed inquiries, complaints, or business partnerships.',
      value: 'support@elocanto.pk',
      link: 'mailto:support@elocanto.pk',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      cta: 'Send us an Email'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us | Elocanto Support & Help Center Pakistan</title>
        <meta name="description" content="Contact Elocanto support for help, complaints, or inquiries. Reach us via email or WhatsApp for quick assistance and 24-hour issue resolution." />
      </Helmet>

      <div className="bg-white min-h-screen pt-20 lg:pt-32 pb-24 lg:pb-40">
        <div className="container-custom px-4 md:px-6">
          {/* Professional Hero Section */}
          <div className="max-w-3xl mx-auto mb-16 lg:mb-24 text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#0f172a] mb-6 lg:mb-8 tracking-tight">
              Get in Touch
            </h1>
            <div className="h-1.5 w-12 bg-orange-500 mx-auto mb-6 lg:mb-10 rounded-full"></div>
            <p className="text-sm md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
              We&apos;re here to help. Whether you have a question about listings, safety, or partnerships, our team is ready to assist you.
            </p>
          </div>

          {/* Primary Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-20 lg:mb-32">
            {supportChannels.map((channel, idx) => (
              <a
                key={idx}
                href={channel.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-8 lg:p-10 bg-[#f8fafc] rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 transition-all duration-500 hover:bg-white hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-2xl lg:rounded-3xl flex items-center justify-center text-orange-500 shadow-sm mb-6 lg:mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  {channel.icon}
                </div>
                <h3 className="text-xl lg:text-2xl font-black text-[#0f172a] mb-3 lg:mb-4">{channel.title}</h3>
                <p className="text-sm lg:text-base text-slate-500 font-medium mb-6 lg:mb-8 leading-relaxed">
                  {channel.description}
                </p>
                <div className="text-base lg:text-lg font-bold text-[#0f172a] mb-8 lg:mb-10 pb-2 border-b-2 border-orange-500/10 group-hover:border-orange-500 transition-colors duration-500">
                  {channel.value}
                </div>
                <span className="w-full lg:w-auto px-8 py-4 bg-orange-500 text-white rounded-xl lg:rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg shadow-orange-500/20 group-hover:bg-[#0f172a] group-hover:shadow-[#0f172a]/20">
                  {channel.cta}
                </span>
              </a>
            ))}
          </div>

          {/* Secondary Information Sections */}
          <div className="max-w-4xl mx-auto space-y-8 lg:space-y-16">
            <div className="p-8 lg:p-12 bg-white rounded-[2rem] lg:rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                <div className="md:w-1/2">
                  <h3 className="text-xl lg:text-2xl font-black text-[#0f172a] mb-4 lg:mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-6 lg:h-8 bg-orange-500 rounded-full"></span>
                    Report an Issue
                  </h3>
                  <p className="text-sm lg:text-base text-slate-600 leading-relaxed font-medium">
                    If you come across any suspicious ads, fake listings, scams, or copyright issues on Elocanto, we encourage you to report it immediately. Your reports help us maintain a safe and trustworthy platform for all users.
                  </p>
                </div>
                <div className="md:w-1/2 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-12">
                  <h3 className="text-xl lg:text-2xl font-black text-[#0f172a] mb-4 lg:mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-6 lg:h-8 bg-orange-300 rounded-full"></span>
                    Response Time
                  </h3>
                  <p className="text-sm lg:text-base text-slate-600 leading-relaxed font-medium">
                    Every complaint is reviewed carefully, and necessary action is taken as soon as possible. We aim to respond to most reports within 24 hours depending on the nature of the issue.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center bg-[#f8fafc] p-10 lg:p-16 rounded-[2rem] lg:rounded-[3rem] border border-slate-100">
              <h3 className="text-xl lg:text-2xl font-black text-[#0f172a] mb-4 lg:mb-6">Business Inquiries</h3>
              <p className="text-sm lg:text-base text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto mb-8 lg:mb-10">
                If you are a business owner, advertiser, or partner and want to collaborate with Elocanto, we are open to suggestions and partnerships that help grow the platform.
              </p>
              <div className="flex flex-wrap justify-center gap-2 lg:gap-4">
                <span className="px-4 lg:px-6 py-2 bg-white border border-slate-200 rounded-full text-[10px] lg:text-sm font-bold text-slate-700">Advertising</span>
                <span className="px-4 lg:px-6 py-2 bg-white border border-slate-200 rounded-full text-[10px] lg:text-sm font-bold text-slate-700">Partnerships</span>
                <span className="px-4 lg:px-6 py-2 bg-white border border-slate-200 rounded-full text-[10px] lg:text-sm font-bold text-slate-700">Media</span>
              </div>
            </div>
          </div>

          {/* FAQ Link or Support Footer */}
          <div className="mt-20 lg:mt-32 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-4">Stay Connected</p>
            <p className="text-sm lg:text-base text-slate-600 font-medium px-4">
              We are continuously improving Elocanto to provide a better experience. <br className="hidden md:block"/> Your feedback plays an important role in shaping our future.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUsPage;
