import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfileByEmail, getMyStats, updateProfile, changePassword } from '../api/user.api';
import { Mail, Shield, BookOpen, GraduationCap, Edit3, Save, Loader2, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '', bio: '' });
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', user?.email],
    queryFn: () => getProfileByEmail(user!.email),
    enabled: !!user?.email,
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getMyStats,
  });

  useEffect(() => {
    if (profile) {
      setFormData({ name: profile.name, bio: profile.bio || '' });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile', user?.email], updatedProfile);
      setUser({ ...user!, name: updatedProfile.name, bio: updatedProfile.bio });
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => changePassword(passwords.old, passwords.new),
    onSuccess: () => {
      setShowSuccess(true);
      setPasswords({ old: '', new: '', confirm: '' });
      setTimeout(() => setShowSuccess(false), 3000);
      setErrorMsg('');
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to change password');
    }
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setErrorMsg('New passwords do not match');
      return;
    }
    passwordMutation.mutate();
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isProfileLoading || isStatsLoading) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <Loader2 className="spinner" size={40} color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="max-width-xl animate-fade-up" style={{ margin: '0 auto' }}>
        <Link to={user?.role === 'GUIDE' ? "/guide/dashboard" : "/dashboard"} className="flex-center gap-2 mb-8" style={{ width: 'max-content', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>

        {/* Header Profile Card */}
        <div className="glass-panel" style={{ padding: '3rem', display: 'flex', gap: '3rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 700, color: 'white' }}>
            {profile?.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex-between">
              <div>
                {isEditing ? (
                  <input 
                    className="input-premium heading-l" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    style={{ background: 'transparent', borderBottom: '2px solid var(--accent-primary)', borderRadius: 0, padding: '0.2rem 0' }}
                  />
                ) : (
                  <h1 className="heading-l">{profile?.name}</h1>
                )}
                <div className="flex-center gap-4 mt-2" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)' }}>
                  <span className="flex-center gap-2"><Mail size={16} /> {profile?.email}</span>
                  <span className="badge badge-accent flex-center gap-2"><Shield size={14} /> {user?.role}</span>
                </div>
              </div>
              <button 
                 className={isEditing ? "btn-primary" : "btn-secondary"} 
                 onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                 disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <Loader2 size={18} className="spinner" /> : (isEditing ? <><Save size={18} /> Save Changes</> : <><Edit3 size={18} /> Edit Profile</>)}
              </button>
            </div>
            
            <div className="mt-6">
               <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Professional Bio</label>
               {isEditing ? (
                 <textarea 
                   className="input-premium mt-2" 
                   rows={3} 
                   value={formData.bio} 
                   onChange={e => setFormData({ ...formData, bio: e.target.value })}
                   placeholder="Describe your expertise and style... (Visible to students)"
                 />
               ) : (
                 <p className="mt-2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{profile?.bio || "No bio added yet. Click edit to tell the community about yourself!"}</p>
               )}
            </div>

            {profile?.topics && profile.topics.length > 0 && (
              <div className="mt-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project Topics</label>
                <div className="flex-center gap-2 mt-2" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                  {profile.topics.map(s => <span key={s} className="badge badge-accent">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
           <StatCard icon={<BookOpen color="#3b82f6" />} label="Sessions as Student" value={stats?.totalSessionsAsStudent || 0} color="#3b82f6" />
           <StatCard icon={<GraduationCap color="#8b5cf6" />} label="Sessions as Guide" value={stats?.totalSessionsAsGuide || 0} color="#8b5cf6" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>


           <div className="flex-col gap-6">


              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 className="heading-m mb-4 flex-center gap-2" style={{ justifyContent: 'flex-start' }}><Lock size={20} color="var(--accent-primary)" /> Security</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Update your password to keep your account secure.</p>
                
                <form onSubmit={handlePasswordChange} className="flex-col gap-4">
                   <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Password</label>
                      <input 
                        type="password" 
                        className="input-premium mt-1" 
                        required 
                        value={passwords.old} 
                        onChange={e => setPasswords({ ...passwords, old: e.target.value })}
                      />
                   </div>
                   <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>New Password</label>
                      <input 
                        type="password" 
                        className="input-premium mt-1" 
                        required 
                        value={passwords.new} 
                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                      />
                   </div>
                   <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Confirm New Password</label>
                      <input 
                        type="password" 
                        className="input-premium mt-1" 
                        required 
                        value={passwords.confirm} 
                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                      />
                   </div>

                   {errorMsg && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{errorMsg}</p>}
                   {showSuccess && (
                     <div className="flex-center gap-2" style={{ color: 'var(--success)', fontSize: '0.85rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                        <CheckCircle size={16} /> Password updated successfully!
                     </div>
                   )}

                   <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={passwordMutation.isPending}>
                      {passwordMutation.isPending ? <Loader2 size={18} className="spinner" /> : 'Update Password'}
                   </button>
                </form>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: `4px solid ${color}` }}>
       <div style={{ background: `${color}15`, padding: '1rem', borderRadius: '16px' }}>
          {icon}
       </div>
       <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</p>
       </div>
    </div>
  );
}
