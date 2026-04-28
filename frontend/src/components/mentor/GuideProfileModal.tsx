import { useQuery } from '@tanstack/react-query';
import { getGuideReviews } from '../../api/session.api';
import type { UserProfileDTO } from '../../api/user.api';
import { X, Star, Calendar, MessageSquare, Loader2, Award } from 'lucide-react';
import { format } from 'date-fns';

interface GuideProfileModalProps {
  guide: UserProfileDTO;
  onClose: () => void;
  onBook: () => void;
}

export default function GuideProfileModal({ guide, onClose, onBook }: GuideProfileModalProps) {
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['guideReviews', guide.id],
    queryFn: () => getGuideReviews(guide.id)
  });

  return (
    <div className="blur-overlay" style={{ background: 'rgba(2, 6, 23, 0.85)', zIndex: 1100 }}>
      <div className="glass-panel animate-scale-in" style={{ 
        width: '100%', 
        maxWidth: '900px', 
        height: '90vh',
        display: 'flex', 
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.15)'
      }}>
        {/* Header Image/Gradient Area */}
        <div style={{ height: '160px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', position: 'relative' }}>
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', padding: '0.6rem', display: 'flex', backdropFilter: 'blur(10px)' }}
          >
            <X size={20} />
          </button>
          
          <div style={{ position: 'absolute', bottom: '-50px', left: '3rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '24px', 
              background: 'var(--glass-bg)', 
              backdropFilter: 'blur(20px)',
              border: '4px solid var(--glass-border)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '3rem', 
              fontWeight: 800,
              color: 'var(--accent-primary)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
            }}>
              {guide.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 className="heading-l" style={{ margin: 0, fontSize: '2.2rem' }}>{guide.name}</h2>
              <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', color: 'var(--warning)', fontWeight: 600 }}>
                <Star size={18} fill="currentColor" />
                <span>{guide.averageRating?.toFixed(1) || 'NEW'}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({guide.totalReviews || 0} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 2fr', padding: '70px 3rem 2rem', gap: '3rem', overflow: 'hidden' }}>
          
          {/* Left Panel: Info */}
          <div className="flex-col gap-6" style={{ overflowY: 'auto' }}>
            <div className="flex-col gap-3">
              <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>About Guide</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
                {guide.bio || "This guide hasn't provided a bio yet, but they're ready to share their expertise!"}
              </p>
            </div>

            <div className="flex-col gap-3">
              <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Project Topics</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                {guide.topics?.map(topic => (
                  <span key={topic} className="badge badge-accent" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderStyle: 'dashed' }}>
              <h4 className="flex-center gap-2" style={{ justifyContent: 'flex-start', marginBottom: '1rem', color: 'var(--accent-secondary)' }}>
                <Award size={18} /> Verified Guide
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                This guide has been manually verified. They are recognized experts in their respective fields.
              </p>
            </div>
          </div>

          {/* Right Panel: Reviews */}
          <div className="flex-col" style={{ overflow: 'hidden' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h4 className="flex-center gap-2" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                <MessageSquare size={16} /> Student Feedback
              </h4>
            </div>

            <div className="flex-col gap-4" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {reviewsLoading ? (
                <div className="flex-center py-10"><Loader2 className="spinner" /></div>
              ) : !reviews || reviews.length === 0 ? (
                <div className="flex-col flex-center py-20" style={{ opacity: 0.3 }}>
                  <MessageSquare size={48} />
                  <p className="mt-2">No reviews yet. Be the first to start a discussion!</p>
                </div>
              ) : (
                reviews.map((review: any) => (
                  <div key={review.id} className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex-between" style={{ marginBottom: '0.8rem' }}>
                      <span style={{ fontWeight: 600 }}>{review.reviewerName}</span>
                      <div className="flex-center gap-1" style={{ color: 'var(--warning)' }}>
                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      "{review.comment}"
                    </p>
                    <div className="mt-4" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {format(new Date(review.timestamp), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '1.5rem 3rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn-secondary" onClick={onClose}>Close Profile</button>
          <button className="btn-primary" style={{ minWidth: '200px' }} onClick={onBook}>
             <Calendar size={18} /> Request Discussion Now
          </button>
        </div>
      </div>
    </div>
  );
}
