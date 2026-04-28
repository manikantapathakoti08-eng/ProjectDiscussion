import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllProfiles, searchGuides } from '../api/user.api';
import type { UserProfileDTO } from '../api/user.api';
import { useAuthStore } from '../store/authStore';
import { LogOut, Home, Compass, User as UserIcon, Search, Star, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BookingModal from '../components/session/BookingModal';
import GuideProfileModal from '../components/mentor/GuideProfileModal';

export default function ExploreGuides() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<UserProfileDTO | null>(null);
  const [activeProfile, setActiveProfile] = useState<UserProfileDTO | null>(null);
  
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: guides, isLoading, isError } = useQuery({
    queryKey: ['guides', activeSearch],
    queryFn: () => activeSearch ? searchGuides(activeSearch, 0) : getAllProfiles()
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '280px', margin: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '1rem', height: 'calc(100vh - 2rem)' }}>
        <h2 className="heading-m text-gradient">Dashboard</h2>
        
        <nav className="flex-col gap-2">
          <Link to="/dashboard" className="flex-center gap-4" style={{ padding: '1rem', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}>
            <Home size={20} />
            <span style={{ fontWeight: 500 }}>Dashboard</span>
          </Link>
          <Link to="/guides" className="flex-center gap-4" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--text-primary)' }}>
            <Compass size={20} color="var(--accent-primary)" />
            <span style={{ fontWeight: 500 }}>Explore Guides</span>
          </Link>
          <Link to="/profile" className="flex-center gap-4" style={{ padding: '1rem', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}>
            <UserIcon size={20} />
            <span style={{ fontWeight: 500 }}>My Profile</span>
          </Link>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--error)' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem' }}>
        <header className="flex-col gap-4 animate-fade-up" style={{ marginBottom: '3rem' }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="heading-l">Find Your Expert Guide</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
            Browse through our top-rated guides. Filter by project topics to find exactly what you need.
          </p>
          
          <form onSubmit={handleSearch} className="flex-center gap-4 mt-4" style={{ position: 'relative', maxWidth: '500px' }}>
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
            <input 
              type="text" 
              className="input-premium" 
              placeholder="Search by topic (e.g. React, Java)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '3rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Search</button>
          </form>
        </header>

        {isLoading ? (
          <div className="flex-center" style={{ height: '300px' }}>
            <Loader2 size={40} className="spinner" style={{ animation: 'spin 1s linear infinite' }} color="var(--accent-primary)" />
          </div>
        ) : isError ? (
           <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
             Failed to load guides. Please try again.
           </div>
        ) : (
          <div className="delay-200 animate-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {guides && guides.length > 0 ? (
              guides.map((guide) => (
                <div key={guide.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    
                    <div 
                      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, cursor: 'pointer' }}
                      onClick={() => setActiveProfile(guide)}
                    >
                    <div className="flex-between">
                      <div className="flex-center gap-3">
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {guide.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="heading-m" style={{ fontSize: '1.2rem' }}>{guide.name}</h3>
                          <div className="flex-center gap-1 mt-1" style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>
                            <Star size={16} fill="currentColor" />
                            <span>{guide.averageRating?.toFixed(1) || 'NEW'}</span>
                            <span style={{ color: 'var(--text-muted)' }}>({guide.totalReviews || 0} reviews)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', height: '3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {guide.bio || "No bio provided yet."}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
                      {guide.topics?.slice(0, 3).map((topic: string) => (
                        <span key={topic} className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{topic}</span>
                      ))}
                      {guide.topics?.length > 3 && (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>+{guide.topics.length - 3}</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ padding: '1rem 2rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
                    <button 
                      className="btn-primary" 
                      style={{ width: '100%', padding: '0.6rem' }}
                      onClick={() => setSelectedGuide(guide)}
                    >
                      Request Discussion
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <Compass size={64} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
                <h3>No guides found</h3>
                <p>Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedGuide && (
        <BookingModal 
          guide={selectedGuide} 
          onClose={() => setSelectedGuide(null)} 
        />
      )}

      {activeProfile && (
        <GuideProfileModal
          guide={activeProfile}
          onClose={() => setActiveProfile(null)}
          onBook={() => {
            setSelectedGuide(activeProfile);
            setActiveProfile(null);
          }}
        />
      )}
    </div>
  );
}
