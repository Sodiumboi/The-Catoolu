import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth }   from './AuthContext';

const NotificationContext = createContext(null);

const PREF_KEY = 'coc_notifications_enabled';

export function NotificationProvider({ children }) {
  const { socket }          = useSocket();
  const { user }            = useAuth();
  const [toasts, setToasts] = useState([]);
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem(PREF_KEY) !== 'false' // default true
  );
  // Track which campaign room the user is currently in
  const currentRoomRef = useRef(null);

  // Expose a way for CampaignRoomPage to tell us the current room
  const setCurrentRoom = (id) => { currentRoomRef.current = id; };
  const clearCurrentRoom = ()  => { currentRoomRef.current = null; };

  const toggleEnabled = () => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem(PREF_KEY, String(next));
      return next;
    });
  };

  const dismiss = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const dismissAll = () => setToasts([]);

  // Listen for incoming messages globally
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleMessage = (msg) => {
      // Don't notify if the user is currently in that room
      if (currentRoomRef.current === msg.campaign_id) return;
      // Don't notify for own messages
      if (msg.user_id === user?.id) return;
      // Don't notify for system messages
      if (msg.type === 'system') return;

      const toast = {
        id:          Date.now() + Math.random(),
        campaignId:  msg.campaign_id,
        campaignName:msg.campaign_name || 'Campaign',
        username:    msg.username,
        avatarUrl:   msg.avatar_url || null,
        content:     msg.type === 'roll'
          ? '🎲 ' + (typeof msg.content === 'object'
              ? msg.content.summary
              : JSON.parse(msg.content || '{}').summary || 'Rolled dice')
          : msg.content,
        type:        msg.type,
        createdAt:   msg.created_at,
      };

      setToasts(prev => [...prev.slice(-4), toast]); // max 5 toasts

      // Auto-dismiss after 6 seconds
      setTimeout(() => dismiss(toast.id), 6000);
    };

    socket.on('receive_message', handleMessage);
    return () => socket.off('receive_message', handleMessage);
  }, [socket, enabled, user]);

  return (
    <NotificationContext.Provider value={{
      toasts, enabled, toggleEnabled,
      dismiss, dismissAll,
      setCurrentRoom, clearCurrentRoom,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}