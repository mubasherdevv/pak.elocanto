import { useState } from 'react';
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

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      
      {/* Hide Footer & SEO on mobile ad detail & dashboard pages for app-like focus */}
      {!( (window.location.pathname.includes('/ads/') || window.location.pathname === '/dashboard') && window.innerWidth < 1024) && (
        <>
          <SeoContentSection />
          <Footer />
        </>
      )}
      <MobileNav onMenuClick={() => setIsSidebarOpen(true)} />
      <FloatingScrollToTop />
      {settings?.supportPhone && <WhatsAppWidget number={settings.supportPhone} />}
    </div>
  );
}
