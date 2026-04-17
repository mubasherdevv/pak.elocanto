import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    MagnifyingGlassIcon, UserCircleIcon, BellIcon,
    HeartIcon, ChatBubbleLeftRightIcon, Bars3Icon, XMarkIcon,
    BuildingStorefrontIcon, PlusCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getOptimizedImageUrl } from '../utils/imageUtils';

export default function Navbar({ onMenuClick }) {
    const { user, logout } = useAuth();
    const { settings } = useSettings();

    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) navigate(`/ads?keyword=${encodeURIComponent(search.trim())}`);
    };


    return (
        <header style={{ background: 'white', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #f1f5f9', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
            <div className="container-custom" style={{ display: 'flex', alignItems: 'center', height: 72, gap: 12 }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', minWidth: 140, height: 40, gap: 8, textDecoration: 'none', flexShrink: 0 }}>
                    {settings?.logo ? (
                        <img src={settings.logo} alt={settings?.siteName || 'Logo'} width="140" height="35" style={{ height: 35, width: 'auto', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--primary), #ff8555)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <BuildingStorefrontIcon style={{ width: 20, height: 20 }} />
                            </div>
                            <div style={{
                                color: 'var(--dark)',
                                fontWeight: 900, fontSize: 20, letterSpacing: '-0.8px', textTransform: 'uppercase'
                            }}>
                                {settings?.siteName || 'Elocanto'}
                            </div>
                        </div>
                    )}
                </Link>

                {/* Hamburger Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="hover:bg-gray-100 transition-colors"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '10px', borderRadius: 12, color: 'var(--gray-600)',
                    }}
                    aria-label="Open menu"
                >
                    <Bars3Icon style={{ width: 28, height: 28 }} />
                </button>

                {/* Right actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
                    {/* User menu */}
                    {user ? (
                        <div ref={userMenuRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, background: 'none',
                                    border: 'none', padding: '4px',
                                    cursor: 'pointer', fontFamily: 'inherit'
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    {user.profilePhoto
                                        ? <img src={getOptimizedImageUrl(user.profilePhoto, 100)} alt={user.name} width="36" height="36" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 0 0 1px var(--gray-200)' }} />
                                        : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCircleIcon style={{ width: 24, height: 24, color: 'var(--gray-400)' }} /></div>
                                    }
                                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, background: '#22c55e', border: '2px solid white', borderRadius: '50%' }}></div>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }} className="hidden md:block">
                                    {(user.name || '').split(' ')[0]}
                                </span>
                            </button>

                            {userMenuOpen && (
                                <div style={{
                                    position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                                    background: 'white', border: '1px solid #f1f5f9',
                                    borderRadius: 20, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)',
                                    minWidth: 240, overflow: 'hidden', zIndex: 200
                                }}>
                                    <div style={{ padding: '20px', background: 'linear-gradient(to bottom, #f8fafc, white)', borderBottom: '1px solid #f1f5f9' }}>
                                        <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--dark)', tracking: '-0.3px' }}>{user.name || 'User'}</p>
                                        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{user.email}</p>
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        {[
                                            { label: 'My Dashboard', to: '/dashboard', icon: '📊' },
                                            { label: 'Public Profile', to: '/profile', icon: '👤' },
                                            { label: 'My Ads', to: '/dashboard?tab=ads', icon: '📦' },
                                            // { label: 'Messages', to: '/messages', icon: '💬' },
                                            { label: 'Favorites', to: '/dashboard?tab=favorites', icon: '❤️' },
                                            ...(user.isAdmin ? [{ label: 'Admin Panel', to: '/admin', icon: '⚙️' }] : []),
                                        ].map(item => (
                                            <Link
                                                key={item.to}
                                                to={item.to}
                                                onClick={() => setUserMenuOpen(false)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none',
                                                    color: 'var(--gray-700)', fontSize: 14, fontWeight: 600, borderRadius: 12, transition: 'all 0.2s'
                                                }}
                                                className="hover:bg-gray-50 hover:translate-x-1"
                                            >
                                                <span style={{ fontSize: 16 }}>{item.icon}</span>
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '8px' }}>
                                        <button
                                            onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                                            style={{
                                                width: '100%', padding: '12px 16px', textAlign: 'left',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--danger)', fontSize: 14, fontWeight: 700, borderRadius: 12
                                            }}
                                            className="hover:bg-red-50"
                                        >
                                            Logout Account
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="btn-ghost" style={{ fontSize: 14, fontWeight: 700, gap: 6 }}>
                            <UserCircleIcon style={{ width: 22, height: 22 }} /> <span className="hidden sm:inline">Login</span>
                        </Link>
                    )}

                    {/* Post Ad CTA */}
                    <Link
                        to="/post-ad"
                        className="btn-primary"
                        style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                            borderRadius: '16px',
                            fontSize: '13px',
                            fontWeight: 800,
                            boxShadow: '0 8px 20px -6px rgba(234, 88, 12, 0.4)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <PlusCircleIcon style={{ width: 20, height: 20 }} />
                        <span className="hidden sm:inline">Post Ad</span>
                    </Link>
                </div>
            </div>

        </header>
    );
}
