import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import SeoContentSection from './SeoContentSection';
import FloatingScrollToTop from './FloatingScrollToTop';
import { XMarkIcon, HomeIcon, MagnifyingGlassIcon, PlusCircleIcon, UserIcon, ChatBubbleLeftRightIcon, HeartIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import WhatsAppWidget from './WhatsAppWidget';

export default function PublicLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [showPopupAd, setShowPopupAd] = useState(false);

  useEffect(() => {
    // SEO Friendly & Professional: Only show once per session with a slight delay
    const hasShown = sessionStorage.getItem('adPopupShown');
    if (!hasShown) {
      const timer = setTimeout(() => {
        setShowPopupAd(true);
        sessionStorage.setItem('adPopupShown', 'true');
      }, 2000); // 2 second delay for better user experience and SEO
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogout = () => {
    logout();
    setIsSidebarOpen(false);
    navigate('/');
  };

  const menuLinks = [
    { label: 'Home', to: '/', icon: HomeIcon },
    { label: 'Browse Ads', to: '/ads', icon: MagnifyingGlassIcon },
    { label: 'Post an Ad', to: '/post-ad', icon: PlusCircleIcon },
  ];

  const userLinks = user ? [
    { label: 'My Dashboard', to: '/dashboard', icon: UserIcon },
    { label: 'Messages', to: '/messages', icon: ChatBubbleLeftRightIcon },
    { label: 'Favorites', to: '/dashboard?tab=favorites', icon: HeartIcon },
    ...(user.isAdmin ? [{ label: 'Admin Panel', to: '/admin', icon: Cog6ToothIcon }] : []),
  ] : [
    { label: 'Login / Register', to: '/login', icon: UserIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-[80px] relative">
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[1000] backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 right-0 bottom-0 w-[300px] bg-white z-[1001] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} shadow-2xl flex flex-col`}>
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <span className="font-black text-xl tracking-tight text-gray-900 italic">MENU</span>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            {menuLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all font-bold"
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Account</p>
            <div className="space-y-1">
              {userLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all font-bold"
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-left"
                >
                  <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>

        {user && (
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>

      <SeoContentSection />

      <Footer />

      {/* Auto Popup Ad Modal - Global */}
      {showPopupAd && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: '#000000',
            padding: '36px 28px', borderRadius: 24, width: '90%', maxWidth: 380,
            textAlign: 'center', position: 'relative',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            animation: 'fadeIn 0.4s ease-out'
          }}>
            <button 
              onClick={() => setShowPopupAd(false)}
              style={{
                position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)',
                border: 'none', color: '#cbd5e1', width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover:bg-white hover:text-black"
            >
              <XMarkIcon style={{ width: 18 }} />
            </button>

            <div style={{
              width: 64, height: 64, background: '#ecfdf5', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <svg viewBox="0 0 24 24" width="32" height="32" fill="#10b981">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </div>

            <h2 style={{ color: '#ffffff', fontSize: 22, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.5px' }}>
              Promote Your Ads With Us
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
              Want to reach thousands of daily visitors? Get your ads pinned to the top. Contact us for premium advertising plans.
            </p>

            <a href="https://wa.me/447490809237?text=Hello!%20I%20saw%20your%20advertisement%20on%20your%20Elocanto%20Website.%20I'm%20interested%20in%20promoting%20my%20business.%20Can%20you%20please%20tell%20me%20about%20the%20available%20ad%20plans,%20pricing,%20and%20how%20many%20daily%20visitors%20you%20get?" target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#25D366', color: 'white',
                padding: '14px 24px', borderRadius: 12, textDecoration: 'none',
                fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(37,211,102,0.3)'
              }}
              className="hover:scale-[1.02] hover:shadow-lg"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      )}

      <MobileNav onMenuClick={() => setIsSidebarOpen(true)} />
      <FloatingScrollToTop />
      {settings?.supportPhone && <WhatsAppWidget number={settings.supportPhone} />}
    </div>
  );
}
