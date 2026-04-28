import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTokens, setUser, setMustChangePassword } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      setTokens(data.accessToken, data.refreshToken);
      setMustChangePassword(data.mustChangePassword);
      
      setUser({
        id: Date.now(), 
        email: data.email,
        name: data.email.split('@')[0], 
        role: data.role
      });
      
      if (data.mustChangePassword) {
        navigate('/change-password');
        return;
      }

      const role = data.role.replace('ROLE_', '');
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'GUIDE') {
        navigate('/guide/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-up">
      <Link to="/" style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
        <ArrowLeft size={20} /> Back to Home
      </Link>
      
      <div className="glass-panel auth-card">
        <div className="flex-col gap-2" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div className="flex-center" style={{ background: 'rgba(99, 102, 241, 0.1)', width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto', marginBottom: '1rem' }}>
            <LogIn size={32} color="var(--accent-primary)" />
          </div>
          <h2 className="heading-l text-gradient">Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your credentials to access your account.</p>
        </div>

        {error && (
          <div className="flex-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1rem', borderRadius: '12px', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex-col gap-4">
          <div style={{ position: 'relative' }}>
            <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="email" 
              className="input-premium" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '3rem' }}
              required
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              className="input-premium" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '3rem' }}
              required
            />
          </div>

          <div className="flex-between">
            <label className="flex-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: 'var(--accent-primary)' }} /> Remember me
            </label>
            <Link to="/forgot-password" style={{ fontSize: '0.9rem' }}>Forgot Password?</Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? <div className="spinner"></div> : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Contact your Administrator for account onboarding.
        </p>
      </div>
      
      {/* Ambient background glows */}
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: '400px', height: '400px', background: 'var(--accent-glow)', filter: 'blur(150px)', zIndex: -1, pointerEvents: 'none' }}></div>
    </div>
  );
}
