import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate }      from 'react-router-dom';
import NavBar              from '../components/NavBar';
import RollFeed            from '../components/RollFeed';
import ChatInput           from '../components/ChatInput';
import DiceRow             from '../components/DiceRow';
import RoomSidebar         from '../components/RoomSidebar';
import KeeperPlayerCard    from '../components/KeeperPlayerCard';
import confetti            from 'canvas-confetti';
import SkillRollPopup      from '../components/SkillRollPopup';
import { useSocket }       from '../context/SocketContext';
import { useAuth }         from '../context/AuthContext';
import { useCampaign }     from '../context/CampaignContext';
import { useTheme }        from '../context/ThemeContext';
import apiClient           from '../api/client';
import SessionSheet        from '../components/SessionSheet';
import ReadOnlySheet       from '../components/ReadOnlySheet';
import RoomSubNav          from '../components/RoomSubNav';
import NotesWindow         from '../components/NotesWindow';
import NotesPane           from '../components/notes/NotesPane';
import RollRequestPill     from '../components/RollRequestPill';
import KeeperRollPicker    from '../components/KeeperRollPicker';
import KeeperHandoutPanel  from '../components/handouts/KeeperHandoutPanel';
import PlayerHandoutTab    from '../components/handouts/PlayerHandoutTab';
import HandoutViewer       from '../components/handouts/HandoutViewer';

// ── Feed dedup key ─────────────────────────────────────────────
// Message items carry a numeric `id`; handout-share items carry a UUID-string `id`.
// Keying on `type:id` makes dedup correctness independent of the number-vs-string
// coincidence, and works uniformly for realtime and paginated (load-older) items.
const keyOf = (m) => `${m.type}:${m.id}`;

// ── Resolve a skill/stat value from full character data ────────
function resolveRollValue(charData, rollType, rollName) {
  if (!charData?.sheet_data?.Investigator) return null;
  const inv = charData.sheet_data.Investigator;
  if (rollType === 'stat') return parseInt(inv.Characteristics?.[rollName]) || null;
  const skills = inv?.Skills?.Skill || [];
  for (const s of skills) {
    const display = s.subskill && s.subskill.toLowerCase() !== 'none'
      ? s.name + ' (' + s.subskill + ')'
      : s.name;
    if (display === rollName || s.name === rollName) return parseInt(s.value) || null;
  }
  return null;
}

// ── Roll context label builder ─────────────────────────────────
function getRollLabel(skillName, statName) {
  if (!skillName && !statName) return 'Roll';
  const name = skillName || statName;
  const weaponSkills = ['brawl', 'handgun', 'rifle', 'shotgun', 'fighting', 'bow'];
  if (weaponSkills.some(w => name.toLowerCase().includes(w))) return 'Make an Attack!';
  if (name.toLowerCase() === 'sanity') return 'Sanity Roll!';
  return 'Roll ' + name;
}

