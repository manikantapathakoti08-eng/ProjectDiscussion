import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAvailabilities } from '../../api/user.api';
import type { UserProfileDTO } from '../../api/user.api';
import { bookSession } from '../../api/session.api';
import { X, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BookingModalProps {
  guide: UserProfileDTO | null;
  onClose: () => void;
}

export default function BookingModal({ guide, onClose }: BookingModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [topicName, setTopicName] = useState(guide?.topics?.[0] || '');
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: availabilities, isLoading } = useQuery({
    queryKey: ['availabilities', guide?.id],
    queryFn: () => getAvailabilities(guide!.id),
    enabled: !!guide,
  });

  const bookMutation = useMutation({
    mutationFn: () => bookSession(selectedSlot!, topicName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      onClose(); 
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to book session');
    }
  });

  if (!guide) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel animate-fade-up" style={{ padding: '2rem', width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
        <div className="flex-between mb-4">
          <h2 className="heading-m">Project Discussion</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div className="flex-center gap-3 mb-6">
           <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>⏱️ 15 Min Session</span>
           <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>📅 1 Meeting / Day</span>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <div className="flex-col gap-4 mt-6">
          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Project Topic</label>
            <select 
              className="input-premium mt-2" 
              value={topicName} 
              onChange={(e) => setTopicName(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {guide.topics?.map(topic => (
                <option key={topic} value={topic} style={{ background: 'var(--bg-secondary)' }}>{topic}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} /> Select Availability Window
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>You will be assigned the first available 15-minute slot in the window.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              {isLoading ? (
                <div className="flex-center p-4">
                  <Loader2 className="spinner" size={24} />
                </div>
              ) : availabilities && availabilities.length > 0 ? (
                availabilities.filter(a => !a.isBooked).map((slot) => (
                  <label key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', background: selectedSlot === slot.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedSlot === slot.id ? 'var(--accent-primary)' : 'var(--glass-border)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)' }}>
                    <input 
                      type="radio" 
                      name="slot" 
                      checked={selectedSlot === slot.id} 
                      onChange={() => setSelectedSlot(slot.id)}
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    <div className="flex-col">
                      <span style={{ fontWeight: 500 }}>{format(new Date(slot.startTime), 'MMM d, yyyy')}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {format(new Date(slot.startTime), 'hh:mm a')} - {format(new Date(slot.endTime), 'hh:mm a')}
                      </span>
                    </div>
                  </label>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No open availability found.</p>
              )}
            </div>
          </div>

        </div>

        <div className="flex-center mt-6">
           <button 
             className="btn-primary" 
             style={{ width: '100%' }}
             disabled={!selectedSlot || bookMutation.isPending}
             onClick={() => bookMutation.mutate()}
           >
             {bookMutation.isPending ? <Loader2 className="spinner" /> : `Request 15-Min Slot`}
           </button>
        </div>
      </div>
    </div>
  );
}
