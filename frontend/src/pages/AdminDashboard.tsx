import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingGuideRequests, approveGuideRequest, rejectGuideRequest, getAllSessions, getAllUsers, resolveDispute, getDisputedSessions, getPendingTopicRequests, approveTopicRequest, rejectTopicRequest } from '../api/admin.api';
import { LogOut, ShieldAlert, Users, ListFilter, Check, Loader2, FileText, XCircle, MessageSquare, AlertTriangle, Clock as ClockIcon, BadgeCheck, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'requests' | 'sessions' | 'users' | 'disputes' | 'topics'>('requests');
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isRejection, setIsRejection] = useState(false);

  const formatUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) return url;
    return `https://${url}`;
  };

  const isLocalUpload = (url: string) => url?.startsWith('/uploads');

  const { data: guideReqs, isLoading: reqLoading } = useQuery({
    queryKey: ['adminRequests'],
    queryFn: getPendingGuideRequests,
    refetchInterval: 15000,
  });

  const { data: sessions, isLoading: sessLoading } = useQuery({
    queryKey: ['adminSessions'],
    queryFn: () => getAllSessions(0, 50),
  });

  const { data: disputedSessions, isLoading: disputesLoading } = useQuery({
    queryKey: ['adminDisputes'],
    queryFn: getDisputedSessions,
    refetchInterval: 10000, 
  });
  
  const disputeCount = disputedSessions?.length || 0;
  
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => getAllUsers(0, 50),
  });

  const { data: topicRequests, isLoading: topicLoading } = useQuery({
    queryKey: ['adminTopicRequests'],
    queryFn: getPendingTopicRequests,
    refetchInterval: 15000,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ sessionId, faultIsGuide, notes }: { sessionId: number, faultIsGuide: boolean, notes: string }) => 
      resolveDispute(sessionId, faultIsGuide, notes || 'Resolved by Admin'),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminSessions'] });
      queryClient.invalidateQueries({ queryKey: ['adminDisputes'] });
      setIsRejection(!variables.faultIsGuide);
      setSuccessMsg(variables.faultIsGuide ? 'Dispute Resolved (Fault at Guide)' : 'Dispute Closed (Fault at Student)');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  const appMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number, notes: string }) => approveGuideRequest(id, notes || 'Approved by Admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRequests'] });
      setIsRejection(false);
      setSuccessMsg('Guide Promoted Successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number, notes: string }) => rejectGuideRequest(id, notes || 'Rejected by Admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRequests'] });
      setIsRejection(true);
      setSuccessMsg('Guide Application Rejected.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  const appTopicMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number, notes: string }) => approveTopicRequest(id, notes || 'Approved'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTopicRequests'] });
      setIsRejection(false);
      setSuccessMsg('Topic Approved');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  const rejTopicMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number, notes: string }) => rejectTopicRequest(id, notes || 'Rejected'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTopicRequests'] });
      setIsRejection(true);
      setSuccessMsg('Topic Rejected');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '280px', margin: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '1rem', height: 'calc(100vh - 2rem)' }}>
        <h2 className="heading-m text-gradient" style={{ color: 'var(--error)' }}>Admin Control</h2>
        
        <nav className="flex-col gap-2">
          <button onClick={() => setActiveTab('requests')} className="flex-center gap-4" style={{ padding: '1rem', background: activeTab === 'requests' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', borderRadius: '12px', justifyContent: 'flex-start', border: activeTab === 'requests' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none', color: activeTab === 'requests' ? 'var(--error)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
             <ShieldAlert size={20} />
             <span style={{ fontWeight: 500 }}>Guide Applications</span>
          </button>
          <button onClick={() => setActiveTab('topics')} className="flex-center gap-4" style={{ padding: '1rem', background: activeTab === 'topics' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', borderRadius: '12px', justifyContent: 'flex-start', border: activeTab === 'topics' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none', color: activeTab === 'topics' ? 'var(--error)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', width: '100%', position: 'relative' }}>
             <BadgeCheck size={20} />
             <span style={{ fontWeight: 500 }}>Topic Requests</span>
             {topicRequests && topicRequests.length > 0 && (
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'var(--accent-primary)', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                   {topicRequests.length}
                </span>
             )}
          </button>
          <button onClick={() => setActiveTab('sessions')} className="flex-center gap-4" style={{ padding: '1rem', background: activeTab === 'sessions' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', borderRadius: '12px', justifyContent: 'flex-start', border: activeTab === 'sessions' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none', color: activeTab === 'sessions' ? 'var(--error)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
             <ListFilter size={20} />
             <span style={{ fontWeight: 500 }}>Live Discussions</span>
          </button>
          <button onClick={() => setActiveTab('users')} className="flex-center gap-4" style={{ padding: '1rem', background: activeTab === 'users' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', borderRadius: '12px', justifyContent: 'flex-start', border: activeTab === 'users' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none', color: activeTab === 'users' ? 'var(--error)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
             <Users size={20} />
             <span style={{ fontWeight: 500 }}>Manage Users</span>
          </button>
          <button onClick={() => setActiveTab('disputes')} className="flex-center gap-4" style={{ padding: '1rem', background: activeTab === 'disputes' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', borderRadius: '12px', justifyContent: 'flex-start', border: activeTab === 'disputes' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none', color: activeTab === 'disputes' ? 'var(--error)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', width: '100%', position: 'relative' }}>
             <AlertTriangle size={20} />
             <span style={{ fontWeight: 500 }}>Disputes</span>
             {disputeCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'var(--error)', 
                  color: 'white', 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontWeight: 700,
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                }}>
                   {disputeCount}
                </span>
             )}
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem' }}>
        <header className="flex-between" style={{ marginBottom: '3rem' }}>
          <div>
            <h1 className="heading-l animate-fade-up">System Monitoring</h1>
            <p className="delay-100 animate-fade-up" style={{ color: 'var(--text-secondary)' }}>Overview of all project discussions, guides, and student activity.</p>
          </div>
        </header>

        <div className="delay-200 animate-fade-up glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
             
             {/* Disputes Tab */}
             {activeTab === 'disputes' && (
                <div className="flex-col gap-6">
                  <h3 className="heading-m flex-between"><span>Active Disputes</span> <span className="badge badge-error">{disputeCount}</span></h3>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
                  
                  {disputesLoading ? <div className="flex-center"><Loader2 className="spinner" /></div> :
                   !disputedSessions || disputedSessions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No active disputes found.</p> :
                    disputedSessions.map((sess: any) => {
                      const guideDuration = sess.guideLastHeartbeatAt && sess.guideJoinedAt 
                        ? Math.round((new Date(sess.guideLastHeartbeatAt).getTime() - new Date(sess.guideJoinedAt).getTime()) / 60000)
                        : 0;
                      const studentDuration = sess.studentLastHeartbeatAt && sess.studentJoinedAt 
                        ? Math.round((new Date(sess.studentLastHeartbeatAt).getTime() - new Date(sess.studentJoinedAt).getTime()) / 60000)
                        : 0;

                      return (
                        <div key={sess.id} className="flex-col gap-4" style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                           <div className="flex-between">
                               <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>#{sess.id}: {sess.topicName}</h4>
                               <span className="badge badge-error">REPORTED</span>
                           </div>

                           <div className="flex-col gap-2" style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                              <p style={{ fontSize: '0.8rem', color: 'var(--error)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Description:</p>
                              <p style={{ fontSize: '1rem', color: 'white', fontStyle: 'italic' }}>
                                 "{sess.disputeReason || 'No details provided.'}"
                              </p>
                           </div>

                           <div className="flex-col gap-3" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}><ClockIcon size={14} style={{ marginRight: '8px' }} /> Scheduled: {format(new Date(sess.startTime), 'MMM d, h:mm a')}</p>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '0.5rem' }}>
                                 <div className="flex-col gap-1">
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student: <strong>{sess.studentName}</strong></p>
                                    <p style={{ color: sess.studentJoinedAt ? 'var(--success)' : 'var(--error)', fontSize: '0.9rem' }}>
                                       Presence: {sess.studentJoinedAt ? `${studentDuration} mins` : 'Did not join'}
                                    </p>
                                 </div>
                                 <div className="flex-col gap-1">
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Guide: <strong>{sess.guideName}</strong></p>
                                    <p style={{ color: sess.guideJoinedAt ? 'var(--success)' : 'var(--error)', fontSize: '0.9rem' }}>
                                       Presence: {sess.guideJoinedAt ? `${guideDuration} mins` : 'Did not join'}
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <div className="flex-col gap-2">
                              <textarea 
                                className="glass-input" 
                                style={{ minHeight: '60px', padding: '0.8rem', fontSize: '0.9rem' }}
                                placeholder="Resolution summary..."
                                value={adminNotes[sess.id] || ''}
                                onChange={(e) => setAdminNotes({ ...adminNotes, [sess.id]: e.target.value })}
                              />
                           </div>

                           <div className="flex-center gap-4" style={{ justifyContent: 'flex-end' }}>
                              <button 
                                 className="btn-secondary" 
                                 onClick={() => resolveMutation.mutate({ sessionId: sess.id, faultIsGuide: false, notes: adminNotes[sess.id] })}
                                 disabled={resolveMutation.isPending}
                              >
                                 Fault: Student
                              </button>
                              <button 
                                 className="btn-primary" 
                                 style={{ background: 'var(--success)' }}
                                 onClick={() => resolveMutation.mutate({ sessionId: sess.id, faultIsGuide: true, notes: adminNotes[sess.id] })}
                                 disabled={resolveMutation.isPending}
                              >
                                 <Check size={16} /> Fault: Guide
                              </button>
                           </div>
                        </div>
                      );
                    })
                   }
                </div>
             )}

             {/* Pending Requests Tab */}
             {activeTab === 'requests' && (
                <div className="flex-col gap-6">
                  <h3 className="heading-m flex-between"><span>Pending Guide Applications</span> <span className="badge badge-warning">{guideReqs?.length || 0}</span></h3>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
                  
                  {reqLoading ? <div className="flex-center"><Loader2 className="spinner" /></div> :
                   !guideReqs || guideReqs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No applications to review.</p> :
                   guideReqs.map((req: any) => (
                     <div key={req.id} className="flex-col gap-4" style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div className="flex-between">
                            <div>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{req.userName || `User ID: ${req.userId}`}</h4>
                                <div className="flex-center gap-2 mt-1" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <span style={{ opacity: 0.6 }}>Expertise:</span> 
                                    {req.proposedTopics?.map((s: string) => <span key={s} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{s}</span>)}
                                </div>
                            </div>
                             <a 
                                href={formatUrl(req.certificateUrl)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn-secondary flex-center gap-2" 
                                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                             >
                                {isLocalUpload(req.certificateUrl) ? <FileText size={14} /> : <Globe size={14} />}
                                <span>Verify Proof</span>
                             </a>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                            {req.proposedBio}
                        </p>

                        <div className="flex-col gap-2 mt-2">
                           <textarea 
                             className="glass-input" 
                             style={{ minHeight: '60px', padding: '0.8rem', fontSize: '0.9rem' }}
                             placeholder="Admin feedback..."
                             value={adminNotes[req.id] || ''}
                             onChange={(e) => setAdminNotes({ ...adminNotes, [req.id]: e.target.value })}
                           />
                        </div>

                        <div className="flex-center gap-4 mt-2" style={{ justifyContent: 'flex-end' }}>
                           <button 
                              className="btn-secondary" 
                              style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              onClick={() => rejectMutation.mutate({ id: req.id, notes: adminNotes[req.id] })}
                              disabled={rejectMutation.isPending || appMutation.isPending}
                           >
                              Decline
                           </button>
                           <button 
                              className="btn-primary" 
                              onClick={() => appMutation.mutate({ id: req.id, notes: adminNotes[req.id] })}
                              disabled={appMutation.isPending || rejectMutation.isPending}
                           >
                              <Check size={16} /> Promote to Guide
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             )}

             {/* Topic Requests Tab */}
             {activeTab === 'topics' && (
                <div className="flex-col gap-6">
                  <h3 className="heading-m flex-between"><span>Topic Verification</span> <span className="badge badge-accent">{topicRequests?.length || 0}</span></h3>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
                  
                  {topicLoading ? <div className="flex-center"><Loader2 className="spinner" /></div> :
                   !topicRequests || topicRequests.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No pending topics.</p> :
                   topicRequests.map((req: any) => (
                      <div key={req.id} className="flex-col gap-4" style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                         <div className="flex-between">
                            <div>
                               <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Guide: {req.user?.name || `ID: ${req.user?.id}`}</h4>
                               <p className="mt-1" style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.1rem' }}>Requested Topic: {req.topicName}</p>
                            </div>
                             <a 
                                href={formatUrl(req.certificateUrl)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn-secondary flex-center gap-2" 
                                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                             >
                                {isLocalUpload(req.certificateUrl) ? <FileText size={14} /> : <Globe size={14} />}
                                <span>Verify Expertise</span>
                             </a>
                         </div>

                         <div className="flex-col gap-2 mt-2">
                            <textarea 
                              className="glass-input" 
                              style={{ minHeight: '60px', padding: '0.8rem', fontSize: '0.9rem' }}
                              placeholder="Notes..."
                              value={adminNotes[req.id] || ''}
                              onChange={(e) => setAdminNotes({ ...adminNotes, [req.id]: e.target.value })}
                            />
                         </div>

                         <div className="flex-center gap-4 mt-2" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => rejTopicMutation.mutate({ id: req.id, notes: adminNotes[req.id] })} disabled={rejTopicMutation.isPending || appTopicMutation.isPending}>
                               Reject
                            </button>
                            <button className="btn-primary" onClick={() => appTopicMutation.mutate({ id: req.id, notes: adminNotes[req.id] })} disabled={appTopicMutation.isPending || rejTopicMutation.isPending}>
                               <Check size={16} /> Approve Topic
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}
             {activeTab === 'sessions' && (
                <div className="flex-col gap-4">
                  <h3 className="heading-m flex-between"><span>All Project Discussions</span> <span className="badge badge-info">{sessions?.length || 0}</span></h3>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
                  
                  {sessLoading ? <div className="flex-center"><Loader2 className="spinner" /></div> :
                   !sessions || sessions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No activity found.</p> :
                   <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                     <thead>
                       <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                          <th style={{ padding: '1rem 0' }}>Ref</th>
                          <th>Topic</th>
                          <th>Student</th>
                          <th>Guide</th>
                          <th>Presence (S/G)</th>
                          <th>Status</th>
                       </tr>
                     </thead>
                     <tbody>
                       {sessions.map((sess: any) => (
                         <tr key={sess.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                           <td style={{ padding: '1rem 0' }}>#{sess.id}</td>
                           <td>{sess.topicName}</td>
                           <td>{sess.studentName}</td>
                           <td>{sess.guideName}</td>
                           <td>
                              <span style={{ color: sess.studentJoinedAt ? 'var(--success)' : 'inherit' }}>{sess.studentJoinedAt ? '✓' : '✗'}</span> / 
                              <span style={{ color: sess.guideJoinedAt ? 'var(--success)' : 'inherit' }}> {sess.guideJoinedAt ? '✓' : '✗'}</span>
                           </td>
                           <td><span className={`badge badge-${sess.status === 'DISPUTED' ? 'error' : sess.status === 'COMPLETED' ? 'success' : 'info'}`}>{sess.status}</span></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                  }
                </div>
             )}

             {/* Users Tab */}
             {activeTab === 'users' && (
                <div className="flex-col gap-4">
                  <h3 className="heading-m flex-between"><span>Verified Users</span> <span className="badge badge-success">{users?.length || 0}</span></h3>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
                  
                  {usersLoading ? <div className="flex-center"><Loader2 className="spinner" /></div> :
                   !users || users.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No users registered.</p> :
                   <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                     <thead>
                       <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                          <th style={{ padding: '1rem 0' }}>ID</th>
                          <th>Full Name</th>
                          <th>Email Address</th>
                          <th>Assigned Role</th>
                       </tr>
                     </thead>
                     <tbody>
                       {users.map((u: any) => (
                         <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                           <td style={{ padding: '1rem 0' }}>#{u.id}</td>
                           <td>{u.name}</td>
                           <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                           <td><span className="badge" style={{ background: u.role === 'ADMIN' ? 'var(--error)' : u.role === 'GUIDE' ? 'var(--accent-primary)' : 'var(--bg-card)' }}>{u.role}</span></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                  }
                </div>
             )}

          </div>
       </main>

       {/* Success Overlay */}
       {showSuccess && (
        <div className="blur-overlay animate-fade-in" style={{ animationDuration: '0.3s' }}>
          <div className="glass-panel animate-scale-in" style={{ padding: '3rem 5rem', textAlign: 'center', boxShadow: isRejection ? '0 0 50px rgba(239, 68, 68, 0.4)' : '0 0 50px rgba(34, 197, 94, 0.4)', borderColor: isRejection ? 'var(--error)' : 'var(--success)' }}>
            <div className={`flex-center ${isRejection ? 'pulse-error' : 'pulse-success'}`} style={{ width: '80px', height: '80px', background: isRejection ? 'var(--error)' : 'var(--success)', borderRadius: '50%', margin: '0 auto 1.5rem', color: 'white' }}>
              {isRejection ? <XCircle size={48} strokeWidth={3} /> : <Check size={48} strokeWidth={3} />}
            </div>
            <h2 className="heading-l" style={{ color: 'white', marginBottom: '0.5rem' }}>Updated!</h2>
            <p style={{ color: isRejection ? 'var(--error)' : 'var(--success)', fontWeight: 600, fontSize: '1.1rem' }}>{successMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
