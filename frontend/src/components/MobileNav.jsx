import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, MagnifyingGlassIcon, UserIcon, Bars3Icon, PlusIcon } from '@heroicons/react/24/outline';

export default function MobileNav({ onMenuClick }) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white flex justify-around items-center p-[12px_10px_16px] z-[200] border-t border-[#f1f5f9] shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
      <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: path === '/' ? 'var(--primary)' : 'var(--gray-400)', textDecoration: 'none', flex: 1 }}>
        <HomeIcon style={{ width: 22, height: 22 }} />
        <span style={{ fontSize: 9, fontWeight: 800 }}>HOME</span>
      </Link>
      <Link to="/ads" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: path === '/ads' ? 'var(--primary)' : 'var(--gray-400)', textDecoration: 'none', flex: 1 }}>
        <MagnifyingGlassIcon style={{ width: 22, height: 22 }} />
        <span style={{ fontSize: 9, fontWeight: 800 }}>SEARCH</span>
      </Link>
      
      {/* Floating Center Action Button */}
      <Link to="/post-ad" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', position: 'relative', top: -20, flex: 1
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 20px rgba(249, 94, 38, 0.4)', border: '4px solid white'
        }}>
          <PlusIcon style={{ width: 28, height: 28 }} strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray-600)', marginTop: 2 }}>POST AD</span>
      </Link>

      <Link to="/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: path.startsWith('/dashboard') ? 'var(--primary)' : 'var(--gray-400)', textDecoration: 'none', flex: 1 }}>
        <UserIcon style={{ width: 22, height: 22 }} />
        <span style={{ fontSize: 9, fontWeight: 800 }}>PROFILE</span>
      </Link>
      <button 
        onClick={onMenuClick}
        style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, 
          color: 'var(--gray-400)', background: 'none', border: 'none', 
          cursor: 'pointer', flex: 1, padding: 0 
        }}
      >
        <Bars3Icon style={{ width: 22, height: 22 }} />
        <span style={{ fontSize: 9, fontWeight: 800 }}>MENU</span>
      </button>
    </div>
  );
}
