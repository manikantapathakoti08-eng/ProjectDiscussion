import { Link } from 'react-router-dom';
import { Sparkles, Code, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex-col min-h-screen">
      {/* Dynamic Navbar */}
      <nav className="flex-between" style={{ padding: '1.5rem 3rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex-center gap-2">
          <div style={{ background: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '12px' }}>
            <Sparkles size={24} color="white" />
          </div>
          <span className="heading-m text-gradient">Guide & Student App</span>
        </div>
        <div className="flex-center gap-4">
          <Link to="/login" className="btn-secondary">Sign In</Link>
          <Link to="/signup" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-col flex-center animate-fade-up" style={{ padding: '6rem 2rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto', gap: '2rem' }}>
        <div className="badge badge-accent animate-fade-up">Project Discussion Platform</div>
        
        <h1 className="heading-xl">
          Complete your projects with <br />
          <span className="text-gradient">expert guides.</span>
        </h1>
        
        <p className="heading-m delay-100" style={{ color: 'var(--text-secondary)', maxWidth: '700px', fontWeight: 400 }}>
          Connect with industry guides, book project discussion sessions, and achieve your goals faster.
        </p>

        <div className="flex-center gap-4 delay-200" style={{ marginTop: '1rem' }}>
          <Link to="/signup" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            <span>Join for Free</span>
            <ArrowRight size={20} />
          </Link>
          <Link to="/guides" className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Explore Guides
          </Link>
        </div>

        {/* Feature Cards Showcase */}
        <div className="delay-300" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', width: '100%', marginTop: '4rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: 'max-content', padding: '1rem', borderRadius: '16px' }}>
              <Code size={28} color="var(--accent-primary)" />
            </div>
            <h3 className="heading-m">Top-tier Guides</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Learn from verified professionals who have been rigorously vetted.</p>
          </div>
          
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', width: 'max-content', padding: '1rem', borderRadius: '16px' }}>
              <ShieldCheck size={28} color="var(--success)" />
            </div>
            <h3 className="heading-m">Project Focus</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Get deep insights into your project architecture and implementation.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: 'max-content', padding: '1rem', borderRadius: '16px' }}>
              <Zap size={28} color="var(--warning)" />
            </div>
            <h3 className="heading-m">Live Interaction</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Built-in real-time video links and live socket chat for instant communication.</p>
          </div>
        </div>
      </main>

      {/* Decorative Blob */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'var(--accent-glow)', filter: 'blur(150px)', zIndex: -1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: '600px', height: '600px', background: 'rgba(139, 92, 246, 0.3)', filter: 'blur(150px)', zIndex: -1, pointerEvents: 'none' }}></div>
    </div>
  );
}
