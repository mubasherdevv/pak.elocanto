import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function NotFoundPage() {
  return (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px 20px',
      background: '#f8fafc'
    }}>
      <div style={{ 
        maxWidth: 500, 
        textAlign: 'center',
        background: 'white',
        padding: '60px 40px',
        borderRadius: 32,
        boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
        border: '1px solid #eef2ff'
      }}>
        {/* Animated Icon Wrapper */}
        <div style={{ 
          position: 'relative',
          width: 140,
          height: 140,
          margin: '0 auto 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'rgba(249, 94, 38, 0.08)',
            borderRadius: '40%',
            animation: 'morph 8s ease-in-out infinite'
          }}></div>
          <span style={{ fontSize: 72, fontWeight: 900, color: 'var(--primary)', position: 'relative' }}>404</span>
        </div>

        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 900, 
          color: '#1e293b', 
          marginBottom: 16,
          lineHeight: 1.2
        }}>
          Oops! Page Not Found
        </h1>
        
        <p style={{ 
          color: '#64748b', 
          fontSize: 16, 
          lineHeight: 1.6, 
          marginBottom: 32 
        }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12 
        }}>
          <Link 
            to="/" 
            className="btn-primary" 
            style={{ 
              justifyContent: 'center', 
              padding: '14px 24px', 
              fontSize: 15,
              boxShadow: '0 10px 20px rgba(249, 94, 38, 0.2)'
            }}
          >
            <HomeIcon style={{ width: 20 }} /> Back to Homepage
          </Link>
          
          <Link 
            to="/ads" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8,
              color: '#64748b',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              padding: '12px',
              borderRadius: 12,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = '#f1f5f9'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            <MagnifyingGlassIcon style={{ width: 18 }} /> Browse All Ads
          </Link>
        </div>

        <style>{`
          @keyframes morph {
            0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
            34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
            67% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 40%; }
          }
        `}</style>
      </div>
    </div>
  );
}
