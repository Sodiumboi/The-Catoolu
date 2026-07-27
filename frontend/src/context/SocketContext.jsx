import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

// Socket.io server URL
// In dev: Vite proxy doesn't handle WebSockets, connect directly
// In prod: same origin (Nginx proxies /socket.io/)
const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : window.location.origin;

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const toast           = useToast();
  const socketRef       = useRef(null);
  const [connected, setConnected] = useState(false);
  // Dedupe connection warnings to one per disconnection episode — connect_error
  // otherwise fires once per reconnect attempt (up to 10× at 1s). Reset on connect.
  const warnedRef       = useRef(false);

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
    warnedRef.current = false;
    const socket = io(SOCKET_URL, {
      auth:              { token },
      reconnection:      true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setConnected(true);
      warnedRef.current = false; // fresh connection — allow the next episode to warn
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
      // 'io client disconnect' = we called socket.disconnect() (logout/unmount) — deliberate.
      if (reason === 'io client disconnect') return;
      if (!warnedRef.current) {
        warnedRef.current = true;
        toast.warning('Disconnected', 'Trying to reconnect automatically…');
      }
    });

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message);
      if (!warnedRef.current) {
        warnedRef.current = true;
        toast.warning('Connection problem', 'Having trouble reaching the server. Retrying…', {
          details: { raw: err.message },
        });
      }
    });

    // Server-side room errors (failed join / send_message / roll_dice). Emitted
    // by the backend but never consumed on the client until now — the audit's #1 gap.
    socket.on('error', (data) => {
      toast.error('Connection error', data?.message || 'Something went wrong in the room. Try again.', {
        details: { raw: data?.message, code: data?.code },
      });
    });

    socketRef.current = socket;

    // Cleanup on unmount or token change
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, user, toast]);

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