export default function CampaignRoomPage() {
  const { uuid }                  = useParams();
  const navigate                  = useNavigate();
  const { socket, connected }     = useSocket();
  const { user }                  = useAuth();
  const { enterRoom, leaveRoom }  = useCampaign();
  const { sheetFontScale, roomFontScale, memeEnabled } = useTheme();

  // ── Core state ────────────────────────────────────────────────
  const [campaign,      setCampaign]      = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [members,       setMembers]       = useState([]);
  const [onlineUsers,   setOnlineUsers]   = useState([]);
  const [myRole,        setMyRole]        = useState(null);
  const [myCharacter,   setMyCharacter]   = useState(null);
  const [myCharacters,  setMyCharacters]  = useState([]);
  const [typingUsers,   setTypingUsers]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [inRoom,        setInRoom]        = useState(false);

  // ── UI state ──────────────────────────────────────────────────
  const [subTab,        setSubTab]        = useState('main');
  const [notesState,    setNotesState]    = useState('closed');
  const [text,          setText]          = useState('');
  const [advMode,       setAdvMode]       = useState(false);
  const [disMode,       setDisMode]       = useState(false);
  const [rollVisibility, setRollVisibility] = useState('everyone');
  const [sidebarTab,    setSidebarTab]    = useState('chat');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [afk,           setAfk]           = useState(false);
  const [rollPopup,          setRollPopup]          = useState(null);
  const [keeperSheetModal,   setKeeperSheetModal]   = useState(null);
  const [myCharFullData, setMyCharFullData] = useState(null);
  const [rollRequests,      setRollRequests]      = useState([]);
  const [pendingRollReqs,   setPendingRollReqs]   = useState({});
  const [memberSheetCache,  setMemberSheetCache]  = useState({});
  const [attachedFiles,     setAttachedFiles]     = useState([]);
  const [isSending,         setIsSending]         = useState(false);
  const [uploadError,       setUploadError]       = useState(null);
  const [uploadProgress,    setUploadProgress]    = useState(null);
  const [popupSubmitting,   setPopupSubmitting]   = useState(false);
  const [rolling,           setRolling]           = useState(false);
  const [rollingDie,        setRollingDie]        = useState(null);
  const [sharedHandouts,    setSharedHandouts]    = useState([]);
  const [newHandoutCount,   setNewHandoutCount]   = useState(0);
  const [viewingHandout,    setViewingHandout]    = useState(null);
  const [keeperRollPicker,  setKeeperRollPicker]  = useState(null);
  const [hasMoreHistory,    setHasMoreHistory]    = useState(false);
  const [loadingOlder,      setLoadingOlder]      = useState(false);
  const [leftWidth,     setLeftWidth]     = useState(() => {
    const saved = parseInt(localStorage.getItem('sheet-panel-width'));
    return saved && saved >= 480 && saved <= 640 ? saved : 480;
  });
  // rollPopup: { label, value, mode, top, left }
  const forceMemeNextRollRef  = useRef(false);
  const memeEnabledRef        = useRef(memeEnabled);
  const historyLoadedRef      = useRef(false);
  const rollingTimeoutRef     = useRef(null);  // 8s fallback to re-enable dice if echo never arrives
  const popupTimeoutRef       = useRef(null);  // 8s fallback to clear skill-popup pending state
  const optimisticIdRef       = useRef(null);  // temp id of the in-flight optimistic chat-image card
  const uploadProgressMapRef  = useRef(new Map()); // per-file upload pct for aggregate progress
  const isDraggingRef         = useRef(false);
  const dragStartXRef         = useRef(0);
  const dragStartWidthRef     = useRef(400);
  // Chat-history pagination
  const loadingOlderRef       = useRef(false);  // sync guard against concurrent load-older fetches
  const prependingRef         = useRef(false);  // signals RollFeed to preserve scroll on prepend
  const feedCursorRef         = useRef(null);   // { before_ts, before_msg_id, before_share_id }
  const scrollCaptureFnRef    = useRef(null);   // RollFeed registers a scrollHeight-capture fn here
  const pinFeedToBottomRef    = useRef(null);   // RollFeed registers a "pin to bottom" fn here (composer growth)

  // Keep meme-toggle ref current for use inside socket-handler closures
  useEffect(() => { memeEnabledRef.current = memeEnabled; }, [memeEnabled]);

  // ── Reconnect socket on tab restore ───────────────────────────
  // Background tabs throttle timers; on restore the socket may still be
  // mid-reconnect or have been dropped. socket.io reconnection stays enabled
  // (see SocketContext), so we only nudge it: when the tab becomes visible and
  // the socket exists but isn't connected, kick off a connect attempt.
  // This adds NO roll/message/broadcast logic — purely a connection nudge.
  useEffect(() => {
    if (!socket) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [socket]);

  // ── Load campaign + messages ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Unified feed drives the chat stream (messages + handout shares, server-merged,
        // oldest-first, paginated). The separate /handouts/shared fetch is retained so the
        // handouts panel tabs keep the COMPLETE share list (the feed is capped at 50).
        const [campRes, feedRes, charRes, sharedRes] = await Promise.all([
          apiClient.get('/campaigns/' + uuid),
          apiClient.get('/campaigns/' + uuid + '/feed?limit=50'),
          apiClient.get('/characters'),
          apiClient.get('/campaigns/' + uuid + '/handouts/shared'),
        ]);

        const camp = campRes.data.campaign;
        setCampaign(camp);
        setMembers(camp.members || []);
        setMyRole(camp.my_role);

        // Feed items already arrive oldest-first in the unified shapes the feed renders.
        const items   = feedRes.data.items    || [];
        const hasMore = feedRes.data.has_more || false;
        setMessages(items);
        setHasMoreHistory(hasMore);
        // Cursor = oldest item currently in the feed (items[0] after oldest-first ordering).
        if (items.length > 0) {
          const oldest = items[0];
          feedCursorRef.current = {
            before_ts:       oldest.created_at,
            before_msg_id:   oldest.type !== 'handout_share' ? oldest.id : 0,
            before_share_id: oldest.type === 'handout_share' ? oldest._share_numeric_id : 0,
          };
        }

        historyLoadedRef.current = true;
        setMyCharacters(charRes.data.characters || []);
        setSharedHandouts(sharedRes.data || []);

        // Check if character already registered
        const me = camp.members?.find(m => m.id === user?.id);
        if (me?.character_id && me?.character_name) {
          setMyCharacter({
            id:         me.character_id,
            uuid:       me.character_uuid,
            name:       me.character_name,
            occupation: me.character_occupation,
          });
        }
      } catch (err) {
        setError(err.response?.status === 403
          ? 'You are not a member of this campaign.'
          : 'Could not load campaign.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uuid]);

  // ── Socket room join ──────────────────────────────────────────
  useEffect(() => {
    if (!socket || !connected || loading || error || !campaign) return;

    socket.emit('join_campaign', campaign?.id);

    const onJoined = (data) => {
      setOnlineUsers(data.onlineUsers || []);
      setInRoom(true);
      if (campaign) {
        enterRoom(campaign?.id, campaign.name, campaign?.uuid);
      }
    };

    const onMessage = (msg) => {
      const withMeme = (
        forceMemeNextRollRef.current && msg.type === 'roll' && msg.user_id === user?.id
      );
      if (withMeme) forceMemeNextRollRef.current = false;

      const isOwnEcho = msg.user_id === user?.id;

      setMessages(prev => {
        // On our own echo, strip any pending optimistic cards BEFORE appending the
        // real message — keeps the feed free of duplicate optimistic/real pairs.
        const base = isOwnEcho ? prev.filter(m => !m._optimistic) : prev;
        if (base.some(m => keyOf(m) === keyOf(msg))) return base;
        return [...base, withMeme ? { ...msg, _forceMeme: true } : msg];
      });

      // Clear pending/anti-double-click guards once our own echo arrives.
      if (isOwnEcho) {
        optimisticIdRef.current = null;
        setIsSending(false);
        setUploadProgress(null);
        if (msg.type === 'roll') {
          setRolling(false);
          setRollingDie(null);
          setPopupSubmitting(false);
          clearTimeout(rollingTimeoutRef.current);
          clearTimeout(popupTimeoutRef.current);
        }
      }

      if (!historyLoadedRef.current) return;

      // Live-update keeper's player cards when a stat changes
      if (msg.type === 'chat') {
        try {
          const parsed = typeof msg.content === 'string' ? JSON.parse(msg.content) : null;
          if (parsed?.stat && parsed?.newVal !== undefined) {
            const fieldMap = { HitPts: 'hit_pts', MagicPts: 'magic_pts', Sanity: 'sanity' };
            const field = fieldMap[parsed.stat];
            if (field) {
              setMembers(prev => prev.map(m =>
                m.id === msg.user_id ? { ...m, [field]: String(parsed.newVal) } : m
              ));
            }
            // Keep the sheet cache in sync so the roll picker always shows current values
            setMemberSheetCache(prev => {
              const cached = prev[msg.user_id];
              if (!cached) return prev;
              return {
                ...prev,
                [msg.user_id]: {
                  ...cached,
                  sheet_data: {
                    ...cached.sheet_data,
                    Investigator: {
                      ...cached.sheet_data?.Investigator,
                      Characteristics: {
                        ...cached.sheet_data?.Investigator?.Characteristics,
                        [parsed.stat]: String(parsed.newVal),
                      },
                    },
                  },
                },
              };
            });
          }
        } catch {}
      }

      if (msg.type === 'roll') {
        const raw = typeof msg.content === 'string'
          ? (() => { try { return JSON.parse(msg.content); } catch { return null; } })()
          : msg.content;
        if (memeEnabledRef.current &&
            raw?.notation?.toLowerCase().includes('d100') &&
            (raw.total === 1 || raw.total === 100)) {
          const colors = raw.total === 100
            ? ['#7f0000', '#ff6b6b', '#1a0000']
            : ['#3B6D11', '#C0DD97', '#F59E0B'];
          [{ x: 0.2, y: 0.6 }, { x: 0.8, y: 0.6 }].forEach(origin =>
            confetti({ particleCount: 100, spread: 80, origin, colors })
          );
        }
      }
    };

    const onUserJoined = (u) => {
      setOnlineUsers(prev => prev.find(x => x.id === u.id) ? prev : [...prev, u]);
    };

    const onUserLeft  = (u) => {
      setOnlineUsers(prev => prev.filter(x => x.id !== u.id));
    };

    const onTypingStart = ({ username }) => {
      setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
    };

    const onTypingStop = ({ username }) => {
      setTypingUsers(prev => prev.filter(u => u !== username));
    };

    const onAfkChange = ({ userId, afk: isAfk }) => {
      setOnlineUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, afk: isAfk } : u
      ));
    };

    const onCharacterChange = ({ userId, character }) => {
      setMembers(prev => prev.map(m =>
        m.id === userId
          ? {
              ...m,
              character_id:         character?.id           || null,
              character_name:       character?.name         || null,
              character_occupation: character?.occupation   || null,
              hit_pts:              character?.hit_pts      ?? null,
              hit_pts_max:          character?.hit_pts_max  ?? null,
              magic_pts:            character?.magic_pts    ?? null,
              magic_pts_max:        character?.magic_pts_max ?? null,
              sanity:               character?.sanity       ?? null,
              sanity_max:           character?.sanity_max   ?? null,
              portrait:             character?.portrait     ?? null,
            }
          : m
      ));
    };

    const onKeeperRollRequest = (data) => {
      setRollRequests(prev => {
        if (prev.some(r => r.requestId === data.requestId)) return prev;
        return [...prev, data];
      });
    };

    const onKeeperRollRequestCancel = ({ requestId }) => {
      setRollRequests(prev => prev.filter(r => r.requestId !== requestId));
    };

    const onPlayerRollResponse = ({ requestId }) => {
      setPendingRollReqs(prev => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    };

    const onHandoutShared = (data) => {
      const shareItem = {
        id:         data.share_uuid,
        type:       'handout_share',
        handout:    data.handout,
        user_id:    data.shared_by_id,
        username:   data.shared_by,
        avatar_url: data.avatar_url,
        created_at: data.shared_at,
      };
      setMessages(prev => {
        if (prev.some(m => keyOf(m) === keyOf(shareItem))) return prev;
        return [...prev, shareItem];
      });
      setSharedHandouts(prev => {
        if (prev.some(s => s.share_uuid === data.share_uuid)) return prev;
        return [...prev, {
          share_uuid: data.share_uuid,
          shared_at:  data.shared_at,
          shared_by:  data.shared_by,
          handout:    data.handout,
        }];
      });
      setNewHandoutCount(prev => prev + 1);
    };

    const onMessageDeleted = ({ id }) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    };

    socket.on('joined',                    onJoined);
    socket.on('receive_message',           onMessage);
    socket.on('user_joined',               onUserJoined);
    socket.on('user_left',                 onUserLeft);
    socket.on('typing_start',              onTypingStart);
    socket.on('typing_stop',               onTypingStop);
    socket.on('afk_change',               onAfkChange);
    socket.on('character_change',          onCharacterChange);
    socket.on('keeper:roll_request',       onKeeperRollRequest);
    socket.on('keeper:roll_request_cancel', onKeeperRollRequestCancel);
    socket.on('player:roll_response',      onPlayerRollResponse);
    socket.on('handout:shared',            onHandoutShared);
    socket.on('message:deleted',           onMessageDeleted);

    return () => {
      socket.off('joined',                    onJoined);
      socket.off('receive_message',           onMessage);
      socket.off('user_joined',               onUserJoined);
      socket.off('user_left',                 onUserLeft);
      socket.off('typing_start',              onTypingStart);
      socket.off('typing_stop',               onTypingStop);
      socket.off('afk_change',               onAfkChange);
      socket.off('character_change',          onCharacterChange);
      socket.off('keeper:roll_request',       onKeeperRollRequest);
      socket.off('keeper:roll_request_cancel', onKeeperRollRequestCancel);
      socket.off('player:roll_response',      onPlayerRollResponse);
      socket.off('handout:shared',            onHandoutShared);
      socket.off('message:deleted',           onMessageDeleted);
    };
  }, [socket, connected, loading, error, uuid, campaign]);

  useEffect(() => {
    if (campaign && inRoom) {
      enterRoom(campaign?.id, campaign.name, campaign?.uuid);
    }
  }, [campaign, inRoom]);

  // ── Load older history (scroll-to-top pagination) ─────────────
  const loadOlderMessages = async () => {
    if (loadingOlderRef.current || !hasMoreHistory || !feedCursorRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const cursor = feedCursorRef.current;
      const params = new URLSearchParams({
        limit:           '50',
        before_ts:       cursor.before_ts,
        before_msg_id:   String(cursor.before_msg_id   || 0),
        before_share_id: String(cursor.before_share_id || 0),
      });
      const res     = await apiClient.get('/campaigns/' + uuid + '/feed?' + params.toString());
      const older   = res.data.items    || [];
      const hasMore = res.data.has_more || false;

      if (older.length > 0) {
        // Capture scrollHeight BEFORE the prepend so RollFeed can restore scroll position.
        scrollCaptureFnRef.current?.();
        prependingRef.current = true; // signal RollFeed BEFORE the state update
        setMessages(prev => {
          // Dedup against current feed using keyOf (type:id) — robust for both
          // numeric message ids and UUID share ids.
          const seen = new Set(prev.map(keyOf));
          const fresh = older.filter(item => !seen.has(keyOf(item)));
          return [...fresh, ...prev];
        });
        setHasMoreHistory(hasMore);
        const oldest = older[0];
        feedCursorRef.current = {
          before_ts:       oldest.created_at,
          before_msg_id:   oldest.type !== 'handout_share' ? oldest.id : 0,
          before_share_id: oldest.type === 'handout_share' ? oldest._share_numeric_id : 0,
        };
      } else {
        setHasMoreHistory(false);
      }
    } catch (err) {
      console.error('loadOlderMessages failed', err);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  };

  const handleDeleteMessage = async (msg) => {
    try {
      if (msg.type === 'handout_share') {
        await apiClient.delete(`/campaigns/${uuid}/handouts/shares/${msg.id}`);
      } else {
        await apiClient.delete(`/campaigns/${uuid}/messages/${msg.id}`);
      }
      // Socket event 'message:deleted' will remove it from all clients' feeds
    } catch (err) {
      console.error('Delete message failed', err);
    }
  };

  // Fetch full sheet data whenever the active character changes
  useEffect(() => {
    if (!myCharacter?.uuid) { setMyCharFullData(null); return; }
    apiClient.get('/characters/' + myCharacter.uuid)
      .then(res => setMyCharFullData(res.data.character))
      .catch(() => setMyCharFullData(null));
  }, [myCharacter?.uuid]);


  // ── Left-panel resize ─────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current) return;
      const next = Math.max(480, Math.min(640, dragStartWidthRef.current + (e.clientX - dragStartXRef.current)));
      setLeftWidth(next);
    };
    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current        = false;
      document.body.style.cursor      = '';
      document.body.style.userSelect  = '';
      setLeftWidth(w => { localStorage.setItem('sheet-panel-width', w); return w; });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const handlePanelDragStart = (e) => {
    isDraggingRef.current       = true;
    dragStartXRef.current       = e.clientX;
    dragStartWidthRef.current   = leftWidth;
    document.body.style.cursor      = 'col-resize';
    document.body.style.userSelect  = 'none';
    e.preventDefault();
  };

  // ── Attachment file validation ────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file.type.startsWith('image/')) { alert('Only image files can be attached.'); return; }
    if (file.size > 5 * 1024 * 1024)    { alert('Image must be under 5MB.');           return; }
    // Cap at 5 attachments per message — silently ignore extras.
    setAttachedFiles(prev => prev.length >= 5 ? prev : [...prev, file]);
  };

  const handleClearAttachment = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remove an optimistic chat-image card after its upload failed (error state dismiss).
  const handleDismissOptimistic = (tempId) => {
    if (optimisticIdRef.current === tempId) optimisticIdRef.current = null;
    setMessages(prev => prev.filter(m => m.id !== tempId));
  };

  // ── Send handler ──────────────────────────────────────────────
  const handleSend = async (inputText, shiftKey = false) => {
    if (!socket || !inRoom) return;
    if (isSending) return;          // anti-double-click guard

    setIsSending(true);
    setUploadError(null);

    if (afk) handleToggleAfk();

    const trimmed = inputText.trim();

    // Upload attachments if present — both roles route through /chat-image.
    // Multiple files upload in parallel, then ONE send_message carries the gallery.
    if (attachedFiles.length > 0) {
      const files = attachedFiles;
      setAttachedFiles([]);

      // Insert an optimistic, message-shaped placeholder that shows aggregate progress.
      const tempId = 'optimistic-' + Date.now();
      optimisticIdRef.current     = tempId;
      uploadProgressMapRef.current = new Map(files.map((_, i) => [i, 0]));
      setMessages(prev => [...prev, {
        id:         tempId,
        type:       'chat',
        _optimistic: true,
        _progress:  0,
        content:    '',
        created_at: new Date().toISOString(),
        user_id:    user?.id,
        username:   user?.username,
        image_urls: [],
      }]);

      try {
        const urls = await Promise.all(files.map((file, i) => {
          const fd = new FormData();
          fd.append('file', file);
          return apiClient.post(
            '/campaigns/' + uuid + '/chat-image',
            fd,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (e) => {
                if (!e.total) return;
                uploadProgressMapRef.current.set(i, Math.round((e.loaded / e.total) * 100));
                const agg = [...uploadProgressMapRef.current.values()]
                  .reduce((a, b) => a + b, 0) / files.length;
                setMessages(prev => prev.map(m =>
                  m.id === tempId ? { ...m, _progress: Math.round(agg) } : m
                ));
              },
            }
          ).then(r => r.data.url);
        }));

        socket.emit('send_message', {
          campaignId:    campaign?.id,
          content:       trimmed,
          characterName: myCharacter?.name || null,
          image_urls:    urls,
        });
        // receive_message echo will remove the optimistic card, append the real
        // message, and clear isSending.
        return;
      } catch (err) {
        const human = err?.response?.data?.error
          || 'Failed to send image. Please try again.';
        // Flip the optimistic card into an error state; keep it in the feed so the
        // user can read the error and dismiss it.
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, _error: human, _progress: null } : m
        ));
        setUploadError(human);
        setIsSending(false);
        return;
      }
    }

    const isRoll  = trimmed.startsWith('/roll') || trimmed.startsWith('/r ') || trimmed === '/r';

    if (isRoll) {
      let notation = trimmed.replace(/^\/(roll|r)\s*/i, '').trim();
      if (!notation) notation = advMode ? '1d100adv' : disMode ? '1d100dis' : '1d100';
      else if (!notation.endsWith('adv') && !notation.endsWith('dis')) {
        if (advMode) notation += 'adv';
        if (disMode) notation += 'dis';
      }

      const isD100 = notation.toLowerCase().includes('d100');
      if (shiftKey && isD100 && memeEnabledRef.current) {
        [{ x: 0.2, y: 0.6 }, { x: 0.8, y: 0.6 }].forEach(o =>
          confetti({ particleCount: 100, spread: 80, origin: o, colors: ['#3B6D11', '#C0DD97', '#F59E0B'] })
        );
        forceMemeNextRollRef.current = true;
      }

      if (rollVisibility === 'only_me') {
        try {
          const res = await apiClient.post(
            '/campaigns/' + uuid + '/roll/hidden',
            { notation, skillName: null, skillValue: null }
          );
          const msg = {
            ...res.data.message,
            user_id:  user?.id,
            username: user?.username,
            _hidden:  true,
          };
          if (shiftKey && isD100) {
            msg._forceMeme = true;
            forceMemeNextRollRef.current = false;
          }
          setMessages(prev => [...prev, msg]);
        } catch { /* silent */ }
        // Hidden rolls produce no receive_message echo — clear the lock here.
        setIsSending(false);
      } else {
        socket.emit('roll_dice', {
          campaignId:    campaign?.id,
          notation,
          skillName:     null,
          skillValue:    null,
          characterName: myCharacter?.name || null,
        });
        // receive_message echo (type roll) will clear isSending.
      }
    } else if (trimmed) {
      socket.emit('send_message', {
        campaignId:    campaign?.id,
        content:       trimmed,
        characterName: myCharacter?.name || null,
      });
      // receive_message echo will clear isSending.
    } else {
      // Nothing left to send (e.g. keeper image-only already handled above).
      setIsSending(false);
    }
  };

  // ── Skill/stat click roll ─────────────────────────────────────
  const handleElementClick = (e, label, value, defaultMode) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRollPopup({
      label,
      value,
      mode: defaultMode || (advMode ? 'adv' : disMode ? 'dis' : 'normal'),
      anchorRect: rect,
    });
  };

  const handlePopupRoll = (mode, label, value) => {
    if (!socket || !inRoom) return;
    if (popupSubmitting) return;          // anti-double-click guard
    const suffix   = mode === 'adv' ? 'adv' : mode === 'dis' ? 'dis' : '';
    const notation = '1d100' + suffix;

    setPopupSubmitting(true);
    clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = setTimeout(() => setPopupSubmitting(false), 8000);

    if (rollVisibility === 'only_me') {
      apiClient.post('/campaigns/' + uuid + '/roll/hidden', {
        notation, skillName: label, skillValue: value,
      }).then(res => {
        setMessages(prev => [...prev, {
          ...res.data.message,
          user_id:  user?.id,
          username: user?.username,
          _hidden:  true,
        }]);
      }).catch(() => {}).finally(() => {
        // Hidden rolls produce no receive_message echo — clear here.
        setPopupSubmitting(false);
        clearTimeout(popupTimeoutRef.current);
      });
    } else {
      socket.emit('roll_dice', {
        campaignId:    campaign?.id,
        notation,
        skillName:     label,
        skillValue:    value,
        characterName: myCharacter?.name || null,
      });
      // receive_message echo (type roll) will clear popupSubmitting.
    }
    setRollPopup(null);
  };

  // ── HP/MP/Luck/Sanity auto-save ───────────────────────────────
  const handleStatBlur = async (statKey, oldVal, newVal, characterId) => {
    if (oldVal === newVal || !characterId) return;
    try {
      await apiClient.put('/characters/' + characterId + '/stat', {
        stat: statKey, value: newVal,
      });
      setMyCharFullData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sheet_data: {
            ...prev.sheet_data,
            Investigator: {
              ...prev.sheet_data?.Investigator,
              Characteristics: {
                ...prev.sheet_data?.Investigator?.Characteristics,
                [statKey]: newVal,
              },
            },
          },
        };
      });
      socket?.emit('send_message', {
        campaignId:    campaign?.id,
        content:       JSON.stringify({
          stat:          statKey,
          oldVal,
          newVal,
          characterName: myCharacter?.name,
        }),
        type:          'stat_change',
        characterName: myCharacter?.name || null,
      });
    } catch (err) {
      console.error('[stat save] failed:', statKey, characterId, err?.response?.data || err?.message);
    }
  };

  // ── Weapon attack handler ─────────────────────────────────────
  const handleWeaponAttack = (weapon, matchedSkill, mode) => {
    if (!socket || !inRoom) return;

    const suffix   = mode === 'adv' ? 'adv' : mode === 'dis' ? 'dis' : '';
    const notation = '1d100' + suffix;
    const skillVal = weapon.regular
      ? parseInt(weapon.regular)
      : matchedSkill ? parseInt(matchedSkill.value) : null;

    if (rollVisibility === 'only_me') {
      apiClient.post('/campaigns/' + uuid + '/roll/hidden', {
        notation,
        skillName:  'Attack — ' + weapon.name,
        skillValue: skillVal,
      }).then(res => {
        setMessages(prev => [...prev, {
          ...res.data.message,
          user_id:  user?.id,
          username: user?.username,
          _hidden:  true,
        }]);
      }).catch(() => {});
    } else {
      socket.emit('roll_dice', {
        campaignId:    campaign?.id,
        notation,
        skillName:     'Attack — ' + weapon.name,
        skillValue:    skillVal,
        characterName: myCharacter?.name || null,
        weaponDamage:  weapon.damage || null,
        weaponName:    weapon.name,
      });
    }
  };

  // ── AFK toggle ────────────────────────────────────────────────
  const handleToggleAfk = () => {
    const next = !afk;
    setAfk(next);
    socket?.emit('afk_change', { campaignId: campaign?.id, afk: next });
  };

  // ── Leave table ───────────────────────────────────────────────
  const handleLeave = () => {
    socket?.emit('leave_campaign', { campaignId: campaign?.id });
    leaveRoom();
    setTimeout(() => {
      navigate('/campaign');
    }, 100);
  };

  // ── Keeper sheet preview ──────────────────────────────────────
  const handleOpenKeeperSheet = async (member) => {
    try {
      // Fetch by uuid (the /characters/:uuid route matches on uuid, not the
      // numeric character_id). Mirrors the Keeper-tab sheet preview.
      const res = await apiClient.get('/characters/' + member.character_uuid);
      setKeeperSheetModal(res.data.character);
    } catch {
      setKeeperSheetModal({ _error: true });
    }
  };

  // ── Keeper roll request ────────────────────────────────────────
  const handleOpenRollPicker = async (member, anchorRect) => {
    const cached = memberSheetCache[member.id];
    if (cached) {
      setKeeperRollPicker({ member, charData: cached, anchorRect, allMode: false });
      return;
    }
    try {
      const res = await apiClient.get('/characters/' + member.character_uuid);
      const data = res.data.character;
      setMemberSheetCache(prev => ({ ...prev, [member.id]: data }));
      setKeeperRollPicker({ member, charData: data, anchorRect, allMode: false });
    } catch { /* silently fail */ }
  };

  const handleOpenAllRollPicker = async (anchorRect) => {
    const players = members.filter(m => m.role === 'player' && m.character_uuid);
    if (!players.length) return;
    // Use first available cached sheet; fall back to fetching the first player's sheet for skill names
    const cached = memberSheetCache[players[0].id];
    if (cached) {
      setKeeperRollPicker({ member: null, charData: cached, anchorRect, allMode: true });
      return;
    }
    try {
      const res = await apiClient.get('/characters/' + players[0].character_uuid);
      const data = res.data.character;
      setMemberSheetCache(prev => ({ ...prev, [players[0].id]: data }));
      setKeeperRollPicker({ member: null, charData: data, anchorRect, allMode: true });
    } catch { /* silently fail */ }
  };

  const handlePickerSelect = async (rollType, rollName, rollValue) => {
    setKeeperRollPicker(null);
    if (!socket || !inRoom) return;
    const requestId = crypto.randomUUID();
    const { member, allMode } = keeperRollPicker;

    if (allMode) {
      const players = members.filter(m => m.role === 'player' && m.character_uuid);
      // Fetch any un-cached sheets so we can send per-player values
      const sheets = await Promise.all(
        players.map(async m => {
          if (memberSheetCache[m.id]) return { userId: m.id, charData: memberSheetCache[m.id] };
          try {
            const res = await apiClient.get('/characters/' + m.character_uuid);
            setMemberSheetCache(prev => ({ ...prev, [m.id]: res.data.character }));
            return { userId: m.id, charData: res.data.character };
          } catch { return { userId: m.id, charData: null }; }
        })
      );

      const playerValues = sheets.map(({ userId, charData }) => {
        const val = resolveRollValue(charData, rollType, rollName);
        return { userId, rollValue: val };
      });

      socket.emit('keeper:roll_request', {
        campaignId:   campaign?.id,
        targetUserId: 'all',
        rollType,
        rollName,
        players:      playerValues,
        requestId,
      });

      const newPending = {};
      players.forEach(m => {
        newPending[requestId + ':' + m.id] = { memberId: m.id, rollName, requestId };
      });
      setPendingRollReqs(prev => ({ ...prev, ...newPending }));
    } else {
      socket.emit('keeper:roll_request', {
        campaignId:   campaign?.id,
        targetUserId: member.id,
        rollType,
        rollName,
        rollValue,
        requestId,
      });
      setPendingRollReqs(prev => ({
        ...prev,
        [requestId]: { memberId: member.id, rollName, requestId },
      }));
    }
  };

  const handleCancelRollRequest = (requestId) => {
    if (!socket || !inRoom) return;
    socket.emit('keeper:roll_request_cancel', { campaignId: campaign?.id, requestId });
    setPendingRollReqs(prev => {
      const next = { ...prev };
      // Remove both plain requestId and composite "requestId:userId" keys
      Object.keys(next).forEach(k => {
        if (k === requestId || k.startsWith(requestId + ':')) delete next[k];
      });
      return next;
    });
  };

  const handlePillRoll = (rollName, rollValue, requestId) => {
    if (!socket || !inRoom) return;
    const suffix   = advMode ? 'adv' : disMode ? 'dis' : '';
    const notation = '1d100' + suffix;
    socket.emit('player:roll_response', {
      campaignId: campaign?.id,
      requestId,
      rollName,
      rollValue,
      notation,
    });
    setRollRequests(prev => prev.filter(r => r.requestId !== requestId));
  };

  const handlePillDismiss = (requestId) => {
    setRollRequests(prev => prev.filter(r => r.requestId !== requestId));
  };

  // ── Adv/Dis toggle ────────────────────────────────────────────
  const handleToggleAdv = () => { setAdvMode(p => !p); setDisMode(false); };
  const handleToggleDis = () => { setDisMode(p => !p); setAdvMode(false); };

  // ── Sidebar tab toggle ────────────────────────────────────────
  const handleTabChange = (tab) => {
    if (tab === 'chat') {
      setSidebarTab('chat');
      setSidebarOpen(false);
    } else if (sidebarOpen && sidebarTab === tab) {
      setSidebarOpen(false);
    } else {
      setSidebarTab(tab);
      setSidebarOpen(true);
    }
  };

  // ── Character change (from sidebar) ──────────────────────────
  const handleChangeCharacter = async (character) => {
    try {
      await apiClient.put('/campaigns/' + uuid + '/character', {
        character_id: character?.id || null,
      });
      setMyCharacter(character || null);
      socket?.emit('character_change', {
        campaignId:  campaign?.id,
        characterId: character?.id || null,
      });
    } catch { /* silent */ }
  };

  // ── Typing handlers ───────────────────────────────────────────
  const handleTyping     = () => socket?.emit('typing',      { campaignId: campaign?.id });
  const handleStopTyping = () => socket?.emit('stop_typing', { campaignId: campaign?.id });

  // ── Render guards ─────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-page)',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'var(--text-muted)', fontFamily:'var(--font-sans)',
    }}>
      Loading campaign...
    </div>
  );

  if (error) return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-page)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:'16px',
      fontFamily:'var(--font-sans)',
    }}>
      <p style={{ color:'var(--danger)' }}>{error}</p>
      <button onClick={() => navigate('/campaign')}
              style={{ color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
        ← Back to Campaigns
      </button>
    </div>
  );

  // myCharFullData is populated by the effect above whenever myCharacter changes

  return (
    <div style={{
      height:        '100vh',
      display:       'flex',
      flexDirection: 'column',
      background:    'var(--bg-page)',
      overflow:      'hidden',
    }}>


{/* Player: incoming keeper roll request pills */}
      {myRole !== 'keeper' && (
        <RollRequestPill
          requests={rollRequests}
          myCharFullData={myCharFullData}
          onRoll={handlePillRoll}
          onDismiss={handlePillDismiss}
        />
      )}

      {/* Keeper: skill/stat picker popover */}
      {keeperRollPicker && (
        <KeeperRollPicker
          charData={keeperRollPicker.charData}
          anchorRect={keeperRollPicker.anchorRect}
          allMode={keeperRollPicker.allMode}
          onPick={handlePickerSelect}
          onClose={() => setKeeperRollPicker(null)}
        />
      )}

{/* Skill roll popup */}
      {rollPopup && (
        <div style={{
          position: 'fixed',
          top:      rollPopup.anchorRect.top - 8,
          left:     rollPopup.anchorRect.left + rollPopup.anchorRect.width / 2,
          zIndex:   200,
          transform:'translateX(-50%) translateY(-100%)',
        }}>
          <SkillRollPopup
            label={rollPopup.label}
            value={rollPopup.value}
            defaultMode={rollPopup.mode}
            onRoll={(mode) => handlePopupRoll(mode, rollPopup.label, rollPopup.value)}
            onClose={() => setRollPopup(null)}
          />
        </div>
      )}

      {/* Floating notes window — popped out from the sub-nav (both roles) */}
      <NotesWindow
        windowState={notesState}
        onWindowStateChange={setNotesState}
        contextTagType="session"
        contextTag={campaign?.name}
      />

      <NavBar activeTab="campaign" />

      <div className="animate-fade" style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', '--room-font-scale': roomFontScale, zoom: roomFontScale }}>

      {/* Room header */}
      <div style={{
        padding:       '8px 20px',
        borderBottom:  '1px solid var(--border-main)',
        background:    'var(--bg-nav)',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        flexShrink:    0,
      }}>
        <div>
          <h2 style={{
            fontFamily:'var(--font-serif)', fontSize:'17px',
            color:'var(--text-primary)', margin:0,
          }}>
            {campaign?.name}
          </h2>
          <p style={{ fontSize:'12px', color:'var(--text-muted)', margin:0, display:'flex', gap:'8px', alignItems:'center' }}>
            <span>You are the</span>
            <span style={{
              background:'var(--bg-section-hd)',
              border:'1px solid var(--border-main)',
              borderRadius:'4px', padding:'1px 6px',
              fontSize:'11px', color:'var(--text-primary)',
            }}>
              {myRole}
            </span>
            <span style={{ color: connected && inRoom ? '#22c55e' : 'var(--text-faint)' }}>
              ● {connected && inRoom ? 'Connected' : 'Connecting...'}
            </span>
          </p>
        </div>

        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          {/* I'm Not Here toggle */}
          <button
            onClick={handleToggleAfk}
            style={{
              padding:      '6px 14px',
              borderRadius: '8px',
              border:       '1px solid var(--border-main)',
              background:   afk ? 'var(--bg-section-hd)' : 'transparent',
              color:        afk ? '#EAB308' : 'var(--text-muted)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '13px',
              cursor:       'pointer',
              transition:   'all 0.15s ease',
            }}
          >
            {afk ? "I'm Here" : "I'm Not Here"}
          </button>

          {/* Leave Table */}
          <button
            onClick={handleLeave}
            style={{
              padding:      '6px 14px',
              borderRadius: '8px',
              border:       '1px solid var(--danger)',
              background:   'transparent',
              color:        'var(--danger)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '13px',
              cursor:       'pointer',
              transition:   'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Leave Table
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Left: sub-nav + character sheet OR Keeper player cards */}
        {(() => {
          const playerTabs = [
            { id: 'main',     label: 'Sheet' },
            { id: 'handouts', label: 'Handouts', badge: newHandoutCount },
          ];
          const keeperTabs = [
            { id: 'main',     label: 'Players' },
            { id: 'handouts', label: 'Handouts' },
          ];
          const tabs = myRole === 'keeper' ? keeperTabs : playerTabs;

          const comingSoonPanel = (
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              height:         '100%',
              gap:            '0.75rem',
              color:          'var(--text-faint)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>
                construction
              </span>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                Coming in a future update
              </p>
            </div>
          );

          return (
            <div style={{
              width:         leftWidth + 'px',
              minWidth:      '480px',
              flexShrink:    0,
              display:       'flex',
              flexDirection: 'column',
              background:    'var(--bg-page)',
              overflow:      'hidden',
              '--sheet-font-scale': sheetFontScale,
            }}>
              <RoomSubNav
                tabs={tabs}
                activeTab={subTab}
                onTabChange={(tab) => {
                  setSubTab(tab);
                  if (tab === 'handouts') setNewHandoutCount(0);
                }}
                rightSlot={
                  <button
                    onClick={() => {
                      if (notesState === 'closed') setNotesState('bubble');
                      else if (notesState === 'bubble') setNotesState('full');
                      else setNotesState('bubble');
                    }}
                    title="Pop out notes"
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '5px',
                      padding:      '4px 12px',
                      borderRadius: '999px',
                      border:       notesState !== 'closed' ? '1px solid var(--accent)' : '1px solid var(--border-main)',
                      background:   notesState !== 'closed' ? 'var(--accent-bg)' : 'transparent',
                      color:        notesState !== 'closed' ? 'var(--accent)' : 'var(--text-muted)',
                      fontFamily:   'var(--font-sans)',
                      fontSize:     '12px',
                      fontWeight:   500,
                      cursor:       'pointer',
                      transition:   'all 0.15s ease',
                      whiteSpace:   'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (notesState === 'closed') {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.color = 'var(--accent)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (notesState === 'closed') {
                        e.currentTarget.style.borderColor = 'var(--border-main)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }
                    }}
                  >
                    Notes
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
                  </button>
                }
              />

              <div key={subTab} className="animate-fade" style={{
                flex:          1,
                overflowY:     subTab === 'notes' ? 'hidden' : 'auto',
                overscrollBehavior: 'contain',
                padding:       subTab === 'main' && myRole === 'keeper' && keeperSheetModal ? 0 : subTab === 'main' ? '12px' : 0,
                display:       subTab === 'notes' ? 'flex' : undefined,
                flexDirection: subTab === 'notes' ? 'column' : undefined,
              }}>
                {subTab === 'notes' && myRole === 'keeper' ? (
                  <NotesPane contextTagType="session" contextTag={campaign?.name} />
                ) : subTab === 'handouts' && myRole === 'keeper' ? (
                  <KeeperHandoutPanel campaignUuid={campaign?.uuid} />
                ) : subTab === 'handouts' ? (
                  <PlayerHandoutTab
                    sharedHandouts={sharedHandouts}
                    onView={(handout) => setViewingHandout(handout)}
                  />
                ) : subTab !== 'main' ? comingSoonPanel : myRole === 'keeper' ? (
                  keeperSheetModal ? (
                    <>
                      <button
                        onClick={() => setKeeperSheetModal(null)}
                        style={{
                          position:     'sticky',
                          top:          0,
                          zIndex:       10,
                          display:      'flex',
                          alignItems:   'center',
                          gap:          '4px',
                          width:        '100%',
                          background:   'var(--bg-page)',
                          border:       'none',
                          borderBottom: '1px solid var(--border-main)',
                          cursor:       'pointer',
                          color:        'var(--text-muted)',
                          fontFamily:   'var(--font-sans)',
                          fontSize:     '12px',
                          padding:      '10px 12px',
                          boxSizing:    'border-box',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <span className="icon icon-sm">arrow_back</span>
                        Back to Investigators
                      </button>
                      {keeperSheetModal._error ? (
                        <div style={{ padding: '40px', textAlign: 'center',
                                      color: 'var(--text-faint)', fontStyle: 'italic' }}>
                          Could not load character sheet.
                        </div>
                      ) : (
                        <div style={{ padding: '12px' }}>
                          <ReadOnlySheet charData={keeperSheetModal} />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'space-between',
                        marginBottom:   '10px',
                      }}>
                        <div style={{
                          fontSize:      '11px',
                          fontWeight:    '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color:         'var(--text-muted)',
                          fontFamily:    'var(--font-sans)',
                        }}>
                          Investigators ({members.filter(m => m.role === 'player').length})
                        </div>
                        {members.some(m => m.role === 'player' && m.character_uuid) && (
                          <button
                            onClick={e => handleOpenAllRollPicker(e.currentTarget.getBoundingClientRect())}
                            title="Request a roll from all players"
                            style={{
                              display:      'flex',
                              alignItems:   'center',
                              gap:          '4px',
                              padding:      '3px 8px',
                              borderRadius: '6px',
                              border:       '1px solid var(--border-main)',
                              background:   'none',
                              color:        'var(--text-muted)',
                              fontFamily:   'var(--font-sans)',
                              fontSize:     '11px',
                              cursor:       'pointer',
                              transition:   'all 0.1s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          >
                            <span className="icon icon-sm">casino</span>
                            Request All
                          </button>
                        )}
                      </div>
                      {members
                        .filter(m => m.role === 'player')
                        .map(member => {
                          const memberPending = Object.values(pendingRollReqs).filter(
                            p => p.memberId === member.id
                          );
                          return (
                            <KeeperPlayerCard
                              key={member.id}
                              member={member}
                              onOpenSheet={handleOpenKeeperSheet}
                              onRequestRoll={handleOpenRollPicker}
                              pendingRequests={memberPending}
                              onCancelRequest={handleCancelRollRequest}
                            />
                          );
                        })
                      }
                      {members.filter(m => m.role === 'player').length === 0 && (
                        <div style={{
                          fontSize:  '13px',
                          color:     'var(--text-faint)',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          padding:   '24px 0',
                        }}>
                          No players have joined yet.
                        </div>
                      )}
                    </>
                  )
                ) : myCharFullData ? (
                  <SessionSheet
                    charData={myCharFullData}
                    characterId={myCharacter?.uuid}
                    advMode={advMode}
                    disMode={disMode}
                    onStatRoll={(label, value, mode) => handlePopupRoll(mode, label, value)}
                    onWeaponAttack={handleWeaponAttack}
                    onStatBlur={handleStatBlur}
                  />
                ) : (
                  <div style={{
                    fontSize:  '13px',
                    color:     'var(--text-faint)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding:   '24px 16px',
                  }}>
                    No investigator registered.<br/>
                    Select one in the Players tab →
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Resize handle */}
        <div
          onMouseDown={handlePanelDragStart}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--border-main)'}
          style={{
            width:      '4px',
            flexShrink: 0,
            background: 'var(--border-main)',
            cursor:     'col-resize',
            transition: 'background 0.15s ease',
            zIndex:     10,
          }}
        />

        {/* Middle: roll feed */}
        <div style={{
          flex:          1,
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          background:    'var(--bg-page)',
        }}>
          <RollFeed
            messages={messages}
            currentUserId={user?.id}
            myRole={myRole}
            onDeleteMessage={handleDeleteMessage}
            onDismissOptimistic={handleDismissOptimistic}
            hasMore={hasMoreHistory}
            loadingOlder={loadingOlder}
            onLoadOlder={loadOlderMessages}
            prependingRef={prependingRef}
            scrollCaptureFnRef={scrollCaptureFnRef}
            pinToBottomRef={pinFeedToBottomRef}
          />

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div style={{
              padding:'4px 16px 8px', fontSize:'12px',
              color:'var(--text-faint)', fontStyle:'italic',
              fontFamily:'var(--font-sans)',
            }}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}

          {/* Dice row */}
          <DiceRow
            advMode={advMode} disMode={disMode}
            rollVisibility={rollVisibility}
            isRolling={rolling}
            rollingDie={rollingDie}
            onToggleAdv={handleToggleAdv}
            onToggleDis={handleToggleDis}
            onToggleVisibility={() => setRollVisibility(p => p === 'everyone' ? 'only_me' : 'everyone')}
            onRoll={(notation, shiftKey) => {
              if (rolling) return;          // anti-double-click guard
              const isD100 = notation.toLowerCase().includes('d100');
              if (shiftKey && isD100 && memeEnabledRef.current) {
                [{ x: 0.2, y: 0.6 }, { x: 0.8, y: 0.6 }].forEach(origin =>
                  confetti({ particleCount: 100, spread: 80, origin,
                    colors: ['#3B6D11', '#C0DD97', '#F59E0B'] })
                );
                forceMemeNextRollRef.current = true;
              }
              if (!socket || !inRoom) return;
              setRolling(true);
              setRollingDie(notation);      // ring spins on the clicked die
              clearTimeout(rollingTimeoutRef.current);
              rollingTimeoutRef.current = setTimeout(() => {
                setRolling(false);
                setRollingDie(null);
              }, 8000);
              if (rollVisibility === 'only_me') {
                apiClient.post('/campaigns/' + uuid + '/roll/hidden', { notation })
                  .then(res => {
                    const msg = {
                      ...res.data.message,
                      user_id:  user?.id,
                      username: user?.username,
                      _hidden:  true,
                    };
                    if (shiftKey && isD100) {
                      msg._forceMeme = true;
                      forceMemeNextRollRef.current = false;
                    }
                    setMessages(prev => [...prev, msg]);
                  })
                  .catch(() => {})
                  .finally(() => {
                    // Hidden rolls produce no receive_message echo — clear here.
                    setRolling(false);
                    setRollingDie(null);
                    clearTimeout(rollingTimeoutRef.current);
                  });
              } else {
                socket.emit('roll_dice', {
                  campaignId:    campaign?.id,
                  notation,
                  characterName: myCharacter?.name || null,
                });
                // receive_message echo (type roll) will clear rolling.
              }
            }}
          />

          {/* Chat input */}
          <ChatInput
            text={text}
            setText={(val) => {
              setText(val);
              // Auto-clear AFK when typing
              if (afk && val.length > 0) handleToggleAfk();
            }}
            onSend={handleSend}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            onResize={() => requestAnimationFrame(() => pinFeedToBottomRef.current?.())}
            disabled={!connected || !inRoom}
            attachedFiles={attachedFiles}
            onFileSelect={handleFileSelect}
            onClearAttachment={handleClearAttachment}
            isSending={isSending}
            uploadError={uploadError}
            onClearUploadError={() => setUploadError(null)}
          />
        </div>

        {/* Right: vertical tab sidebar */}
        <RoomSidebar
          activeTab={sidebarOpen ? sidebarTab : 'chat'}
          onTabChange={handleTabChange}
          members={members}
          onlineUsers={onlineUsers}
          myRole={myRole}
          myCharacter={myCharacter}
          myCharacters={myCharacters}
          onChangeCharacter={handleChangeCharacter}
          campaignId={uuid}
        />
      </div>

      </div>{/* end animate-fade-rise wrapper */}

      {viewingHandout && (
        <HandoutViewer
          handout={viewingHandout}
          onClose={() => setViewingHandout(null)}
        />
      )}

    </div>
  );
}
