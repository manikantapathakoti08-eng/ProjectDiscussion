import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, Home, Compass, User as UserIcon, Loader2, Calendar, BookOpen, GraduationCap, X, Send, Link as LinkIcon, CheckCircle2, Upload, FileText, ClipboardList, Sparkles, AlertTriangle, ShieldAlert, Check, Star, Clock, BadgeCheck, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getDashboardData, submitReview } from '../api/session.api';
import axios from 'axios';

export default function StudentDashboard() {
  const { user, logout, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'upload'>('link');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    certificateUrl: '',
    proposedBio: '',
    proposedTopics: ''
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: getDashboardData
  });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusType, setStatusType] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    if (data?.guideStatusChange) {
      setStatusType(data.guideStatusChange);
      setStatusNotes(data.guideStatusNotes || '');
      setShowStatusModal(true);
    }
  }, [data]);

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

  const [showDisputeModal, setShowDisputeModal] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [activeHeartbeatId, setActiveHeartbeatId] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showReviewModal, setShowReviewModal] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const reviewMutation = useMutation({
    mutationFn: ({ id, rating, comment }: { id: number, rating: number, comment: string }) => 
      submitReview(id, rating, comment),
    onSuccess: () => {
      refetch();
      setShowReviewModal(null);
      setReviewRating(5);
      setReviewComment('');
      setSuccessMsg('Feedback Submitted!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  useEffect(() => {
    let interval: any;
    if (activeHeartbeatId) {
      interval = setInterval(() => {
        axios.post(`/api/sessions/${activeHeartbeatId}/heartbeat`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).catch(() => {});
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [activeHeartbeatId, accessToken]);

  const disputeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
      const res = await axios.post(`/api/sessions/${id}/dispute?reason=${encodeURIComponent(reason)}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    onSuccess: () => {
      refetch();
      setShowDisputeModal(null);
      setDisputeReason('');
      setSuccessMsg('Dispute Raised! Admin Review Pending.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.response?.data || error.message;
      alert(`Failed to raise dispute: ${msg}`);
    }
  });

  const joinMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.post(`/api/sessions/${id}/join`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return id;
    },
    onSuccess: (id) => {
      refetch();
      setActiveHeartbeatId(id);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/guide/upload', formData, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post('/api/guide/apply', payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    onSuccess: () => {
      setApplySuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess(false);
        setFormData({ certificateUrl: '', proposedBio: '', proposedTopics: '' });
        setFile(null);
      }, 3000);
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData({ ...formData, certificateUrl: text });
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalUrl = formData.certificateUrl;

    if (activeTab === 'upload' && file) {
      setUploading(true);
      try {
        finalUrl = await uploadMutation.mutateAsync(file);
      } catch (err) {
        alert('File upload failed. Please try again.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (!finalUrl) {
      alert('Please provide a proof link or upload a document.');
      return;
    }

    applyMutation.mutate({
      ...formData,
      certificateUrl: finalUrl,
      proposedTopics: formData.proposedTopics.split(',').map(s => s.trim())
    });
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
          <Link to="/guides" className="flex-center gap-4" style={{ padding: '1rem', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}>
            <Compass size={20} />
            <span style={{ fontWeight: 500 }}>Explore Guides</span>
          </Link>
          <Link to="/profile" className="flex-center gap-4" style={{ padding: '1rem', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}>
            <UserIcon size={20} />
            <span style={{ fontWeight: 500 }}>My Profile</span>
          </Link>

          {user?.role === 'STUDENT' && (
            <button 
              onClick={() => setShowApplyModal(true)}
              className="flex-center gap-4" 
              style={{ width: '100%', padding: '1rem', marginTop: '1rem', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--accent-secondary)', border: '1px dashed var(--accent-secondary)', background: 'rgba(16, 185, 129, 0.05)', cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              <GraduationCap size={20} />
              <span style={{ fontWeight: 600 }}>Become a Guide</span>
            </button>
          )}

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
                  <Link to="/guides" style={{ marginTop: '1.2rem' }} className="btn-primary">Explore Guides</Link>
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
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                             <span style={{ opacity: 0.6 }}>Duration:</span> {req.durationHours}h discussion
                          </p>
                        </div>
                        
                        <div className="flex-center gap-2">
                            {req.status === 'ACCEPTED' && req.meetingLink && (() => {
                               const start = new Date(req.startTime).getTime();
                               const end = start + (req.durationHours * 60 * 60 * 1000);
                               const nowTime = now.getTime();
                               const fiveMinsMillis = 5 * 60 * 1000;
                               
                               if (nowTime < (start - fiveMinsMillis)) {
                                 const timeStr = new Date(req.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
                                 return (
                                   <div className="upcoming-badge">
                                     <Clock size={14} /> Starts {timeStr}
                                   </div>
                                 );
                               }

                               if (nowTime > end) {
                                 return (
                                   <div className="upcoming-badge" style={{ opacity: 0.5 }}>
                                     <Clock size={14} /> Ended
                                   </div>
                                 );
                               }

                               return (
                                 <a 
                                   href={req.meetingLink} 
                                   target="_blank" 
                                   rel="noreferrer" 
                                   className="btn-join-premium" 
                                   onClick={() => joinMutation.mutate(req.id)}
                                 >
                                   <Sparkles size={16} /> Join Discussion
                                 </a>
                               );
                            })()}
                           
                           {req.status === 'ACCEPTED' && (() => {
                              const start = new Date(req.startTime).getTime();
                              const now = new Date().getTime();
                              const tenMinsLate = start + (10 * 60 * 1000);
                              
                              if (now > tenMinsLate && !req.guideJoinedAt) {
                                return (
                                  <button 
                                    className="btn-secondary" 
                                    style={{ 
                                      fontSize: '0.8rem', 
                                      padding: '0.5rem 1rem',
                                      color: 'var(--error)',
                                      borderColor: 'rgba(239, 68, 68, 0.2)'
                                    }}
                                    onClick={() => setShowDisputeModal(req.id)}
                                  >
                                    <AlertTriangle size={14} /> Report No-Show
                                  </button>
                                );
                              }
                              return null;
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
                           {req.status === 'COMPLETED' && !req.isReviewed && (
                              <button 
                                className="btn-primary" 
                                style={{ fontSize: '0.8rem', padding: '0.5rem 1.1rem', background: 'var(--success)' }}
                                onClick={() => setShowReviewModal(req.id)}
                              >
                                <Star size={14} fill="currentColor" /> Rate Guide
                              </button>
                           )}
                           {req.status === 'COMPLETED' && req.isReviewed && (
                              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Reviewed ✓</span>
                           )}
                           {req.status === 'STUDENT_COMPLETED' && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting Guide...</span>
                           )}
                           {req.status === 'DISPUTED' && (
                                <div className="flex-center gap-2" style={{ 
                                  color: 'var(--error)', 
                                  padding: '0.4rem 0.8rem', 
                                  background: 'rgba(239, 68, 68, 0.1)', 
                                  borderRadius: '20px',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  animation: 'pulse-soft 2s infinite'
                                }}>
                                   <ShieldAlert size={14} />
                                   <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>UNDER REVIEW</span>
                                </div>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Become a Guide Modal */}
      {showApplyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel animate-scale-in" style={{ width: '100%', maxWidth: '600px', padding: '0', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 0 50px rgba(16, 185, 129, 0.15)' }}>
            
            <div style={{ height: '4px', background: 'linear-gradient(90deg, transparent, var(--accent-secondary), var(--success), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite linear' }} />
            
            <div style={{ padding: '2.5rem' }}>
              <button 
                onClick={() => setShowApplyModal(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '50%', padding: '0.5rem', display: 'flex' }}
              >
                <X size={20} />
              </button>

              {applySuccess ? (
                <div className="flex-col flex-center gap-6 text-center py-12 animate-fade-in">
                  <div className="relative flex-center" style={{ width: '120px', height: '120px' }}>
                    <div className="pulse-success" style={{ position: 'absolute', inset: 0, background: 'var(--success)', borderRadius: '50%', opacity: 0.05 }} />
                    <div className="glass-panel flex-center animate-scale-in" style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
                      <BadgeCheck size={48} color="var(--success)" strokeWidth={2.5} />
                    </div>
                  </div>
                  
                  <div className="flex-col gap-2">
                    <h2 className="heading-l" style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, #10B981, #34D399, #6EE7B7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 auto' }}>
                      Application Sent!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '350px', margin: '0 auto' }}>
                      Admin will review your credentials shortly.
                    </p>
                  </div>

                  <div className="glass-card mt-4" style={{ padding: '1rem 2rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div className="flex-center gap-4 text-left">
                       <Clock size={24} color="var(--accent-secondary)" className="animate-pulse" />
                       <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Status: <span style={{ color: 'var(--accent-secondary)' }}>Review Pending</span></p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Response within 24 hours</p>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="flex-col gap-8">
                  <div className="flex-col gap-2">
                    <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                      <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
                        <Sparkles size={24} color="var(--accent-secondary)" />
                      </div>
                      <h2 className="heading-m">Apply to be a Guide</h2>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>Help others succeed with your project expertise.</p>
                  </div>

                  <div className="flex-col gap-6">
                    <div className="flex-col gap-3">
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verification Proof</label>
                      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '3px' }}>
                        <button type="button" onClick={() => setActiveTab('link')} style={{ flex: 1, padding: '0.6rem', border: 'none', background: activeTab === 'link' ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: '8px', color: activeTab === 'link' ? 'white' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <LinkIcon size={16} /> Link
                        </button>
                        <button type="button" onClick={() => setActiveTab('upload')} style={{ flex: 1, padding: '0.6rem', border: 'none', background: activeTab === 'upload' ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: '8px', color: activeTab === 'upload' ? 'white' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <Upload size={16} /> Upload
                        </button>
                      </div>

                      {activeTab === 'link' ? (
                        <div style={{ position: 'relative' }} className="animate-fade-up">
                          <input 
                            type="url"
                            placeholder="Portfolio, LinkedIn, or Document link"
                            className="input-premium"
                            style={{ paddingRight: '6.5rem' }}
                            value={formData.certificateUrl}
                            onChange={e => setFormData({...formData, certificateUrl: e.target.value})}
                          />
                          <button 
                            type="button" 
                            onClick={handlePaste}
                            className="flex-center gap-1"
                            style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                          >
                            <ClipboardList size={14} /> Paste
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="animate-fade-up flex-col flex-center gap-3" 
                          style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', cursor: 'pointer', background: file ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.2)', transition: 'all 0.3s ease' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                          {file ? (
                            <div className="flex-center gap-3" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.7rem 1.2rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              <FileText size={20} color="var(--success)" />
                              <span style={{ fontSize: '0.9rem', color: 'white' }}>{file.name}</span>
                              <X size={14} style={{ marginLeft: '1rem', opacity: 0.5 }} onClick={(e) => { e.stopPropagation(); setFile(null); }} />
                            </div>
                          ) : (
                            <>
                              <Upload size={32} opacity={0.3} />
                              <div className="flex-col flex-center text-center">
                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Upload credentials</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF/Doc up to 5MB</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-col gap-2">
                       <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project Topics</label>
                       <input 
                         required
                         placeholder="React, Java, Design (comma separated)"
                         className="input-premium"
                         value={formData.proposedTopics}
                         onChange={e => setFormData({...formData, proposedTopics: e.target.value})}
                       />
                    </div>

                    <div className="flex-col gap-2">
                       <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Guide Bio</label>
                       <textarea 
                         required
                         placeholder="Tell us about your experience..."
                         className="input-premium"
                         style={{ minHeight: '100px', resize: 'none' }}
                         value={formData.proposedBio}
                         onChange={e => setFormData({...formData, proposedBio: e.target.value})}
                       />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={applyMutation.isPending || uploading}
                    className="btn-primary" 
                    style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #10B981, #059669)', fontSize: '1rem' }}
                  >
                    {applyMutation.isPending || uploading ? <Loader2 className="spinner" /> : <><Send size={18} /> Submit Application</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="flex-center" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '1rem' }}>
          <div className="glass-panel animate-fade-up" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
             <div className="flex-center" style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', marginBottom: '1.5rem' }}>
                <ShieldAlert size={28} />
             </div>
             
             <h3 className="heading-m">Report Issue</h3>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Please provide details about the session issue.
             </p>

             <textarea 
                className="input-premium" 
                style={{ minHeight: '120px', padding: '1rem', fontSize: '0.95rem', marginBottom: '1.5rem' }}
                placeholder="Describe the problem..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
             />

             <div className="flex-center gap-4" style={{ justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setShowDisputeModal(null)}>Cancel</button>
                <button className="btn-primary" style={{ background: 'var(--error)' }} onClick={() => disputeMutation.mutate({ id: showDisputeModal, reason: disputeReason })}>
                   Raise Dispute
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="blur-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="glass-panel animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
             <div className="flex-between">
                <h3 className="heading-m">Rate Discussion</h3>
                <button onClick={() => setShowReviewModal(null)} className="flex-center" style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                  <X size={24} />
                </button>
             </div>
             
             <div className="flex-col gap-4 mt-6">
                <div style={{ textAlign: 'center' }}>
                  <div className="flex-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReviewRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Star size={32} fill={star <= reviewRating ? 'var(--warning)' : 'none'} color={star <= reviewRating ? 'var(--warning)' : 'var(--text-muted)'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-col gap-2">
                  <textarea className="input-premium" style={{ minHeight: '120px', resize: 'none' }} placeholder="Your feedback..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                </div>

                <button className="btn-primary" onClick={() => reviewMutation.mutate({ id: showReviewModal, rating: reviewRating, comment: reviewComment })} disabled={!reviewComment.trim()}>
                   Submit
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {showSuccess && (
        <div className="blur-overlay animate-fade-in" style={{ animationDuration: '0.3s' }}>
          <div className="glass-panel animate-scale-in" style={{ padding: '3rem 5rem', textAlign: 'center', boxShadow: '0 0 50px rgba(34, 197, 94, 0.4)', borderColor: 'var(--success)' }}>
            <div className="flex-center" style={{ width: '80px', height: '80px', background: 'var(--success)', borderRadius: '50%', margin: '0 auto 1.5rem', color: 'white' }}>
              <Check size={48} strokeWidth={3} />
            </div>
            <h2 className="heading-l" style={{ color: 'white', marginBottom: '0.5rem' }}>Done!</h2>
            <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.1rem' }}>{successMsg}</p>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="blur-overlay animate-fade-in" style={{ background: 'rgba(2, 6, 23, 0.9)', zIndex: 2000 }}>
          <div className="glass-panel animate-scale-in" style={{ padding: '4rem', textAlign: 'center', maxWidth: '550px', boxShadow: statusType === 'APPROVED' ? '0 0 60px rgba(16, 185, 129, 0.3)' : '0 0 60px rgba(239, 68, 68, 0.3)', borderColor: statusType === 'APPROVED' ? 'var(--success)' : 'var(--error)' }}>
            <div className={`flex-center ${statusType === 'APPROVED' ? 'pulse-success' : 'pulse-error'}`} style={{ width: '100px', height: '100px', background: statusType === 'APPROVED' ? 'var(--success)' : 'var(--error)', borderRadius: '50%', margin: '0 auto 2rem', color: 'white' }}>
              {statusType === 'APPROVED' ? <BadgeCheck size={60} strokeWidth={2.5} /> : <XCircle size={60} strokeWidth={2.5} />}
            </div>

            <h2 className="heading-l" style={{ color: 'white', marginBottom: '1rem' }}>
              {statusType === 'APPROVED' ? 'Guide Status Approved!' : 'Application Update'}
            </h2>
            
            <p style={{ color: statusType === 'APPROVED' ? 'var(--success)' : 'var(--error)', fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.5rem' }}>
              {statusType === 'APPROVED' ? 'Welcome to the Team!' : 'Review Feedback'}
            </p>

            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', marginBottom: '2rem' }}>
               <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                 {statusType === 'APPROVED' ? 'Your guide credentials have been verified. You can now start hosting project discussions!' : statusNotes || 'Your application was not approved at this time.'}
               </p>
            </div>

            <button className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', background: statusType === 'APPROVED' ? 'var(--success)' : 'var(--error)' }} onClick={() => setShowStatusModal(false)}>
              {statusType === 'APPROVED' ? 'Go to Guide Portal' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
