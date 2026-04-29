import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingRequests, acceptSession, rejectSession, setAvailability, getGuideAvailability, deleteAvailability } from '../api/guide.api';
import { getDashboardData } from '../api/session.api';
import { LogOut, Home, Calendar, Activity, Loader2, Check, X, Clock, User as UserIcon, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';

export default function GuideDashboard() {
  const { user, logout, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();



  const [dateStr, setDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isRejection, setIsRejection] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['guideRequests'],
    queryFn: getPendingRequests
  });
  
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: getDashboardData
  });

  const [activeHeartbeatSessionId, setActiveHeartbeatSessionId] = useState<number | null>(null);

  useEffect(() => {
    let interval: any;
    if (activeHeartbeatSessionId) {
      interval = setInterval(() => {
        axios.post(`/api/sessions/${activeHeartbeatSessionId}/heartbeat`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).catch(err => console.error("Heartbeat failed", err));
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [activeHeartbeatSessionId, accessToken]);

  const joinMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.post(`/api/sessions/${id}/join`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return id;
    },
    onSuccess: (id) => {
      refetchDashboard();
      setActiveHeartbeatSessionId(id);
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await axios.post(`/api/sessions/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    onSuccess: () => {
      refetchDashboard();
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
       setIsRejection(false);
       setSuccessMsg('Session Marked as Completed!');
       setShowSuccess(true);
       setTimeout(() => setShowSuccess(false), 3000);
     }
    });

  const { data: availability, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ['guideAvailability', user?.id],
    queryFn: () => getGuideAvailability(user!.id),
    enabled: !!user?.id
  });

  const deleteSlotMutation = useMutation({
    mutationFn: deleteAvailability,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guideAvailability'] })
  });

  const availabilityMutation = useMutation({
    mutationFn: (payload: { start: string, end: string }) => setAvailability(payload.start, payload.end),
    onSuccess: () => {
      setScheduleError(null);
      setDateStr(''); setStartTimeStr(''); setEndTimeStr('');
       setIsRejection(false);
       setSuccessMsg('Availability mapped successfully!');
       setShowSuccess(true);
       setTimeout(() => setShowSuccess(false), 3000);
       queryClient.invalidateQueries({ queryKey: ['guideAvailability'] });
    },
    onError: (err: any) => setScheduleError(err.response?.data?.message || 'Failed to add availability')
  });

  const acceptMutation = useMutation({
    mutationFn: acceptSession,
    onSuccess: () => {
       setIsRejection(false);
       setSuccessMsg('Request Accepted! Student has been notified.');
       setShowSuccess(true);
       setTimeout(() => setShowSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['guideRequests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to accept session");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: rejectSession,
    onSuccess: () => {
       setIsRejection(true);
       setSuccessMsg('Request Declined.');
       setShowSuccess(true);
       setTimeout(() => setShowSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['guideRequests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to reject session");
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };




  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateStr || !startTimeStr || !endTimeStr) return;
    const start = `${dateStr}T${startTimeStr}:00`;
    const end = `${dateStr}T${endTimeStr}:00`;
    availabilityMutation.mutate({ start, end });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '320px', margin: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1rem', height: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
        <h2 className="heading-m text-gradient">Guide Portal</h2>
        
        <nav className="flex-col gap-2">
          <Link to="/guide/dashboard" className="flex-center gap-4" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--text-primary)' }}>
            <Home size={20} color="var(--accent-primary)" />
            <span style={{ fontWeight: 500 }}>Dashboard</span>
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
        <header className="flex-between" style={{ marginBottom: '3rem' }}>
          <div>
            <h1 className="heading-l animate-fade-up">Welcome Back, {user?.name}</h1>
            <p className="delay-100 animate-fade-up" style={{ color: 'var(--text-secondary)' }}>Review pending student requests and manage your project discussion schedule.</p>
          </div>
          

        </header>


        <div className="delay-200 animate-fade-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.5fr) minmax(300px, 1fr)', gap: '2rem' }}>
          <div className="flex-col gap-6" style={{ minWidth: '0' }}>
            
            <div className="glass-panel flex-col" style={{ padding: '2rem', minHeight: '300px', gap: '1rem' }}>
              <div className="flex-between">
                 <h3 className="heading-m flex-center gap-2" style={{ justifyContent: 'flex-start' }}><Activity size={20} color="var(--warning)" /> Discussion Requests</h3>
                 <span className="badge badge-warning">{requests?.length || 0}</span>
              </div>
              
              {isRequestsLoading ? (
                 <div className="flex-center p-4"><Loader2 className="spinner" size={30} /></div>
              ) : !requests || requests.length === 0 ? (
                <div className="flex-col flex-center" style={{ flex: 1, color: 'var(--text-muted)' }}>
                   <Activity size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
                   <p>No new student requests at the moment.</p>
                </div>
              ) : (
                <div className="flex-col gap-4 mt-4">
                  {requests.map((req: any) => (
                    <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{req.topicName}</span>
                        <span className="badge badge-warning">NEW REQUEST</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)' }}>Student: {req.studentName || `ID: ${req.studentId}`}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                          Scheduled for: {formatDate(req.startTime)}
                      </p>
                      <div className="flex-center gap-2">
                        <button 
                           className="btn-primary" 
                           style={{ flex: 1, padding: '0.5rem', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', border: '1px solid var(--success)' }}
                           onClick={() => acceptMutation.mutate(req.id)}
                           disabled={acceptMutation.isPending}
                        >
                           <Check size={18} /> Accept
                        </button>
                        <button 
                           className="btn-secondary" 
                           style={{ flex: 1, padding: '0.5rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                           onClick={() => rejectMutation.mutate(req.id)}
                           disabled={rejectMutation.isPending}
                        >
                           <X size={18} /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel flex-col" style={{ padding: '2rem', minHeight: '300px', gap: '1rem' }}>
              <div className="flex-between">
                <h3 className="heading-m flex-center gap-2" style={{ justifyContent: 'flex-start' }}><Clock size={20} color="var(--accent-primary)" /> Upcoming Discussions</h3>
                <span className="badge badge-accent">{dashboardData?.myGuidanceSessions?.length || 0}</span>
              </div>
              
              {isDashboardLoading ? (
                <div className="flex-center p-4"><Loader2 className="spinner" size={30} /></div>
              ) : !dashboardData?.myGuidanceSessions || dashboardData.myGuidanceSessions.length === 0 ? (
                <div className="flex-col flex-center" style={{ flex: 1, color: 'var(--text-muted)' }}>
                  <Clock size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
                  <p>Your calendar is empty. Set your availability to get started!</p>
                </div>
              ) : (
                <div className="flex-col gap-4 mt-4">
                  {dashboardData.myGuidanceSessions.map((sess: any) => (
                    <div key={sess.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                        <div className="flex-between">
                           <span style={{ fontWeight: 600 }}>{sess.topicName}</span>
                           <div className="flex-col items-end">
                              <span className={`badge badge-${
                                sess.status === 'COMPLETED' ? 'success' : 
                                sess.status === 'ACCEPTED' ? 'accent' : 
                                sess.status === 'DISPUTED' ? 'error' : 
                                'info'
                              }`}>{sess.status}</span>
                           </div>
                        </div>
                        <div className="flex-col gap-1 mt-2">
                           <p style={{ fontSize: '0.9rem', color: sess.status === 'COMPLETED' ? 'var(--success)' : 'var(--text-secondary)' }}>Student: <strong>{sess.studentName || 'Student'}</strong></p>
                           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                              {format(new Date(sess.startTime), 'h:mm a')} - {format(new Date(sess.endTime), 'h:mm a')}
                           </p>
                           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{format(new Date(sess.startTime), 'MMM d, yyyy')}</p>
                        </div>
                        
                        <div className="flex-col gap-2 mt-4">
                            {sess.status === 'ACCEPTED' && sess.meetingLink && (() => {
                               const start = new Date(sess.startTime).getTime();
                               const end = new Date(sess.endTime).getTime();
                               const nowTime = now.getTime();
                               const fiveMinsMillis = 5 * 60 * 1000;
                               
                               if (nowTime < (start - fiveMinsMillis)) {
                                 const timeStr = format(new Date(sess.startTime), 'h:mm a');
                                 return (
                                   <div className="upcoming-badge" style={{ justifyContent: 'center' }}>
                                     <Clock size={14} /> Room opens at {timeStr}
                                   </div>
                                 );
                               }
 
                               if (nowTime > end) {
                                 return (
                                   <div className="upcoming-badge" style={{ justifyContent: 'center', opacity: 0.5 }}>
                                     <Clock size={14} /> Session Time Expired
                                   </div>
                                 );
                               }
 
                               return (
                                 <a 
                                   href={sess.meetingLink} 
                                   target="_blank" 
                                   rel="noreferrer" 
                                   className="btn-join-premium" 
                                   onClick={() => joinMutation.mutate(sess.id)}
                                 >
                                   <Sparkles size={16} /> Enter 15-Min Meeting
                                 </a>
                               );
                            })()}
                           
                           <div className="flex-center mt-2">
                              {sess.status === 'ACCEPTED' && (
                                <button 
                                  className="btn-secondary" 
                                  style={{ width: '100%', fontSize: '0.9rem' }}
                                  onClick={() => completeMutation.mutate(sess.id)}
                                  disabled={completeMutation.isPending}
                                >
                                  Mark as Completed
                                </button>
                              )}
                              {sess.status === 'STUDENT_COMPLETED' && (
                                <button 
                                  className="btn-primary" 
                                  style={{ width: '100%', background: 'var(--success)', fontSize: '0.9rem' }}
                                  onClick={() => completeMutation.mutate(sess.id)}
                                  disabled={completeMutation.isPending}
                                >
                                  <Check size={16} /> Confirm Completion
                                </button>
                              )}
                              {sess.status === 'GUIDE_COMPLETED' && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>
                                  Waiting for Student confirmation...
                                </span>
                              )}
                           </div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel flex-col" style={{ padding: '2rem', height: 'max-content', gap: '1.5rem' }}>
             <h3 className="heading-m flex-center gap-2" style={{ justifyContent: 'flex-start' }}><Calendar size={20} color="var(--accent-primary)" /> Set Availability</h3>
             
             {scheduleError && (
               <div style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                 {scheduleError}
               </div>
             )}

             <form onSubmit={handleAddSlot} className="flex-col gap-4">
                <div>
                   <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Discussion Date</label>
                   <input type="date" className="input-premium mt-1" required value={dateStr} onChange={e => setDateStr(e.target.value)} />
                </div>
                <div className="flex-between gap-4">
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>From</label>
                     <input type="time" className="input-premium mt-1" required value={startTimeStr} onChange={e => setStartTimeStr(e.target.value)}/>
                   </div>
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>To</label>
                     <input type="time" className="input-premium mt-1" required value={endTimeStr} onChange={e => setEndTimeStr(e.target.value)}/>
                   </div>
                </div>
                <button type="submit" className="btn-primary" disabled={availabilityMutation.isPending} style={{ marginTop: '0.5rem' }}>
                   {availabilityMutation.isPending ? <Loader2 className="spinner" /> : 'Map Time Slot'}
                </button>
             </form>

             <hr style={{ opacity: 0.1, margin: '1rem 0' }} />
             
             <div className="flex-col gap-4">
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Availability</h4>
                
                {isAvailabilityLoading ? (
                  <Loader2 className="spinner" style={{ margin: 'auto' }} />
                ) : !availability || availability.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No slots set.</p>
                ) : (
                  <div className="flex-col gap-2">
                    {availability.map((slot: any) => (
                      <div key={slot.id} className="flex-between" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                           <p style={{ fontWeight: 500 }}>{format(new Date(slot.startTime), 'MMM d, yyyy')}</p>
                           <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                             {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                           </p>
                        </div>
                        <button 
                           onClick={() => deleteSlotMutation.mutate(slot.id)}
                           disabled={deleteSlotMutation.isPending}
                           style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.6, padding: '4px' }}
                        >
                           {deleteSlotMutation.isPending ? <Loader2 className="spinner" size={14} /> : <X size={16} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="blur-overlay animate-fade-in" style={{ animationDuration: '0.3s' }}>
          <div className="glass-panel animate-scale-in" style={{ padding: '3rem 5rem', textAlign: 'center', boxShadow: isRejection ? '0 0 50px rgba(239, 68, 68, 0.4)' : '0 0 50px rgba(34, 197, 94, 0.4)', borderColor: isRejection ? 'var(--error)' : 'var(--success)' }}>
            <div className={`flex-center ${isRejection ? 'pulse-error' : 'pulse-success'}`} style={{ width: '80px', height: '80px', background: isRejection ? 'var(--error)' : 'var(--success)', borderRadius: '50%', margin: '0 auto 1.5rem', color: 'white' }}>
              {isRejection ? <X size={48} strokeWidth={3} /> : <Check size={48} strokeWidth={3} />}
            </div>
            <h2 className="heading-l" style={{ color: 'white', marginBottom: '0.5rem' }}>{isRejection ? 'Action Denied' : 'Success!'}</h2>
            <p style={{ color: isRejection ? 'var(--error)' : 'var(--success)', fontWeight: 600, fontSize: '1.1rem' }}>{successMsg}</p>
          </div>
        </div>
      )}


    </div>
  );
}

function formatDate(dateString: string) {
  if (!dateString) return 'Not scheduled';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
