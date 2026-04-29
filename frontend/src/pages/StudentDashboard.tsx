import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, Home, User as UserIcon, Loader2, Calendar, BookOpen, CheckCircle2, Clock, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getDashboardData } from '../api/session.api';
import axios from 'axios';

export default function StudentDashboard() {
  const { user, logout, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: getDashboardData
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await axios.post(`/api/sessions/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    onSuccess: () => {
      refetch();
      setSuccessMsg('Confirmation Sent!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  const bookMutation = useMutation({
    mutationFn: async ({ availabilityId, topic }: { availabilityId: number, topic: string }) => {
      const res = await axios.post(`/api/sessions/request/${availabilityId}?topicName=${encodeURIComponent(topic)}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    onSuccess: () => {
      refetch();
      setShowBookingModal(false);
      setSuccessMsg('Booking Request Sent!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to book session');
    }
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [topic, setTopic] = useState('');
  




  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '280px', margin: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '1rem', height: 'calc(100vh - 2rem)' }}>
        <h2 className="heading-m text-gradient">Dashboard</h2>
        
        <nav className="flex-col gap-2">
          <Link to="/dashboard" className="flex-center gap-4" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', justifyContent: 'flex-start' }}>
            <Home size={20} color="var(--accent-primary)" />
            <span style={{ fontWeight: 500 }}>Dashboard</span>
          </Link>
          <Link to="/profile" className="flex-center gap-4" style={{ padding: '1rem', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}>
            <UserIcon size={20} />
            <span style={{ fontWeight: 500 }}>My Profile</span>
          </Link>

          {user?.role === 'GUIDE' && (
            <Link to="/guide/dashboard" className="flex-center gap-4" style={{ padding: '1rem', marginTop: '1rem', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--accent-primary)', border: '1px dashed var(--accent-primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
              <BookOpen size={20} />
              <span style={{ fontWeight: 600 }}>Guide Portal</span>
            </Link>
          )}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--error)' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem' }}>
        <header className="flex-between" style={{ marginBottom: '3rem' }}>
          <div>
            <h1 className="heading-l animate-fade-up">Welcome, {user?.name}</h1>
            <p className="delay-100 animate-fade-up" style={{ color: 'var(--text-secondary)' }}>Manage your project discussions and learning progress.</p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex-center" style={{ height: '300px' }}>
            <Loader2 size={40} className="spinner" style={{ animation: 'spin 1s linear infinite' }} color="var(--accent-primary)" />
          </div>
        ) : isError ? (
           <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
             Failed to load dashboard data. Please try refreshing.
           </div>
        ) : (
          <div className="delay-200 animate-fade-up flex-col gap-8">
            <div className="glass-panel flex-col" style={{ padding: '2rem', minHeight: '400px', gap: '1rem' }}>
              <div className="flex-between">
                <h3 className="heading-m flex-center gap-2" style={{ justifyContent: 'flex-start' }}><Calendar size={20} color="var(--accent-primary)" /> My Active Sessions</h3>
                <span className="badge badge-info">{data?.myRequests?.length || 0}</span>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />

              {!data?.myRequests || data.myRequests.length === 0 ? (
                <div className="flex-col flex-center" style={{ flex: 1, color: 'var(--text-muted)' }}>
                  <Calendar size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
                  <p>No active sessions found.</p>
                </div>
              ) : (
                <div className="grid-responsive gap-6 mt-4">
                  {data.myRequests.map((req: any) => (
                    <div key={req.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)', transition: 'all 0.3s ease' }}>
                      <div className="flex-between">
                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{req.topicName}</span>
                        <div className="flex-col gap-1 items-end">
                          <span className={`badge ${req.status === 'COMPLETED' ? 'badge-completed-shine' : 'badge-' + (
                            req.status === 'ACCEPTED' ? 'accent' : 
                            req.status === 'REJECTED' || req.status === 'CANCELLED' || req.status === 'DISPUTED' ? 'error' : 
                            'info'
                          )}`}>
                             {req.status === 'COMPLETED' && <CheckCircle2 size={12} style={{ marginRight: '4px' }} />}
                            {req.status}
                          </span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{formatDate(req.startTime)}</span>
                        </div>
                      </div>
                      
                      <div className="flex-between mt-4">
                        <div className="flex-col gap-1">
                          <p style={{ fontSize: '0.9rem', color: req.status === 'COMPLETED' ? 'var(--success)' : 'var(--text-secondary)' }}>
                             <span style={{ opacity: 0.6 }}>Guide:</span> <strong>{req.guideName || 'Verified Guide'}</strong>
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                             <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                             {formatDate(req.startTime)} - {new Date(req.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className="badge badge-accent mt-1" style={{ fontSize: '0.65rem', width: 'max-content' }}>15 Min Discussion</div>
                        </div>
                        
                        <div className="flex-center gap-2">
                            {req.status === 'ACCEPTED' && req.meetingLink && (() => {
                               const start = new Date(req.startTime).getTime();
                               const end = new Date(req.endTime).getTime();
                               const nowTime = now.getTime();
                               const fiveMinsMillis = 5 * 60 * 1000;
                               
                               if (nowTime < (start - fiveMinsMillis)) {
                                 const timeStr = new Date(req.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                 return (
                                   <div className="upcoming-badge">
                                     <Clock size={14} /> Room opens at {timeStr}
                                   </div>
                                 );
                               }
 
                               if (nowTime > end) {
                                 return (
                                   <div className="upcoming-badge" style={{ opacity: 0.5 }}>
                                     <Clock size={14} /> Session Ended
                                   </div>
                                 );
                               }
 
                               return (
                                 <a 
                                   href={req.meetingLink} 
                                   target="_blank" 
                                   rel="noreferrer" 
                                   className="btn-join-premium" 
                                 >
                                   Join 15-Min Meeting
                                 </a>
                               );
                            })()}

                           {req.status === 'ACCEPTED' && (
                              <button 
                                className="btn-secondary" 
                                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                onClick={() => completeMutation.mutate(req.id)}
                                disabled={completeMutation.isPending}
                              >
                                Mark Done
                              </button>
                           )}
                           {req.status === 'GUIDE_COMPLETED' && (
                              <button 
                                className="btn-primary" 
                                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', background: 'var(--success)' }}
                                onClick={() => completeMutation.mutate(req.id)}
                                disabled={completeMutation.isPending}
                              >
                                Finalize Session
                              </button>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guide Availability Section */}
            <div className="glass-panel flex-col" style={{ padding: '2rem', gap: '1rem' }}>
              <div className="flex-between">
                <h3 className="heading-m flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                   <Clock size={20} color="var(--accent-primary)" /> 
                   Guide Availability: {data?.assignedGuideName || 'Your Guide'}
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Book a 15-minute project discussion slot with your assigned guide.
              </p>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0.5rem 0' }} />

              {(!data?.assignedGuideAvailability || data.assignedGuideAvailability.length === 0) ? (
                <div className="flex-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                  <p>No available slots found for your guide at the moment.</p>
                </div>
              ) : (
                <div className="grid-responsive gap-4 mt-2">
                  {data.assignedGuideAvailability.map((slot: any) => (
                    <div key={slot.id} className="glass-card flex-between" style={{ padding: '1.2rem', borderRadius: '12px' }}>
                      <div className="flex-col">
                        <span style={{ fontWeight: 600 }}>{formatDate(slot.startTime)}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setShowBookingModal(true);
                        }}
                      >
                        Book Slot
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>





      {/* Success Overlay */}
      {showSuccess && (
        <div className="blur-overlay animate-fade-in" style={{ animationDuration: '0.3s', zIndex: 1000 }}>
          <div className="glass-panel animate-scale-in" style={{ padding: '3rem 5rem', textAlign: 'center', boxShadow: '0 0 50px rgba(34, 197, 94, 0.4)', borderColor: 'var(--success)' }}>
            <div className="flex-center" style={{ width: '80px', height: '80px', background: 'var(--success)', borderRadius: '50%', margin: '0 auto 1.5rem', color: 'white' }}>
              <Check size={48} strokeWidth={3} />
            </div>
            <h2 className="heading-l" style={{ color: 'white', marginBottom: '0.5rem' }}>Done!</h2>
            <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.1rem' }}>{successMsg}</p>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="blur-overlay animate-fade-in" style={{ zIndex: 900 }}>
          <div className="glass-panel animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
            <h2 className="heading-m mb-2">Book Discussion Slot</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Confirm your project discussion for <strong>{formatDate(selectedSlot?.startTime)}</strong>
            </p>

            <div className="flex-col gap-4">
              <div className="flex-col gap-2">
                <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Discussion Topic</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. AI Model Integration, UI Design Review..." 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="flex-center gap-4 mt-4">
                <button 
                  className="btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setShowBookingModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1 }}
                  disabled={!topic || bookMutation.isPending}
                  onClick={() => bookMutation.mutate({ availabilityId: selectedSlot.id, topic })}
                >
                  {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
