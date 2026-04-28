import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Mail, Lock, AlertCircle, ArrowLeft, Key } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('An OTP has been sent to your email address.');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-up">
      <Link to="/login" style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
        <ArrowLeft size={20} /> Back to Login
      </Link>
      
      <div className="glass-panel auth-card">
        <div className="flex-col gap-2" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div className="flex-center" style={{ background: 'rgba(99, 102, 241, 0.1)', width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto', marginBottom: '1rem' }}>
            <Key size={32} color="var(--accent-primary)" />
          </div>
          <h2 className="heading-l text-gradient">Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {step === 1 ? "Enter your email to receive a secure OTP." : "Enter the OTP sent to your email and your new password."}
          </p>
        </div>

        {error && (
          <div className="flex-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1rem', borderRadius: '12px', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex-center gap-2" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '1rem', borderRadius: '12px', color: 'var(--success)' }}>
            <span style={{ fontSize: '0.9rem' }}>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="flex-col gap-4 mt-2">
            <div style={{ position: 'relative' }}>
              <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                className="input-premium" 
                placeholder="Registered Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '3rem' }}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? <div className="spinner"></div> : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex-col gap-4 mt-2 animate-fade-in">
            <div style={{ position: 'relative' }}>
              <Key size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="input-premium" 
                placeholder="6-Digit OTP" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ paddingLeft: '3rem', letterSpacing: '0.2rem', fontWeight: 'bold' }}
                required
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                className="input-premium" 
                placeholder="New Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ paddingLeft: '3rem' }}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? <div className="spinner"></div> : 'Verify & Reset Password'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{ width: '100%', marginTop: '0.5rem' }}>
               Back to Email
            </button>
          </form>
        )}
      </div>
      
      {/* Ambient background glows */}
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: '400px', height: '400px', background: 'var(--accent-glow)', filter: 'blur(150px)', zIndex: -1, pointerEvents: 'none' }}></div>
    </div>
  );
}
