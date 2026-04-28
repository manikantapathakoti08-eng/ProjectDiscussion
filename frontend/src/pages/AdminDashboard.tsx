import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllSessions, getAllUsers, resolveDispute, getDisputedSessions, getPendingTopicRequests, approveTopicRequest, rejectTopicRequest, onboardUser } from '../api/admin.api';
import { LogOut, Users, ListFilter, Check, Loader2, FileText, XCircle, AlertTriangle, Clock as ClockIcon, BadgeCheck, Globe, Filter, UserPlus, Phone, Mail as MailIcon, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'sessions' | 'users' | 'disputes' | 'topics' | 'onboarding'>('users');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'GUIDE' | 'ADMIN'>('ALL');
  
  // Onboarding Form State
  const [onboardingRole, setOnboardingRole] = useState<'STUDENT' | 'GUIDE' | 'ADMIN'>('STUDENT');
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    phoneNumber: '',
    assignedGuideRegistrationNumber: ''
  });

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

  const onboardMutation = useMutation({
    mutationFn: (data: any) => onboardUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsRejection(false);
      setSuccessMsg('User Onboarded Successfully!');
      setShowSuccess(true);
      setOnboardForm({
        name: '',
        email: '',
        registrationNumber: '',
        phoneNumber: '',
        assignedGuideRegistrationNumber: ''
      });
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Onboarding failed');
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
          <button onClick={() => setActiveTab('users')} className="flex-center gap-4" style={{ padding: '1rem', background: activeTab === 'users' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', borderRadius: '12px', justifyContent: 'flex-start', border: activeTab === 'users' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none', color: activeTab === 'users' ? 'var(--error)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
             <Users size={20} />
             <span style={{ fontWeight: 500 }}>Manage Users</span>
          </button>
          <button onClick={() => setActiveTab('onboarding')} className="flex-center gap-4" style={{ padding: '1rem', background: activeTab === 'onboarding' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', borderRadius: '12px', justifyContent: 'flex-start', border: activeTab === 'onboarding' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none', color: activeTab === 'onboarding' ? 'var(--error)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
             <UserPlus size={20} />
             <span style={{ fontWeight: 500 }}>User Onboarding</span>
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
                   <div style={{ overflowX: 'auto' }}>
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
                   </div>
                  }
                </div>
             )}

              {/* User Onboarding Tab */}
              {activeTab === 'onboarding' && (
                <div className="flex-col gap-6 max-w-2xl mx-auto">
                  <div className="flex-between">
                    <h3 className="heading-m flex-center gap-3"><UserPlus size={24} color="var(--accent-primary)" /> <span>Onboard New User</span></h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create a new account for an Admin, Faculty, or Student. A temporary password will be emailed to them automatically.</p>
                  
                  <div className="glass-panel flex-col gap-5 animate-fade-in" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
                     
                     {/* Role Selection Tabs */}
                     <div className="flex-center gap-4" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '16px', marginBottom: '1rem', border: '1px solid var(--glass-border)' }}>
                       {(['STUDENT', 'GUIDE', 'ADMIN'] as const).map(role => (
                         <button
                           key={role}
                           type="button"
                           onClick={() => setOnboardingRole(role)}
                           style={{
                             flex: 1,
                             padding: '0.8rem',
                             borderRadius: '12px',
                             border: 'none',
                             background: onboardingRole === role ? 'var(--accent-primary)' : 'transparent',
                             color: onboardingRole === role ? 'white' : 'var(--text-muted)',
                             fontWeight: 600,
                             cursor: 'pointer',
                             transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                             transform: onboardingRole === role ? 'scale(1.02)' : 'scale(1)',
                             boxShadow: onboardingRole === role ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none'
                           }}
                         >
                           {role === 'GUIDE' ? 'Faculty (Guide)' : role === 'ADMIN' ? 'Administrator' : 'Student'}
                         </button>
                       ))}
                     </div>

                     <form key={onboardingRole} onSubmit={(e) => { e.preventDefault(); onboardMutation.mutate({ ...onboardForm, role: onboardingRole }); }} className="flex-col gap-5 animate-fade-up">
                        <div className="flex-col gap-2">
                           <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                           <div style={{ position: 'relative' }}>
                              <Users size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                              <input 
                                type="text" 
                                className="input-premium" 
                                placeholder={onboardingRole === 'ADMIN' ? "Admin Name" : onboardingRole === 'GUIDE' ? "Prof. John Doe" : "John Doe"} 
                                style={{ paddingLeft: '2.5rem' }}
                                value={onboardForm.name}
                                onChange={(e) => setOnboardForm({...onboardForm, name: e.target.value})}
                                required
                              />
                           </div>
                        </div>

                        <div className="flex-col gap-2">
                           <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Registration Number (Unique ID)</label>
                           <div style={{ position: 'relative' }}>
                              <Hash size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                              <input 
                                type="text" 
                                className="input-premium" 
                                placeholder={onboardingRole === 'ADMIN' ? "ADMIN-001" : onboardingRole === 'GUIDE' ? "FACULTY-2024" : "STU-999"} 
                                style={{ paddingLeft: '2.5rem' }}
                                value={onboardForm.registrationNumber}
                                onChange={(e) => setOnboardForm({...onboardForm, registrationNumber: e.target.value})}
                                required
                              />
                           </div>
                        </div>

                        <div className="flex-col gap-2">
                           <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Gmail Address</label>
                           <div style={{ position: 'relative' }}>
                              <MailIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                              <input 
                                type="email" 
                                className="input-premium" 
                                placeholder="user@gmail.com" 
                                style={{ paddingLeft: '2.5rem' }}
                                value={onboardForm.email}
                                onChange={(e) => setOnboardForm({...onboardForm, email: e.target.value})}
                                required
                              />
                           </div>
                        </div>

                        <div className="flex-col gap-2">
                           <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number</label>
                           <div style={{ position: 'relative' }}>
                              <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                              <input 
                                type="tel" 
                                className="input-premium" 
                                placeholder="+1 234 567 890" 
                                style={{ paddingLeft: '2.5rem' }}
                                value={onboardForm.phoneNumber}
                                onChange={(e) => setOnboardForm({...onboardForm, phoneNumber: e.target.value})}
                                required
                              />
                           </div>
                        </div>

                        {onboardingRole === 'STUDENT' && (
                          <div className="flex-col gap-2 animate-fade-in">
                             <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>Assign Faculty Guide (Register Number)</label>
                             <div style={{ position: 'relative' }}>
                                <BadgeCheck size={16} color="var(--accent-primary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input 
                                  type="text" 
                                  className="input-premium" 
                                  placeholder="Enter Faculty's Registration ID" 
                                  style={{ paddingLeft: '2.5rem', borderColor: 'var(--accent-primary)' }}
                                  value={onboardForm.assignedGuideRegistrationNumber}
                                  onChange={(e) => setOnboardForm({...onboardForm, assignedGuideRegistrationNumber: e.target.value})}
                                  required
                                />
                             </div>
                             <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>This student will only be able to interact with this specific faculty member.</p>
                          </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={onboardMutation.isPending} style={{ marginTop: '1rem', width: '100%' }}>
                           {onboardMutation.isPending ? <Loader2 className="spinner" /> : `Confirm & Onboard ${onboardingRole === 'GUIDE' ? 'Faculty' : onboardingRole === 'ADMIN' ? 'Administrator' : 'Student'}`}
                        </button>
                     </form>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="flex-col gap-6">
                  <div className="flex-between">
                    <h3 className="heading-m flex-center gap-3" style={{ justifyContent: 'flex-start' }}><Users size={24} color="var(--success)" /> <span>User Management</span></h3>
                    <div className="flex-center gap-2" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <Filter size={14} style={{ marginLeft: '0.5rem', opacity: 0.5 }} />
                        {(['ALL', 'STUDENT', 'GUIDE', 'ADMIN'] as const).map(role => (
                          <button 
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            style={{ 
                              padding: '0.4rem 0.8rem', 
                              fontSize: '0.75rem', 
                              fontWeight: 600,
                              borderRadius: '8px',
                              border: 'none',
                              background: roleFilter === role ? 'var(--accent-primary)' : 'transparent',
                              color: roleFilter === role ? 'white' : 'var(--text-muted)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {role}
                          </button>
                        ))}
                    </div>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0' }} />
                  
                  {usersLoading ? <div className="flex-center"><Loader2 className="spinner" /></div> :
                   !users || users.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No users registered.</p> :
                   <div style={{ overflowX: 'auto' }}>
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
                       {users
                        .filter((u: any) => roleFilter === 'ALL' || u.role === roleFilter)
                        .map((u: any) => (
                          <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '1rem 0' }}>#{u.id}</td>
                            <td style={{ fontWeight: 500 }}>{u.name}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                            <td><span className="badge" style={{ background: u.role === 'ADMIN' ? 'var(--error)' : u.role === 'GUIDE' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)' }}>{u.role}</span></td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                   </div>
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
