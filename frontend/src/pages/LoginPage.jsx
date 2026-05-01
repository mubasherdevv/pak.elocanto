import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { EnvelopeIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import NoIndex from '../components/NoIndex';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, loading, error } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.isAdmin) navigate('/admin');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };


  return (
    <div className="page-wrapper flex-center" style={{ background: '#f7f8fa' }}>
      <NoIndex />
      <div style={{ background: 'white', borderRadius: 24, padding: 40, width: '100%', maxWidth: 440, border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: 16 }}>
            {settings?.logo ? (
              <img src={settings.logo} alt={settings?.siteName} style={{ maxHeight: 60, width: 'auto' }} />
            ) : (
              <div style={{ background: '#3e6fe1', color: 'white', borderRadius: 12, padding: '4px 12px', fontWeight: 900 }}>{settings?.siteName || 'OLX'}</div>
            )}
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Welcome Back</h1>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Log in to manage your ads and messages</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
            <ExclamationCircleIcon style={{ width: 18, height: 18 }} /> {error}
          </div>
        )}

        {settings && settings.enableUserLogin === false && (
          <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
            <ExclamationCircleIcon style={{ width: 18, height: 18 }} /> 
            Public login is disabled. Only Administrators can access the dashboard.
          </div>
        )}




        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="filter-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <EnvelopeIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#9ca3af' }} />
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: 44 }}
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="filter-label">Password</label>
            <div style={{ position: 'relative' }}>
              <LockClosedIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#9ca3af' }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: 44 }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: '#3e6fe1', fontWeight: 600 }}>Forgot password?</Link>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ height: 52, borderRadius: 12, fontSize: 16 }} 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>


        </form>

        <div style={{ marginTop: 32, textAlign: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 24 }}>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Don't have an account? <Link to="/register" style={{ color: '#3e6fe1', fontWeight: 700 }}>Register Now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
