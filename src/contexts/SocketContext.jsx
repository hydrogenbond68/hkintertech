import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

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

export const SocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState(null);
    const [authVersion, setAuthVersion] = useState(0);

    useEffect(() => {
        const refreshSocket = () => setAuthVersion((value) => value + 1);
        window.addEventListener('auth-changed', refreshSocket);
        return () => window.removeEventListener('auth-changed', refreshSocket);
    }, [authVersion]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');

    const s = io(API_BASE_URL.replace('/api', ''), {
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
      s.disconnect();
    };
  }, []);

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