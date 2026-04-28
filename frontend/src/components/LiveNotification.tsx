import { useEffect, useState } from 'react';
import { useWebSockets } from '../context/WebSocketContext';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export const LiveNotificationContainer = () => {
  const { notifications, removeNotification } = useWebSockets();

  return (
    <div style={{
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      pointerEvents: 'none'
    }}>
      {notifications.map((notif) => (
        <Toast key={notif.id} notification={notif} onRemove={removeNotification} />
      ))}
    </div>
  );
};

const Toast = ({ notification, onRemove }: { notification: any, onRemove: (id: string) => void }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = 6000; // 6 seconds

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onRemove(notification.id), 400);
  };

  const config = {
    SUCCESS: { icon: <CheckCircle size={24} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    INFO: { icon: <Info size={24} />, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    WARNING: { icon: <AlertTriangle size={24} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    ERROR: { icon: <XCircle size={24} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  }[notification.type as 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'] || { icon: <Info size={24} />, color: '#fff', bg: 'rgba(255,255,255,0.1)' };

  return (
    <div className={`notification-toast ${isClosing ? 'closing' : ''}`} style={{
      pointerEvents: 'auto',
      minWidth: '320px',
      maxWidth: '450px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${config.color}33`,
      borderRadius: '16px',
      padding: '1.25rem',
      display: 'flex',
      gap: '1rem',
      boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 0 15px ${config.color}11`,
      position: 'relative',
      overflow: 'hidden',
      animation: isClosing ? 'toast-slide-out 0.4s ease forwards' : 'toast-slide-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
    }}>
      <div style={{
        color: config.color,
        background: config.bg,
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {config.icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: config.color, letterSpacing: '0.05rem' }}>
            {notification.type}
          </span>
          <button onClick={handleClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
          {notification.message}
        </p>
      </div>

      {/* Animated Progress Bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        background: config.color,
        width: `${progress}%`,
        transition: 'width 0.05s linear',
        opacity: 0.6
      }} />
      
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(120%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes toast-slide-out {
          from { transform: translateX(0) scale(1); opacity: 1; }
          to { transform: translateX(120%) scale(0.9); opacity: 0; }
        }
        .notification-toast {
          transition: all 0.3s ease;
        }
        .notification-toast:hover {
          transform: translateY(-2px);
          box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.4), 0 0 20px \${config.color}22;
        }
      `}</style>
    </div>
  );
};
