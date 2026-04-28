import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import { Lock, ShieldCheck, AlertCircle, Check } from 'lucide-react';

export function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { user, setMustChangePassword } = useAuthStore();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setSuccess(true);
      setMustChangePassword(false);
      
      setTimeout(() => {
        const role = user?.role.replace('ROLE_', '');
        if (role === 'ADMIN') navigate('/admin');
        else if (role === 'GUIDE') navigate('/guide/dashboard');
        else navigate('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password. Check your temporary password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-up">
      <div className="glass-panel auth-card" style={{ maxWidth: '450px' }}>
        <div className="flex-col gap-2" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-center" style={{ background: 'rgba(34, 197, 94, 0.1)', width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto', marginBottom: '1rem' }}>
            <ShieldCheck size={32} color="var(--success)" />
          </div>
          <h2 className="heading-l text-gradient">Set New Password</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to projectMeeting! Since this is your first login, please update your temporary password to continue.</p>
        </div>

        {error && (
          <div className="flex-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1rem', borderRadius: '12px', color: 'var(--error)', marginBottom: '1.5rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex-col flex-center gap-4 animate-scale-in" style={{ padding: '2rem 0' }}>
            <div className="pulse-success" style={{ width: '80px', height: '80px', background: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
               <Check size={40} strokeWidth={3} />
            </div>
            <p style={{ color: 'var(--success)', fontWeight: 600 }}>Password updated! Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col gap-5">
            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Temporary Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  className="input-premium" 
                  placeholder="Enter the password from email" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required
                />
              </div>
            </div>

            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>New Secure Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  className="input-premium" 
                  placeholder="Minimum 6 characters" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required
                />
              </div>
            </div>

            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  className="input-premium" 
                  placeholder="Repeat new password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? <div className="spinner"></div> : 'Update & Continue'}
            </button>
          </form>
        )}
      </div>
      
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: '400px', height: '400px', background: 'var(--accent-glow)', filter: 'blur(150px)', zIndex: -1, pointerEvents: 'none' }}></div>
    </div>
  );
}
