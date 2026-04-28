import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';

interface LiveNotification {
  id: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  timestamp: string;
}

interface WebSocketContextType {
  notifications: LiveNotification[];
  removeNotification: (id: string) => void;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const { user, accessToken } = useAuthStore();

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    if (!accessToken || !user) {
      setConnected(false);
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    // Remove trailing slash if present
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    const socketUrl = `${cleanBaseUrl}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`
      },
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      setConnected(true);
      console.log('Connected to WebSocket: ' + frame);

      // Subscribe to user-specific notifications
      client.subscribe(`/user/${user.email}/queue/notifications`, (message) => {
        const notification: LiveNotification = JSON.parse(message.body);
        setNotifications(prev => [...prev, notification]);
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.onWebSocketClose = () => {
      setConnected(false);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [user, accessToken]);

  return (
    <WebSocketContext.Provider value={{ notifications, removeNotification, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSockets = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSockets must be used within a WebSocketProvider');
  }
  return context;
};
