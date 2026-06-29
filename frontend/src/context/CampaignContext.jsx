import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CampaignContext = createContext(null);

// Persisted so the "connected" pill and the room subscription survive a full
// page refresh and any navigation — the connection is meant to stay live (for
// the notification system) until the user explicitly disconnects.
const STORAGE_KEY = 'coc_active_room';

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const room = raw ? JSON.parse(raw) : null;
    // Guard against malformed/partial data.
    return room && room.id && room.uuid ? room : null;
  } catch {
    return null;
  }
}

export function CampaignProvider({ children }) {
  // activeRoom: { id, name, uuid } or null. Initialised from localStorage so the
  // pill shows immediately on load, before the socket has even connected.
  const [activeRoom, setActiveRoom] = useState(loadStored);
  const { socket, connected } = useSocket();
  const { user, loading: authLoading } = useAuth();
  // Tracks the last `${socketId}:${campaignId}` we joined, so we re-join exactly
  // once per socket connection / room change (no churn on every render).
  const lastJoinRef = useRef(null);

  const enterRoom = (id, name, uuid) => {
    const room = { id, name, uuid };
    setActiveRoom(room);
    // The room page calls this right after it has already emitted join_campaign,
    // so record that join to stop the subscription effect below from re-emitting.
    if (socket?.id) lastJoinRef.current = socket.id + ':' + id;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(room)); } catch { /* ignore */ }
  };

  const leaveRoom = () => {
    setActiveRoom(null);
    lastJoinRef.current = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  // Drop the persisted connection on logout so a different user never inherits a
  // stale room. Gated on authLoading so the initial auth check on page load
  // (user briefly null) does not wipe a valid session.
  useEffect(() => {
    if (!authLoading && !user) {
      setActiveRoom(null);
      lastJoinRef.current = null;
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }, [authLoading, user]);

  // Keep the socket subscribed to the connected room across refreshes and across
  // pages — so the room stays "connected" even when the room page isn't open.
  // This re-issues join_campaign once per socket connection (and on reconnect,
  // since socket.id changes). The room page may also emit join_campaign when it
  // mounts; the backend handles the duplicate idempotently and clients dedupe
  // presence by user id.
  useEffect(() => {
    if (!socket || !connected || !activeRoom?.id) return;
    const key = socket.id + ':' + activeRoom.id;
    if (lastJoinRef.current === key) return;
    lastJoinRef.current = key;
    socket.emit('join_campaign', activeRoom.id);
  }, [socket, connected, activeRoom?.id]);

  return (
    <CampaignContext.Provider value={{ activeRoom, enterRoom, leaveRoom }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be inside CampaignProvider');
  return ctx;
}
