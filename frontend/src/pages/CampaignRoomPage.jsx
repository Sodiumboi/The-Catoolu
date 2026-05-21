import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar       from '../components/NavBar';
import MessageList  from '../components/MessageList';
import ChatInput    from '../components/ChatInput';
import OnlineSidebar from '../components/OnlineSidebar';
import DicePanel     from '../components/DicePanel';
import { useSocket } from '../context/SocketContext';
import { useAuth }   from '../context/AuthContext';
import { useCampaign }      from '../context/CampaignContext';
import { useNotifications } from '../context/NotificationContext';
import apiClient     from '../api/client';


function SkillPicker({ skills, onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 12);

  return (
    <div style={{
      position:     'absolute',
      bottom:       '100%',
      left:         0,
      right:        0,
      background:   'var(--bg-card)',
      border:       '1px solid var(--border-main)',
      borderRadius: '10px 10px 0 0',
      boxShadow:    'var(--shadow-dropdown)',
      zIndex:       50,
      overflow:     'hidden',
      maxHeight:    '260px',
      display:      'flex',
      flexDirection:'column',
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-main)' }}>
        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
          style={{
            width:        '100%',
            padding:      '6px 10px',
            borderRadius: '6px',
            border:       '1px solid var(--border-input)',
            background:   'var(--bg-input)',
            color:        'var(--text-primary)',
            fontFamily:   'var(--font-sans)',
            fontSize:     '13px',
            outline:      'none',
            boxSizing:    'border-box',
          }}
        />
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-faint)' }}>
            No skills found
          </div>
        ) : (
          filtered.map((skill, i) => (
            <button
              key={i}
              onClick={() => onSelect(skill)}
              style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '8px 16px',
                background:     'transparent',
                border:         'none',
                borderBottom:   '1px solid var(--border-main)',
                cursor:         'pointer',
                fontFamily:     'var(--font-sans)',
                fontSize:       '13px',
                color:          'var(--text-primary)',
                textAlign:      'left',
                transition:     'background 0.1s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>{skill.name}</span>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{skill.value}</span>
                <span style={{ color: 'var(--text-faint)' }}>
                  ½{Math.floor(parseInt(skill.value) / 2)}
                  {'  '}
                  ⅕{Math.floor(parseInt(skill.value) / 5)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      <div style={{
        padding:    '6px 12px',
        borderTop:  '1px solid var(--border-main)',
        fontSize:   '11px',
        color:      'var(--text-faint)',
        fontStyle:  'italic',
        background: 'var(--bg-section-hd)',
      }}>
        Select a skill to roll against it · Esc to close
      </div>
    </div>
  );
}

export default function CampaignRoomPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { socket, connected } = useSocket();
  const { user }       = useAuth();
  const { enterRoom, leaveRoom }             = useCampaign();
  const { setCurrentRoom, clearCurrentRoom } = useNotifications();

  const [campaign,     setCampaign]     = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [members,      setMembers]      = useState([]);
  const [onlineUsers,  setOnlineUsers]  = useState([]);
  const [myRole,       setMyRole]       = useState(null);
  const [typingUsers,  setTypingUsers]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [inRoom,       setInRoom]       = useState(false);

  const [text,         setText]         = useState('');
  const [advMode,      setAdvMode]       = useState(false);
  const [disMode,      setDisMode]       = useState(false);
  const [skillContext, setSkillContext]  = useState(null);
  const [allSkills,    setAllSkills]     = useState([]);

  const [pickerDismissed, setPickerDismissed] = useState(false);
  const [myCharacters,    setMyCharacters]    = useState([]);

  // ── Load campaign + message history ────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [campRes, msgRes] = await Promise.all([
          apiClient.get('/campaigns/' + id),
          apiClient.get('/campaigns/' + id + '/messages?limit=50'),
        ]);
        setCampaign(campRes.data.campaign);
        setMembers(campRes.data.campaign.members);
        setMyRole(campRes.data.campaign.my_role);
        setMessages(msgRes.data.messages);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? 'You are not a member of this campaign.'
            : 'Could not load campaign.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Load investigator skills for skill picker ─────────────────
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const res = await apiClient.get('/characters');
        const chars = res.data.characters;
        if (chars && chars.length > 0) {
          const skillMap = new Map();
          chars.forEach(char => {
            const skills = char.sheet_data?.Investigator?.Skills?.Skill || [];
            skills.forEach(s => {
              if (s.name && s.value && parseInt(s.value) > 0) {
                if (!skillMap.has(s.name) || parseInt(s.value) > parseInt(skillMap.get(s.name).value)) {
                  skillMap.set(s.name, { name: s.name, value: s.value });
                }
              }
            });
          });
          setAllSkills(Array.from(skillMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch {
        // Skills are optional — fail silently
      }
    };
    loadSkills();
  }, []);

  // ── Join Socket.io room when connected ───────────────────────
  useEffect(() => {
    if (!socket || !connected || loading || error) return;

    socket.emit('join_campaign', parseInt(id));

    // Named handlers so socket.off() only removes these specific listeners
    // (calling socket.off(event) without a handler removes ALL listeners for
    // that event — including the global one in NotificationContext)
    const onJoined = (data) => {
      setOnlineUsers(data.onlineUsers);
      setInRoom(true);
      enterRoom(parseInt(id), campaign?.name || 'Campaign');
      setCurrentRoom(parseInt(id));
    };
    const onMessage     = (msg)          => setMessages(prev => [...prev, msg]);
    const onUserJoined  = (u)            => setOnlineUsers(prev => prev.find(x => x.id === u.id) ? prev : [...prev, u]);
    const onUserLeft    = (u)            => setOnlineUsers(prev => prev.filter(x => x.id !== u.id));
    const onTypingStart = ({ username }) => setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
    const onTypingStop  = ({ username }) => setTypingUsers(prev => prev.filter(u => u !== username));
    const onError       = ({ message })  => console.error('Socket error:', message);

    socket.on('joined',         onJoined);
    socket.on('receive_message',onMessage);
    socket.on('user_joined',    onUserJoined);
    socket.on('user_left',      onUserLeft);
    socket.on('typing_start',   onTypingStart);
    socket.on('typing_stop',    onTypingStop);
    socket.on('error',          onError);

    return () => {
      socket.off('joined',         onJoined);
      socket.off('receive_message',onMessage);
      socket.off('user_joined',    onUserJoined);
      socket.off('user_left',      onUserLeft);
      socket.off('typing_start',   onTypingStart);
      socket.off('typing_stop',    onTypingStop);
      socket.off('error',          onError);
    };
  }, [socket, connected, loading, error, id]);

  // ── Clear notification room tracking on unmount ─────────────
  // leaveRoom() is NOT called here — it's only called when the user clicks
  // "Leave Table", so the NavBar pill stays visible while browsing other pages
  useEffect(() => {
    return () => { clearCurrentRoom(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load user's characters for the picker ────────────────────
  useEffect(() => {
    const loadChars = async () => {
      try {
        const res = await apiClient.get('/characters');
        setMyCharacters(res.data.characters || []);
      } catch { /* silent */ }
    };
    loadChars();
  }, []);

  // Derive character + picker visibility from campaign data (no setState-in-effect)
  const myMemberData  = campaign?.members?.find(m => m.id === user?.id);
  const myCharacter   = myMemberData?.character_id ? {
    id:         myMemberData.character_id,
    name:       myMemberData.character_name,
    occupation: myMemberData.character_occupation,
  } : null;
  const showCharPicker = !!(campaign && !myCharacter && myCharacters.length > 0 && !pickerDismissed);

  const handleRegisterCharacter = async (character) => {
    try {
      await apiClient.put('/campaigns/' + id + '/character', {
        character_id: character?.id || null,
      });
      // Update local campaign members so myCharacter re-derives correctly
      setCampaign(prev => ({
        ...prev,
        members: prev.members.map(m =>
          m.id === user?.id
            ? { ...m,
                character_id:         character?.id         || null,
                character_name:       character?.name       || null,
                character_occupation: character?.occupation || null }
            : m
        ),
      }));
      setPickerDismissed(true);
    } catch { /* silent */ }
  };

  const showSkills = (text.trim() === '/roll' || text.trim() === '/roll ') && allSkills.length > 0;

  // ── Send a message or roll ────────────────────────────────────
  const handleSend = (inputText) => {
    if (!socket || !inRoom) return;

    const trimmed = inputText.trim();
    const isRoll  = trimmed.startsWith('/roll');

    if (isRoll) {
      let notation = trimmed.replace(/^\/roll\s*/i, '').trim();

      if (notation && !notation.endsWith('adv') && !notation.endsWith('dis')) {
        if (advMode) notation = notation + 'adv';
        if (disMode) notation = notation + 'dis';
      }

      if (!notation) notation = advMode ? '1d100adv' : disMode ? '1d100dis' : '1d100';

      socket.emit('roll_dice', {
        campaignId: parseInt(id),
        notation,
        skillName:  skillContext?.name  || null,
        skillValue: skillContext?.value || null,
      });

      setSkillContext(null);
    } else {
      socket.emit('send_message', {
        campaignId: parseInt(id),
        content:    trimmed,
      });
    }
  };

  // ── Typing handlers ───────────────────────────────────────────
  const handleTyping = () => {
    socket?.emit('typing', { campaignId: parseInt(id) });
  };

  const handleStopTyping = () => {
    socket?.emit('stop_typing', { campaignId: parseInt(id) });
  };

  const handleToggleAdv = () => {
    setAdvMode(prev => !prev);
    setDisMode(false);
  };

  const handleToggleDis = () => {
    setDisMode(prev => !prev);
    setAdvMode(false);
  };

  const handleSkillSelect = (skill) => {
    setSkillContext(skill);
    const suffix = advMode ? 'adv' : disMode ? 'dis' : '';
    setText('/roll 1d100' + suffix);
  };

  // ── Render ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight:  '100vh',
      background: 'var(--bg-page)',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color:      'var(--text-muted)',
      fontFamily: 'var(--font-sans)',
    }}>
      Loading campaign...
    </div>
  );

  if (error) return (
    <div style={{
      minHeight:  '100vh',
      background: 'var(--bg-page)',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'var(--font-sans)',
    }}>
      <p style={{ color: 'var(--danger)' }}>{error}</p>
      <a href="/campaign" style={{ color: 'var(--accent)', fontSize: '14px' }}>
        ← Back to Campaigns
      </a>
    </div>
  );

  return (
    <div style={{
      height:        '100vh',
      display:       'flex',
      flexDirection: 'column',
      background:    'var(--bg-page)',
    }}>
      <NavBar activeTab="campaign" />

      {/* Room header */}
      <div style={{
        padding:      '10px 20px',
        borderBottom: '1px solid var(--border-main)',
        background:   'var(--bg-nav)',
        display:      'flex',
        alignItems:   'center',
        justifyContent:'space-between',
        flexShrink:   0,
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize:   '17px',
            color:      'var(--text-primary)',
            margin:     0,
          }}>
            {campaign?.name}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            {myRole === 'keeper' ? '🎭 You are the Keeper' : '⚔️ Player'}
            {' · '}
            <span style={{ color: connected && inRoom ? '#22c55e' : 'var(--text-faint)' }}>
              {connected && inRoom ? '● Connected' : '○ Connecting...'}
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            socket?.emit('leave_campaign', { campaignId: parseInt(id) });
            leaveRoom();
            clearCurrentRoom();
            navigate('/campaign');
          }}
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
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          Leave Table
        </button>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Chat area */}
        <div style={{
          flex:          1,
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          background:    'var(--bg-page)',
        }}>
          {/* Messages */}
          <MessageList messages={messages} currentUserId={user?.id} />

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div style={{
              padding:   '4px 20px 8px',
              fontSize:  '12px',
              color:     'var(--text-faint)',
              fontStyle: 'italic',
            }}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}

          {/* Dice panel */}
          <DicePanel
            onRoll={notation => {
              setText('/roll ' + notation);
              if (!showSkills) {
                setTimeout(() => {
                  handleSend('/roll ' + notation);
                  setText('');
                }, 50);
              }
            }}
            advMode={advMode}
            disMode={disMode}
            onToggleAdv={handleToggleAdv}
            onToggleDis={handleToggleDis}
          />

          {/* Skill picker + chat input wrapper */}
          <div style={{ position: 'relative' }}>
            {showSkills && (
              <SkillPicker
                skills={allSkills}
                onSelect={handleSkillSelect}
                onClose={() => setText('')}
              />
            )}
            <ChatInput
              text={text}
              setText={setText}
              onSend={handleSend}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
              disabled={!connected || !inRoom}
              skillContext={skillContext}
            />
          </div>
        </div>

        {/* Sidebar */}
        <OnlineSidebar
          members={members}
          onlineUsers={onlineUsers}
          myRole={myRole}
          inviteCode={campaign?.invite_code}
        />
      </div>
    </div>
  );
}