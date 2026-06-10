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
import apiClient           from '../api/client';
import SessionSheet        from '../components/SessionSheet';
import ReadOnlySheet       from '../components/ReadOnlySheet';
import RoomSubNav          from '../components/RoomSubNav';

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
  const [leftWidth,     setLeftWidth]     = useState(() => {
    const saved = parseInt(localStorage.getItem('sheet-panel-width'));
    return saved && saved >= 480 && saved <= 640 ? saved : 480;
  });
  // rollPopup: { label, value, mode, top, left }
  const forceMemeNextRollRef  = useRef(false);
  const historyLoadedRef      = useRef(false);
  const isDraggingRef         = useRef(false);
  const dragStartXRef         = useRef(0);
  const dragStartWidthRef     = useRef(400);

  // ── Load campaign + messages ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [campRes, msgRes, charRes] = await Promise.all([
          apiClient.get('/campaigns/' + uuid),
          apiClient.get('/campaigns/' + uuid + '/messages?limit=50'),
          apiClient.get('/characters'),
        ]);

        const camp = campRes.data.campaign;
        setCampaign(camp);
        setMembers(camp.members || []);
        setMyRole(camp.my_role);
        setMessages(msgRes.data.messages);
        historyLoadedRef.current = true;
        setMyCharacters(charRes.data.characters || []);

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

      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, withMeme ? { ...msg, _forceMeme: true } : msg];
      });

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
          }
        } catch {}
      }

      if (msg.type === 'roll') {
        const raw = typeof msg.content === 'string'
          ? (() => { try { return JSON.parse(msg.content); } catch { return null; } })()
          : msg.content;
        if (raw?.notation?.toLowerCase().includes('d100') &&
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

    socket.on('joined',           onJoined);
    socket.on('receive_message',  onMessage);
    socket.on('user_joined',      onUserJoined);
    socket.on('user_left',        onUserLeft);
    socket.on('typing_start',     onTypingStart);
    socket.on('typing_stop',      onTypingStop);
    socket.on('afk_change',       onAfkChange);
    socket.on('character_change', onCharacterChange);

    return () => {
      socket.off('joined',           onJoined);
      socket.off('receive_message',  onMessage);
      socket.off('user_joined',      onUserJoined);
      socket.off('user_left',        onUserLeft);
      socket.off('typing_start',     onTypingStart);
      socket.off('typing_stop',      onTypingStop);
      socket.off('afk_change',       onAfkChange);
      socket.off('character_change', onCharacterChange);
    };
  }, [socket, connected, loading, error, uuid, campaign]);

  useEffect(() => {
    if (campaign && inRoom) {
      enterRoom(campaign?.id, campaign.name, campaign?.uuid);
    }
  }, [campaign, inRoom]);

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

  // ── Send handler ──────────────────────────────────────────────
  const handleSend = async (inputText, shiftKey = false) => {
    if (!socket || !inRoom) return;

    if (afk) handleToggleAfk();

    const trimmed = inputText.trim();
    const isRoll  = trimmed.startsWith('/roll') || trimmed.startsWith('/r ') || trimmed === '/r';

    if (isRoll) {
      let notation = trimmed.replace(/^\/(roll|r)\s*/i, '').trim();
      if (!notation) notation = advMode ? '1d100adv' : disMode ? '1d100dis' : '1d100';
      else if (!notation.endsWith('adv') && !notation.endsWith('dis')) {
        if (advMode) notation += 'adv';
        if (disMode) notation += 'dis';
      }

      const isD100 = notation.toLowerCase().includes('d100');
      if (shiftKey && isD100) {
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
      } else {
        socket.emit('roll_dice', {
          campaignId:    campaign?.id,
          notation,
          skillName:     null,
          skillValue:    null,
          characterName: myCharacter?.name || null,
        });
      }
    } else {
      socket.emit('send_message', {
        campaignId:    campaign?.id,
        content:       trimmed,
        characterName: myCharacter?.name || null,
      });
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
    const suffix   = mode === 'adv' ? 'adv' : mode === 'dis' ? 'dis' : '';
    const notation = '1d100' + suffix;

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
      }).catch(() => {});
    } else {
      socket.emit('roll_dice', {
        campaignId:    campaign?.id,
        notation,
        skillName:     label,
        skillValue:    value,
        characterName: myCharacter?.name || null,
      });
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

      <NavBar activeTab="campaign" />

      <div className="animate-fade" style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>

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
            { id: 'main',  label: 'Sheet' },
            { id: 'notes', label: 'Notes', comingSoon: true },
          ];
          const keeperTabs = [
            { id: 'main',     label: 'Players' },
            { id: 'handouts', label: 'Handouts', comingSoon: true },
            { id: 'notes',    label: 'Notes',    comingSoon: true },
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
            }}>
              <RoomSubNav tabs={tabs} activeTab={subTab} onTabChange={setSubTab} />

              <div key={subTab} className="animate-fade" style={{
                flex:      1,
                overflowY: 'auto',
                padding:   subTab === 'main' && myRole === 'keeper' && keeperSheetModal ? 0 : subTab === 'main' ? '12px' : 0,
              }}>
                {subTab !== 'main' ? comingSoonPanel : myRole === 'keeper' ? (
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
                        fontSize:      '11px',
                        fontWeight:    '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color:         'var(--text-muted)',
                        marginBottom:  '10px',
                        fontFamily:    'var(--font-sans)',
                      }}>
                        Investigators ({members.filter(m => m.role === 'player').length})
                      </div>
                      {members
                        .filter(m => m.role === 'player')
                        .map(member => (
                          <KeeperPlayerCard key={member.id} member={member} onOpenSheet={handleOpenKeeperSheet} />
                        ))
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
            onToggleAdv={handleToggleAdv}
            onToggleDis={handleToggleDis}
            onToggleVisibility={() => setRollVisibility(p => p === 'everyone' ? 'only_me' : 'everyone')}
            onRoll={(notation, shiftKey) => {
              const isD100 = notation.toLowerCase().includes('d100');
              if (shiftKey && isD100) {
                [{ x: 0.2, y: 0.6 }, { x: 0.8, y: 0.6 }].forEach(origin =>
                  confetti({ particleCount: 100, spread: 80, origin,
                    colors: ['#3B6D11', '#C0DD97', '#F59E0B'] })
                );
                forceMemeNextRollRef.current = true;
              }
              if (!socket || !inRoom) return;
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
                  .catch(() => {});
              } else {
                socket.emit('roll_dice', {
                  campaignId:    campaign?.id,
                  notation,
                  characterName: myCharacter?.name || null,
                });
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
            disabled={!connected || !inRoom}
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

    </div>
  );
}
