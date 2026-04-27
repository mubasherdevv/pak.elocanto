import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  Squares2X2Icon,
  UsersIcon,
  TagIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  MapPinIcon,
  DocumentTextIcon,
  TagIcon as TagIconSolid,
  ChartBarIcon,
  LinkIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { TagIcon as TagIconMini } from '@heroicons/react/20/solid';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import FloatingScrollToTop from './FloatingScrollToTop';
import NoIndex from './NoIndex';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved === 'true';
  });

  React.useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  const menuItems = [
    { label: 'Dashboard', icon: Squares2X2Icon, path: '/admin' },
    { label: 'Users', icon: UsersIcon, path: '/admin/users', permission: 'manage_users' },
    { label: 'Ads Management', icon: TagIcon, path: '/admin/ads', permission: 'manage_ads' },
    { label: 'Ads & Engagement', icon: ChartBarIcon, path: '/admin/ads-analytics', permission: 'manage_ads' },
    { label: 'Categories', icon: FolderIcon, path: '/admin/categories', permission: 'manage_categories' },
    { label: 'Cities', icon: MapPinIcon, path: '/admin/cities', permission: 'manage_cities' },
    { label: 'Reports', icon: ExclamationTriangleIcon, path: '/admin/reports', permission: 'view_reports' },
    { label: 'SEO Content', icon: DocumentTextIcon, path: '/admin/seo', permission: 'manage_seo' },
    { label: 'Titles & Tags (SEO)', icon: TagIconSolid, path: '/admin/titles-seo', permission: 'manage_seo' },
    { label: 'Redirects Manager', icon: LinkIcon, path: '/admin/redirects', permission: 'manage_seo' },
    { label: 'Settings', icon: Cog6ToothIcon, path: '/admin/settings', permission: 'manage_settings' },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    if (user?.permissions?.includes('superadmin')) return true;
    return user?.permissions?.includes(item.permission);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Route Guard: Redirect if user manually tries to access unauthorized URL
  React.useEffect(() => {
    // Skip check for root admin dashboard
    if (location.pathname === '/admin') return;

    // Find the menu item that starts with this path (to handle /admin/ads?filter etc)
    const currentItem = menuItems.find(item => location.pathname.startsWith(item.path) && item.path !== '/admin');
    
    if (currentItem && currentItem.permission) {
      const hasPermission = user?.permissions?.includes('superadmin') || user?.permissions?.includes(currentItem.permission);
      if (!hasPermission) {
        navigate('/admin', { replace: true });
      }
    }
  }, [location.pathname, user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <NoIndex />
      {/* Sidebar for Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-[#1a2332] text-white 
        transform transition-all duration-300 ease-in-out md:transition-all
        md:fixed md:translate-x-0 flex flex-col
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
      `}>
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} shrink-0 relative`}>
          <Link to="/admin" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              {settings?.logo ? (
                <img src={settings.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
                  {settings?.siteName?.charAt(0) || 'E'}
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-fadeIn">
                <span className="text-xl font-bold tracking-tight text-white leading-none truncate">
                  {settings?.siteName || 'Elocanto'}
                </span>
                <span className="text-orange-500 text-[9px] uppercase tracking-[0.2em] font-black mt-1">
                  Admin Panel
                </span>
              </div>
            )}
          </Link>
          
          {/* Desktop Toggle Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-500 rounded-full items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
          >
            <ChevronLeftIcon className={`w-4 h-4 text-white transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>

          <button className="md:hidden ml-auto p-1 hover:bg-white/10 rounded-lg" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto mt-2 px-4 space-y-2 py-4 no-scrollbar">
          {visibleMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all duration-200 group
                ${location.pathname === item.path
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${location.pathname === item.path ? 'text-white' : 'group-hover:text-white'}`} />
              {!isCollapsed && <span className="font-semibold text-sm truncate animate-fadeIn">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0 space-y-2">
          <div className={`bg-white/5 rounded-2xl ${isCollapsed ? 'p-2' : 'p-4'} transition-all`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              {user?.profilePhoto ? (
                <img 
                  src={getOptimizedImageUrl(user.profilePhoto, 100)} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-orange-500/20 shadow-lg shrink-0" 
                  alt=""
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f97316&color=fff`;
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20 shrink-0">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0 animate-fadeIn">
                  <p className="text-sm font-bold truncate text-white">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-gray-400 truncate tracking-wider uppercase font-medium">Master Access</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-gray-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-all`}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-semibold text-sm animate-fadeIn">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4">
          <button className="md:hidden p-2 text-gray-500" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-6 h-6" />
          </button>

          <div className="flex-1 flex justify-end items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">Server Status: <span className="text-green-500 ml-1 italic">Online</span></span>
            <div className="w-px h-6 bg-gray-100 hidden sm:block"></div>
            <Link to="/" className="text-sm font-bold text-orange-500 hover:underline">View Website</Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        <FloatingScrollToTop />
      </div>

      {/* Overlay for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
