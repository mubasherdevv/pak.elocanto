import React from 'react';
import { 
  Squares2X2Icon, 
  ShieldCheckIcon, 
  ChatBubbleLeftRightIcon, 
  ArrowsRightLeftIcon, 
  MapPinIcon 
} from '@heroicons/react/24/outline';

const HowItWorks = () => {
  const highlights = [
    { title: "Structured Listings", desc: "Categorized and easy to browse", icon: Squares2X2Icon },
    { title: "Privacy First", desc: "Secure browsing with no data tracking", icon: ShieldCheckIcon },
    { title: "Direct Chat", desc: "Interact directly with profile managers", icon: ChatBubbleLeftRightIcon },
    { title: "No Delay", desc: "No intermediaries or centralized delays", icon: ArrowsRightLeftIcon },
    { title: "Location Based", desc: "Convenient filtering for your area", icon: MapPinIcon },
  ];

  return (
    <section className="container-custom py-16">
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8 md:p-12 overflow-hidden relative">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
            Operational Overview
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight">
            How Our Platform Works
          </h2>
          
          <div className="grid md:grid-cols-2 gap-10 mb-12">
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed font-medium text-sm md:text-base">
                Our platform is designed to provide a structured, safe, and privacy-focused browsing experience. Every listing goes through a basic review process before being published to ensure quality and consistency across the platform.
              </p>
              <p className="text-slate-600 leading-relaxed font-medium text-sm md:text-base">
                We follow a strict privacy-first approach. The platform does not store unnecessary personal information, and all interactions happen directly between users and profile managers. This ensures a secure communication process without third-party involvement.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed font-medium text-sm md:text-base">
                Listings are organized in a clear format, helping users quickly find relevant profiles without cluttered information. Each profile is presented based on details such as availability schedule, meeting locations, and expected response time.
              </p>
              <p className="text-slate-600 leading-relaxed font-medium text-sm md:text-base">
                Our system works on a direct listing model, where each profile is managed independently. This allows faster responses, better transparency, and a smoother overall user experience for our valued community.
              </p>
            </div>
          </div>

          <hr className="border-slate-100 mb-12" />
          
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Platform Highlights</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {highlights.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-[10px] text-slate-500 font-bold leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
