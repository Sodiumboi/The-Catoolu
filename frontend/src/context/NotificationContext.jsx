import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

const PREF_KEY = 'coc_notifications_enabled';

export function NotificationProvider({ children }) {
  const { socket }          = useSocket();
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

  // Listen for new_notification events — fired by the backend for every
  // non-sender member regardless of which page they're on.
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleNewNotification = (data) => {
      // Suppress toast if the user is currently viewing that campaign room
      if (String(currentRoomRef.current) === String(data.campaign_id)) return;

      const toast = {
        id:           Date.now() + Math.random(),
        campaignId:   data.campaign_id,
        campaignName: data.campaign_name || 'Campaign',
        username:     data.sender_name,
        avatarUrl:    data.avatar_url || null,
        content:      data.content,
        type:         data.type,
        createdAt:    new Date().toISOString(),
      };

      setToasts(prev => [...prev.slice(-4), toast]);
      setTimeout(() => dismiss(toast.id), 6000);
    };

    socket.on('new_notification', handleNewNotification);
    return () => socket.off('new_notification', handleNewNotification);
  }, [socket, enabled]);

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