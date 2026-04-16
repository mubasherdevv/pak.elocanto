import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EnvelopeIcon, LockClosedIcon, ExclamationCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [message, setMessage] = useState('');
  const { forgotPassword, resetPassword, resendVerification, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    const result = await forgotPassword(email);
    if (result.success) {
      setUserId(result.userId);
      setStep(2);
      setMessage('');
    } else {
      setMessage(result.message);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    const result = await resetPassword(userId, resetCode, password);
    if (result.success) {
      navigate('/login');
    } else {
      setMessage(result.message);
    }
  };

  const handleResend = async () => {
    const result = await forgotPassword(email);
    if (result.success) {
      setResendTimer(60);
    }
  };

  return (
    <div className="page-wrapper flex-center" style={{ background: '#f7f8fa' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 40, width: '100%', maxWidth: 440, border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 14, marginBottom: 24, textDecoration: 'none' }}>
          <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Back to Login
        </Link>

        {step === 1 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ display: 'inline-block', background: '#3e6fe1', color: 'white', borderRadius: 12, padding: '4px 12px', fontWeight: 900, marginBottom: 16 }}>OLX</div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Forgot Password?</h1>
              <p style={{ color: '#6b7280', marginTop: 8 }}>Enter your email to reset your password</p>
            </div>

            {message && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <ExclamationCircleIcon style={{ width: 18, height: 18 }} /> {message}
              </div>
            )}

            <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ height: 52, borderRadius: 12, fontSize: 16 }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Reset Password</h1>
              <p style={{ color: '#6b7280', marginTop: 8 }}>Enter the code sent to<br /><strong>{email}</strong></p>
            </div>

            {message && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <ExclamationCircleIcon style={{ width: 18, height: 18 }} /> {message}
              </div>
            )}

            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="filter-label">Reset Code</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter 6-digit code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: 20 }}
                />
              </div>

              <div>
                <label className="filter-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <LockClosedIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#9ca3af' }} />
                  <input 
                    type="password" 
                    className="input-field" 
                    style={{ paddingLeft: 44 }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="filter-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <LockClosedIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#9ca3af' }} />
                  <input 
                    type="password" 
                    className="input-field" 
                    style={{ paddingLeft: 44 }}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ height: 52, borderRadius: 12, marginTop: 8 }} disabled={loading || resetCode.length !== 6}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <div style={{ textAlign: 'center' }}>
                {resendTimer > 0 ? (
                  <p style={{ color: '#6b7280', fontSize: 14 }}>Resend code in {resendTimer}s</p>
                ) : (
                  <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: '#3e6fe1', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
