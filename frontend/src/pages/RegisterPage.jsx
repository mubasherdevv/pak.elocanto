import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { UserIcon, EnvelopeIcon, LockClosedIcon, PhoneIcon, MapPinIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import NoIndex from '../components/NoIndex';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: ''
  });
  const [verifyCode, setVerifyCode] = useState('');
  const [userId, setUserId] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const { register, verifyEmail, resendVerification, user, loading, error } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(formData.name, formData.email, formData.password, formData.phone, formData.city);
    if (result.success) {
      setUserId(result.userId);
      setStep(2);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const result = await verifyEmail(userId, verifyCode);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleResend = async () => {
    const result = await resendVerification(userId);
    if (result.success) {
      setResendTimer(60);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  return (
    <div className="page-wrapper flex-center" style={{ background: '#f7f8fa' }}>
      <NoIndex />
      <div style={{ background: 'white', borderRadius: 24, padding: 40, width: '100%', maxWidth: 480, border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
        {step === 1 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Link to="/" style={{ display: 'inline-block', marginBottom: 16 }}>
                {settings?.logo ? (
                  <img src={settings.logo} alt={settings?.siteName} style={{ maxHeight: 60, width: 'auto' }} />
                ) : (
                  <div style={{ background: '#3e6fe1', color: 'white', borderRadius: 12, padding: '4px 12px', fontWeight: 900 }}>{settings?.siteName || 'OLX'}</div>
                )}
              </Link>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Create Account</h1>
              <p style={{ color: '#6b7280', marginTop: 8 }}>Join Pakistan's largest marketplace today</p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <ExclamationCircleIcon style={{ width: 18, height: 18 }} /> {error}
              </div>
            )}

            {settings && settings.enableUserRegistration === false && (
              <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <ExclamationCircleIcon style={{ width: 18, height: 18 }} /> 
                New user registration is currently disabled by administrator.
              </div>
            )}



            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="filter-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <input name="name" type="text" className="input-field" style={{ paddingLeft: 40 }} placeholder="Your name" value={formData.name} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="filter-label">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <EnvelopeIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <input name="email" type="email" className="input-field" style={{ paddingLeft: 40 }} placeholder="email@example.com" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div>
                <label className="filter-label">Phone *</label>
                <div style={{ position: 'relative' }}>
                  <PhoneIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <input name="phone" type="text" className="input-field" style={{ paddingLeft: 40 }} placeholder="0300..." value={formData.phone} onChange={handleChange} required />
                </div>
              </div>

              <div>
                <label className="filter-label">City *</label>
                <div style={{ position: 'relative' }}>
                  <MapPinIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <select name="city" className="input-field" style={{ paddingLeft: 40 }} value={formData.city} onChange={handleChange} required>
                    <option value="">Select City</option>
                    {['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="filter-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <LockClosedIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                  <input name="password" type="password" className="input-field" style={{ paddingLeft: 40 }} placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ gridColumn: 'span 2', height: 52, borderRadius: 12, marginTop: 8 }} 
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>


            </form>

            <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 16 }}>
              By registering, you agree to our Terms of Use and Privacy Policy.
            </p>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', margin: '0 auto 16px' }}>
                <EnvelopeIcon style={{ width: 32, height: 32, color: '#16a34a' }} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Verify Your Email</h1>
              <p style={{ color: '#6b7280', marginTop: 8 }}>We've sent a verification code to<br /><strong>{formData.email}</strong></p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <ExclamationCircleIcon style={{ width: 18, height: 18 }} /> {error}
              </div>
            )}

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="filter-label">Verification Code</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter 6-digit code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: 20 }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ height: 52, borderRadius: 12 }} disabled={loading || verifyCode.length !== 6}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div style={{ textAlign: 'center' }}>
                {resendTimer > 0 ? (
                  <p style={{ color: '#6b7280', fontSize: 14 }}>Resend code in {resendTimer}s</p>
                ) : (
                  <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: '#3e6fe1', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                    Resend Verification Code
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Already have an account? <Link to="/login" style={{ color: '#3e6fe1', fontWeight: 700 }}>Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
