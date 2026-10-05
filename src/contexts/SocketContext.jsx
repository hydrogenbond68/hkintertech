import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

const configuredApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = configuredApiUrl || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

// Strip only a trailing "/api" segment so the Socket.IO server root is targeted.
// A bare .replace('/api', '') would also truncate a host like "https://api.example.com".
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState(null);

    // Depend on the identity that actually gates server-side authorization.
    // The previous effect had an empty dependency list, so a socket opened before
    // login stayed anonymous for the whole session and silently lost its rooms.
    const identityKey = user ? `${user.id}:${Boolean(user.is_admin)}` : 'anonymous';

    useEffect(() => {
    const token = localStorage.getItem('access_token');

    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('[Socket] connect_error:', err.message);
    });

    setSocket(s);

    return () => {
      s.removeAllListeners();
      s.disconnect();
      setIsConnected(false);
    };
  }, [identityKey]);

  const on = useCallback((event, handler) => {
    if (!socket) return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket]);

  const emit = useCallback((event, data) => {
    if (!socket) return;
    socket.emit(event, data);
  }, [socket]);

  const value = {
    socket,
    isConnected,
    on,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
