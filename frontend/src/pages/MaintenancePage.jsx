import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { 
  WrenchScrewdriverIcon, 
  ArrowRightIcon, 
  EnvelopeIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Soft Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange-100 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-white rounded-[48px] shadow-[0_32px_100px_-20px_rgba(0,0,0,0.08)] border border-gray-100 p-8 md:p-14 text-center">
          {/* Logo Section */}
          <div className="mb-10 flex justify-center">
            {settings?.logo ? (
              <img src={settings.logo} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <div className="text-2xl font-black text-gray-900 tracking-tight">
                {settings?.siteName || 'MARKETPLACE'}
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-8">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-[11px] font-black text-orange-600 uppercase tracking-widest">System Maintenance</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-[1.15]">
            We're polishing things up for you.
          </h1>

          {/* Message */}
          <p className="text-gray-500 text-base md:text-lg font-medium leading-relaxed mb-10 px-4">
            {settings?.maintenanceMessage || "Our team is currently performing a scheduled update. We'll be back online and better than ever in just a moment!"}
          </p>

          {/* Progress Visual */}
          <div className="flex justify-center gap-3 mb-12">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden relative"
              >
                <div 
                  className="absolute inset-0 bg-orange-500 rounded-full animate-progress"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-gray-50 border border-gray-100/50">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Us</span>
                <span className="block text-xs font-bold text-gray-700 truncate max-w-[120px]">
                  {settings?.contactEmail || 'support@market.pk'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-gray-50 border border-gray-100/50">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <CircleStackIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                <span className="block text-xs font-bold text-green-600">Servers Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Admin Link */}
        <div className="mt-8 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all text-[11px] font-bold uppercase tracking-widest group"
          >
            <span>Admin Control Panel</span>
            <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
