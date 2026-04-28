import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { UserPlus, Mail, Lock, AlertCircle, ArrowLeft, User as UserIcon } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/signup', { name, email, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
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
          <div className="flex-center" style={{ background: 'rgba(34, 197, 94, 0.1)', width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto', marginBottom: '1rem' }}>
            <UserPlus size={32} color="var(--success)" />
          </div>
          <h2 className="heading-l text-gradient">Create Account</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Join and start discussing projects today.</p>
        </div>

        {error && (
          <div className="flex-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1rem', borderRadius: '12px', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex-center gap-2" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '1rem', borderRadius: '12px', color: 'var(--success)' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>Account created! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="flex-col gap-4">
          <div style={{ position: 'relative' }}>
            <UserIcon size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input-premium" 
              placeholder="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ paddingLeft: '3rem' }}
              required
            />
          </div>

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
              placeholder="Create Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '3rem' }}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || success} style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, var(--success), #15803d)' }}>
            {loading ? <div className="spinner"></div> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--success)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
      
      {/* Ambient background glows */}
      <div style={{ position: 'fixed', top: '20%', right: '10%', width: '400px', height: '400px', background: 'rgba(34, 197, 94, 0.2)', filter: 'blur(150px)', zIndex: -1, pointerEvents: 'none' }}></div>
    </div>
  );
}
