import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Socket.io server URL
// In dev: Vite proxy doesn't handle WebSockets, connect directly
// In prod: same origin (Nginx proxies /socket.io/)
const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : window.location.origin;

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const socketRef       = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Only connect if logged in
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Create socket connection with JWT auth
    const socket = io(SOCKET_URL, {
      auth:              { token },
      reconnection:      true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message);
    });

    socketRef.current = socket;

    // Cleanup on unmount or token change
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
}