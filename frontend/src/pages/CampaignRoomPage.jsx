import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import NavBar       from '../components/NavBar';
import MessageList  from '../components/MessageList';
import ChatInput    from '../components/ChatInput';
import OnlineSidebar from '../components/OnlineSidebar';
import DicePanel     from '../components/DicePanel';
import { useSocket } from '../context/SocketContext';
import { useAuth }   from '../context/AuthContext';
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
  const { socket, connected } = useSocket();
  const { user }       = useAuth();

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

    socket.on('joined', (data) => {
      setOnlineUsers(data.onlineUsers);
      setInRoom(true);
    });

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('user_joined', (user) => {
      setOnlineUsers(prev => {
        if (prev.find(u => u.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    socket.on('user_left', (user) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== user.id));
    });

    socket.on('typing_start', ({ username }) => {
      setTypingUsers(prev => {
        if (prev.includes(username)) return prev;
        return [...prev, username];
      });
    });

    socket.on('typing_stop', ({ username }) => {
      setTypingUsers(prev => prev.filter(u => u !== username));
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.off('joined');
      socket.off('receive_message');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('error');
    };
  }, [socket, connected, loading, error, id]);

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
        <a
          href="/campaign"
          style={{
            fontSize:       '13px',
            color:          'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          ← Campaigns
        </a>
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