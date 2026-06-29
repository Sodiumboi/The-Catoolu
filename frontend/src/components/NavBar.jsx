import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useCampaign } from '../context/CampaignContext';
import { useNavBarActions } from '../context/NavBarActionsContext';
import CustomDropdown from './ui/CustomDropdown';
import ToggleRow from './ui/ToggleRow';
import Slider from './ui/Slider';
import Tooltip from './ui/Tooltip';
import { useSocket } from '../context/SocketContext';
import logo from '../assets/vault-logo.png';
import BugReportModal from './BugReportModal';
import apiClient from '../api/client';

// ── Tab definitions ────────────────────────────────────────
// 'available' tabs are clickable, 'soon' tabs are greyed out
const TABS = [
  { id: 'investigators', label: 'Investigators', path: '/dashboard', status: 'available' },
  { id: 'keeper',        label: 'Keeper',        path: '/keeper',   status: 'available' },
  { id: 'campaign',      label: 'Campaign',      path: '/campaign', status: 'available' },
];

// NavBar remounts on every page — these carry state across remounts.
let _lastPillBounds = null;
// Maintenance pill: persists so the pill stays visible on navigation while maintenance is on.
let _maintState = { mounted: false, visible: false, message: '' };


export default function NavBar({ activeTab = 'investigators' }) {
  const { user, logout }          = useAuth();
  const { theme }                 = useTheme();
  const { activeRoom, leaveRoom } = useCampaign();
  const { onImport, onLeaveRoom } = useNavBarActions();
  const [roomPillHovered, setRoomPillHovered] = useState(false);
  const [roomMenuOpen,    setRoomMenuOpen]    = useState(false);
  const roomPillRef                           = useRef(null);
  // roomPill: keep the pill mounted through its exit animation. `data` is a
  // snapshot of activeRoom so content stays rendered while it fades out;
  // `visible` drives the opacity/scale transition.
  const [roomPill, setRoomPill] = useState(
    activeRoom ? { data: activeRoom, visible: true } : { data: null, visible: false }
  );
  const roomPillTimerRef                      = useRef(null);
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const [dropdownOpen,     setDropdownOpen]     = useState(false);
  const [bugModalOpen,     setBugModalOpen]     = useState(false);
  // maintPill: mounted = in DOM, visible = opacity 1 (drives fade transition).
  // Initialized from module-level cache so pill stays visible across page navigations.
  const [maintPill, setMaintPill] = useState(_maintState);
  const maintTimerRef             = useRef(null);
  const { socket } = useSocket();

  // Drive the Return-to-Room pill pop-in / pop-out animation off activeRoom.
  // Exit is the exact reverse of the entrance (scale + fade, matching easing).
  useEffect(() => {
    clearTimeout(roomPillTimerRef.current);
    if (activeRoom) {
      // If already showing, just refresh the data (no re-pop on page navigation).
      // Otherwise mount hidden (scaled down), then pop in on the next frame.
      setRoomPill(p => (p.visible && p.data
        ? { data: activeRoom, visible: true }
        : { data: activeRoom, visible: false }
      ));
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setRoomPill(p => (p.data ? { ...p, visible: true } : p))
        )
      );
    } else {
      // Pop out: keep the last snapshot mounted, scale/fade away, then unmount.
      setRoomPill(p => (p.data ? { ...p, visible: false } : p));
      roomPillTimerRef.current = setTimeout(
        () => setRoomPill({ data: null, visible: false }),
        240
      );
    }
    return () => clearTimeout(roomPillTimerRef.current);
  }, [activeRoom]);

  // Disconnect from the active room. When the room page is mounted it owns the
  // handler (it also navigates away); otherwise we do it ourselves so the pill
  // still disconnects from any page and vanishes immediately.
  const handlePillDisconnect = () => {
    if (onLeaveRoom) {
      onLeaveRoom();
    } else {
      if (activeRoom?.id) socket?.emit('leave_campaign', { campaignId: activeRoom.id });
      leaveRoom();
    }
  };

  const showMaintPill = (message) => {
    _maintState = { mounted: true, visible: true, message };
    clearTimeout(maintTimerRef.current);
    // If pill isn't mounted yet, start invisible and fade in; otherwise just update message.
    setMaintPill(p => p.mounted
      ? { mounted: true, visible: true, message }
      : { mounted: true, visible: false, message }
    );
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setMaintPill(p => ({ ...p, visible: true }))
      )
    );
  };

  const hideMaintPill = () => {
    _maintState = { mounted: false, visible: false, message: '' };
    clearTimeout(maintTimerRef.current);
    setMaintPill(p => ({ ...p, visible: false }));
    maintTimerRef.current = setTimeout(
      () => setMaintPill({ mounted: false, visible: false, message: '' }),
      350
    );
  };
  const [tooltip,      setTooltip]      = useState(null);
  const [panel,        setPanel]        = useState('main'); // 'main' | 'preferences'
  const dropdownRef                     = useRef(null);
  const fileInputRef                    = useRef(null);
  const containerRef                    = useRef(null);
  const tabRefs                         = useRef({});
  const [pillBounds, setPillBounds]     = useState(_lastPillBounds);

  // ── Close dropdown when clicking outside ────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setPanel('main'); // ← reset to main when closed
      }
      if (roomPillRef.current && !roomPillRef.current.contains(e.target)) {
        setRoomMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Close dropdown on route change ──────────────────────
  useEffect(() => {
    setDropdownOpen(false);
    setPanel('main'); // ← reset panel on navigation too
  }, [location.pathname]);

  // ── Maintenance socket events ────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // On (re)connect: sync with server state in case event was missed
    const onConnect = () => {
      fetch('/api/health')
        .then(r => r.json())
        .then(d => {
          if (d.status === 'maintenance') showMaintPill(d.message || '');
          else hideMaintPill();
        })
        .catch(() => {});
    };

    const onWarning    = ({ message }) => showMaintPill(message);
    const onCancelled  = ()            => hideMaintPill();
    const onDisconnect = ()            => hideMaintPill();

    socket.on('connect',               onConnect);
    socket.on('maintenance:warning',   onWarning);
    socket.on('maintenance:cancelled', onCancelled);
    socket.on('disconnect',            onDisconnect);

    // Already connected when this effect first runs
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect',               onConnect);
      socket.off('maintenance:warning',   onWarning);
      socket.off('maintenance:cancelled', onCancelled);
      socket.off('disconnect',            onDisconnect);
    };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive active tab from URL so navigation always triggers re-measurement
  const currentActiveTab = TABS.find(
    t => location.pathname === t.path || location.pathname.startsWith(t.path + '/')
  )?.id ?? activeTab;

  // Measure active tab position; persist across remounts so animation plays on navigation
  useEffect(() => {
    const el        = tabRefs.current[currentActiveTab];
    const container = containerRef.current;
    if (!el || !container) return;
    const r          = el.getBoundingClientRect();
    const c          = container.getBoundingClientRect();
    const borderLeft = parseFloat(getComputedStyle(container).borderLeftWidth) || 0;
    const b = { left: r.left - c.left - borderLeft, width: r.width };
    _lastPillBounds = b;
    setPillBounds(b);
  }, [currentActiveTab]);

  // ── Handlers ─────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFileChange = (e) => {
    if (onImport) onImport(e);
    e.target.value = '';
  };

  // Get user initials for avatar
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
  <>
    <nav style={{
      background:   'var(--bg-nav)',
      borderBottom: '1px solid var(--border-main)',
      boxShadow:    'var(--shadow-nav)',
      position:     'sticky',
      top:          0,
      zIndex:       50,
    }}>
      <div style={{
        padding:    '0 24px',
        display:    'flex',
        alignItems: 'center',
        height:     '56px',
        gap:        '24px',
        position:   'relative',
      }}>

        {/* ── Logo ── */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '8px',
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            padding:    '0',
            outline:    'none',
            flexShrink: 0,
            marginRight:'auto',
          }}
        >
          <img
            src={logo}
            alt="The Catoolu"
            style={{ width: '36px', height: '36px', objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize:   '18px',
              color:      'var(--color-primary-dark)',
              lineHeight: '1.1',
            }}>
              The Catoolu
            </div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize:   '11px',
              color:      'var(--text-muted)',
              lineHeight: '1.2',
            }}>
              welcome back, {user?.username}
            </div>
          </div>
        </button>
        {/* ── Tabs — absolutely centered regardless of logo/avatar width ── */}
        <div
          ref={containerRef}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '4px',
            position:     'absolute',
            left:         '50%',
            transform:    'translateX(-50%)',
            padding:      '3px',
            borderRadius: '999px',
            background:   'var(--bg-section-hd)',
            border:       '1px solid var(--border-main)',
          }}
        >
          {/* Single pill — slides across the container */}
          {pillBounds && (
            <div
              style={{
                position:      'absolute',
                top:           '3px',
                bottom:        '3px',
                left:          pillBounds.left,
                width:         pillBounds.width,
                borderRadius:  '999px',
                background:    'var(--accent-bg)',
                border:        '1.5px solid var(--color-primary)',
                zIndex:        0,
                pointerEvents: 'none',
                transition:    'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )}

          {TABS.map(tab => {
            const isActive = currentActiveTab === tab.id;
            const isSoon   = tab.status === 'soon';

            return (
              <div key={tab.id} style={{ position: 'relative' }}>
                <button
                  ref={el => { tabRefs.current[tab.id] = el; }}
                  onClick={() => !isSoon && navigate(tab.path)}
                  onMouseEnter={() => {
                    if (isSoon) setTooltip({ id: tab.id, label: tab.version });
                  }}
                  onMouseLeave={() => {
                    setTooltip(null);
                  }}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '6px',
                    padding:      '5px 14px',
                    borderRadius: '999px',
                    border:       '1.5px solid transparent',
                    background:   'transparent',
                    cursor:       isSoon ? 'default' : 'pointer',
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '13px',
                    fontWeight:   isActive ? '600' : '400',
                    color:        isActive
                      ? 'var(--accent)'
                      : isSoon
                        ? 'var(--text-faint)'
                        : 'var(--text-muted)',
                    whiteSpace:   'nowrap',
                    transition:   'color 0.15s ease',
                    position:     'relative',
                    zIndex:       1,
                  }}
                >
                  {tab.label}

                  {isSoon && (
                    <span className="icon icon-sm" style={{ opacity: 0.4 }}>lock</span>
                  )}
                </button>

                {/* Tooltip */}
                {tooltip?.id === tab.id && (
                  <div style={{
                    position:     'absolute',
                    top:          'calc(100% + 6px)',
                    left:         '50%',
                    transform:    'translateX(-50%)',
                    background:   'var(--text-primary)',
                    color:        'var(--bg-page)',
                    fontSize:     '11px',
                    padding:      '4px 10px',
                    borderRadius: '6px',
                    whiteSpace:   'nowrap',
                    pointerEvents:'none',
                    zIndex:       100,
                  }}>
                    Coming in {tab.version}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Right side — pushed to far right with marginLeft auto ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          flex:           1,
          justifyContent: 'flex-end',
        }}>

          {/* Maintenance warning pill — fades in/out, pulses like Return to Room */}
          {maintPill.mounted && <MaintPill pill={maintPill} />}

          {/* Return to Room pill — only shown when in a session */}
          {roomPill.data && (
            <div
              ref={roomPillRef}
              style={{
                position:        'relative',
                opacity:         roomPill.visible ? 1 : 0,
                transform:       roomPill.visible ? 'scale(1)' : 'scale(0.5)',
                transformOrigin: 'center right',
                pointerEvents:   roomPill.visible ? 'auto' : 'none',
                transition:      'opacity 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={() => setRoomPillHovered(true)}
              onMouseLeave={() => { setRoomPillHovered(false); }}
            >
              {/* Pill itself */}
              <div
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  borderRadius: '999px',
                  border:       '1.5px solid var(--color-primary)',
                  background:   roomMenuOpen ? 'var(--color-primary)' : 'var(--accent-bg)',
                  color:        roomMenuOpen ? '#ffffff' : 'var(--color-primary)',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '12px',
                  fontWeight:   '500',
                  animation:    roomMenuOpen ? 'none' : 'pulse 2s infinite',
                  overflow:     'hidden',
                  transition:   'background 0.15s ease, color 0.15s ease',
                  maxWidth:     '220px',
                }}
              >
                {/* Left: navigate to room */}
                <Tooltip content={'Return to ' + roomPill.data.name}>
                <button
                  onClick={() => { setRoomMenuOpen(false); navigate('/campaign/' + roomPill.data.uuid); }}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '6px',
                    padding:    '5px 10px 5px 14px',
                    background: 'transparent',
                    border:     'none',
                    color:      'inherit',
                    fontFamily: 'inherit',
                    fontSize:   'inherit',
                    fontWeight: 'inherit',
                    cursor:     'pointer',
                    minWidth:   0,
                  }}
                >
                  <span className="icon icon-sm">play_arrow</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {roomPill.data.name}
                  </span>
                </button>
                </Tooltip>

                {/* Right: chevron — morphs in on hover */}
                <button
                  onClick={() => setRoomMenuOpen(o => !o)}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    padding:        roomPillHovered || roomMenuOpen ? '5px 10px 5px 4px' : '5px 0',
                    background:     'transparent',
                    border:         'none',
                    borderLeft:     roomPillHovered || roomMenuOpen ? '1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)' : 'none',
                    color:          'inherit',
                    cursor:         'pointer',
                    width:          roomPillHovered || roomMenuOpen ? '28px' : '0px',
                    opacity:        roomPillHovered || roomMenuOpen ? 1 : 0,
                    overflow:       'hidden',
                    transition:     'width 0.2s ease, opacity 0.15s ease, padding 0.2s ease, border 0.15s ease',
                  }}
                  tabIndex={roomPillHovered || roomMenuOpen ? 0 : -1}
                >
                  <span className="icon" style={{ fontSize: '16px', transition: 'transform 0.2s ease', transform: roomMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    expand_more
                  </span>
                </button>
              </div>

              {/* Dropdown */}
              {roomMenuOpen && (
                <div style={{
                  position:     'absolute',
                  top:          'calc(100% + 6px)',
                  right:        0,
                  background:   'var(--bg-card)',
                  border:       '1px solid var(--border-main)',
                  borderRadius: '10px',
                  boxShadow:    '0 4px 16px rgba(0,0,0,0.12)',
                  padding:      '6px',
                  minWidth:     '140px',
                  zIndex:       1000,
                }}>
                  <button
                    onClick={() => { setRoomMenuOpen(false); handlePillDisconnect(); }}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '8px',
                      width:        '100%',
                      padding:      '8px 12px',
                      borderRadius: '6px',
                      border:       'none',
                      background:   'transparent',
                      color:        'var(--danger)',
                      fontFamily:   'var(--font-sans)',
                      fontSize:     '13px',
                      cursor:       'pointer',
                      textAlign:    'left',
                      transition:   'background 0.12s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="icon icon-sm">logout</span>
                    Disconnect from Room
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Import button */}
          {onImport && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '5px',
                  background:   'transparent',
                  border:       '1px solid var(--border-main)',
                  borderRadius: '8px',
                  padding:      '5px 12px',
                  cursor:       'pointer',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '13px',
                  color:        'var(--text-secondary)',
                  transition:   'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color       = 'var(--accent)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-main)';
                  e.currentTarget.style.color       = 'var(--text-secondary)';
                }}
              >
                📂 Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </>
          )}

          {/* Avatar */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{
                width:         '36px',
                height:        '36px',
                borderRadius:  '50%',
                background:    'var(--color-primary-light)',
                border:        `1.5px solid ${dropdownOpen ? 'var(--color-primary)' : 'var(--border-main)'}`,
                cursor:        'pointer',
                fontFamily:    'var(--font-sans)',
                fontSize:      '12px',
                fontWeight:    '500',
                color:         'var(--color-primary-dark)',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                transition:    'border-color 0.15s ease',
                overflow:      'hidden',
                padding:       0,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={e => {
                if (!dropdownOpen)
                  e.currentTarget.style.borderColor = 'var(--border-main)';
              }}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url.startsWith('http') ? user.avatar_url : (import.meta.env.VITE_API_URL || '') + user.avatar_url}
                  alt={user.username}
                  style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                />
              ) : initials}
            </button>

            {/* Dropdown */}
            {/* ── Dropdown ─────────────────────────── */}
              {dropdownOpen && (
                <div style={{
                  position:   'absolute',
                  top:        'calc(100% + 8px)',
                  right:      0,
                  width:      panel === 'main' ? '200px' : '240px',
                  background: 'var(--bg-card)',
                  border:     '1px solid var(--border-main)',
                  borderRadius:'12px',
                  boxShadow:  'var(--shadow-dropdown)',
                  overflow:   'hidden',
                  zIndex:     100,
                  transition: 'width 0.2s ease',
                }}>

                  {/* Panel content — key triggers remount + animation */}
                  <div
                    key={panel}
                    style={{
                      animation: panel === 'preferences'
                        ? 'slideInFromRight 0.18s ease'
                        : 'slideInFromLeft 0.18s ease',
                    }}
                  >
                    {panel === 'main' && (
                      <MainMenuPanel
                        user={user}
                        navigate={navigate}
                        setDropdownOpen={setDropdownOpen}
                        setPanel={setPanel}
                        handleLogout={handleLogout}
                        setBugModalOpen={setBugModalOpen}
                      />
                    )}
                    {panel === 'preferences' && (
                      <PreferencesPanel
                        theme={theme}
                        setPanel={setPanel}
                      />
                    )}
                    {panel === 'quota' && (
                      <QuotaPanel setPanel={setPanel} navigate={navigate} onClose={() => setDropdownOpen(false)} />
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </nav>

    {bugModalOpen && <BugReportModal onClose={() => setBugModalOpen(false)} />}
  </>
  );
}

// ── Maintenance pill with custom tooltip ──────────────────
function MaintPill({ pill }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '6px',
          padding:       '5px 14px',
          borderRadius:  '20px',
          border:        '1.5px solid var(--danger, #E24B4A)',
          background:    'var(--danger-bg, rgba(226,75,74,0.12))',
          color:         'var(--danger, #E24B4A)',
          fontFamily:    'var(--font-sans)',
          fontSize:      '12px',
          fontWeight:    500,
          cursor:        'help',
          userSelect:    'none',
          overflow:      'hidden',
          maxWidth:      '180px',
          animation:     pill.visible ? 'pulse-danger 2s infinite' : 'none',
          opacity:       pill.visible ? 1 : 0,
          transform:     pill.visible ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.95)',
          transition:    'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: pill.visible ? 'auto' : 'none',
        }}
      >
        <span className="icon icon-sm" style={{ flexShrink: 0 }}>warning</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Maintenance soon
        </span>
      </div>

      {/* Custom tooltip — faster than the native title attribute */}
      {hover && pill.message && (
        <div style={{
          position:     'absolute',
          top:          'calc(100% + 7px)',
          right:        0,
          background:   'var(--text-primary)',
          color:        'var(--bg-page)',
          fontSize:     '11px',
          lineHeight:   1.5,
          padding:      '6px 10px',
          borderRadius: '7px',
          whiteSpace:   'pre-wrap',
          maxWidth:     '240px',
          wordBreak:    'break-word',
          pointerEvents:'none',
          zIndex:       200,
          boxShadow:    '0 2px 8px rgba(0,0,0,0.18)',
        }}>
          {pill.message}
        </div>
      )}
    </div>
  );
}

// ── Dropdown menu item ─────────────────────────────────────
function DropdownItem({ label, icon, onClick, danger, chevron }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '8px',
        width:         '100%',
        padding:       '8px 10px',
        borderRadius:  '8px',
        background:    'transparent',
        border:        'none',
        cursor:        'pointer',
        fontFamily:    'var(--font-sans)',
        fontSize:      '13px',
        color:         danger ? 'var(--danger)' : 'var(--text-secondary)',
        textAlign:     'left',
        transition:    'background 0.1s ease, color 0.1s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'var(--danger-bg)' : 'var(--row-hover)';
        if (!danger) e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-secondary)';
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {chevron && (
        <span style={{
          fontSize:  '14px',
          color:     'var(--text-faint)',
          lineHeight: 1,
        }}>
          ›
        </span>
      )}
    </button>
  );
}

// ── Main menu panel ────────────────────────────────────────
function MainMenuPanel({
  user, navigate, setDropdownOpen, setPanel, handleLogout, setBugModalOpen
}) {
  return (
    <>
      {/* Username header */}
      <div style={{
        padding:      '12px 16px 10px',
        borderBottom: '1px solid var(--border-main)',
      }}>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '15px',
          color:      'var(--text-primary)',
        }}>
          {user?.username}
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '6px' }}>
        <DropdownItem
          label="Profile"
          icon="👤"
          onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
        />
        <DropdownItem
          label="About"
          icon={<span className="icon icon-sm">info</span>}
          onClick={() => { navigate('/about'); setDropdownOpen(false); }}
        />

        {/* Preferences — navigates to prefs panel */}
        <DropdownItem
          label="Preferences"
          icon={<span className="icon icon-sm">settings</span>}
          onClick={() => setPanel('preferences')}
          chevron
        />

        <DropdownItem
          label="Upload Quota"
          icon={<span className="icon icon-sm">cloud_upload</span>}
          onClick={() => setPanel('quota')}
          chevron
        />

        {user?.is_admin && (
          <DropdownItem
            label="Admin"
            icon={<span className="icon icon-sm">admin_panel_settings</span>}
            onClick={() => { navigate('/admin'); setDropdownOpen(false); }}
          />
        )}

        <DropdownItem
          label="Report a Bug"
          icon={<span className="icon icon-sm">bug_report</span>}
          onClick={() => { setBugModalOpen(true); setDropdownOpen(false); }}
        />

        <div style={{ height: '1px', background: 'var(--border-main)', margin: '4px 0' }} />

        <DropdownItem
          label="Sign Out"
          icon="→"
          onClick={handleLogout}
          danger
        />
      </div>
    </>
  );
}

// ── Preferences panel ──────────────────────────────────────
const SCALE_OPTIONS = [0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15];

const HOME_OPTIONS = [
  { value: '/',          label: 'Landing Page'  },
  { value: '/dashboard', label: 'Investigators' },
  { value: '/keeper',    label: 'Keeper Panel'  },
  { value: '/campaign',  label: 'Campaigns'     },
];

// ── Shared section header style (used by every section in PreferencesPanel)
const sectionLabel = {
  fontFamily:    'var(--font-sans)',
  fontSize:      '10px',
  fontWeight:    '600',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color:         'var(--text-muted)',
  marginBottom:  '8px',
};

// ── Shared setting row wrapper ──────────────────────────────
// label on the left, control on the right, consistent vertical padding,
// divider on the bottom. Mirrors the ToggleRow rhythm.
function SettingRow({ label, desc, children }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            '10px',
      padding:        '8px 0',
      borderBottom:   '1px solid var(--border-main)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize:   '13px',
          fontWeight: '500',
          color:      'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
        }}>
          {label}
        </div>
        {desc && (
          <div style={{
            fontSize:   '11px',
            color:      'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.4,
          }}>
            {desc}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
}

// ── ± stepper control ───────────────────────────────────────
function Stepper({ value, idx, min, max, onStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button
        onClick={() => onStep(-1)}
        disabled={idx <= min}
        style={{
          width: '24px', height: '24px', borderRadius: '6px',
          border: '1px solid var(--border-main)',
          background: 'transparent',
          color: idx <= min ? 'var(--text-faint)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: 1,
          cursor: idx <= min ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >−</button>
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: '12px',
        color: 'var(--text-primary)', minWidth: '36px', textAlign: 'center',
      }}>
        {Math.round(value * 100)}%
      </span>
      <button
        onClick={() => onStep(+1)}
        disabled={idx >= max}
        style={{
          width: '24px', height: '24px', borderRadius: '6px',
          border: '1px solid var(--border-main)',
          background: 'transparent',
          color: idx >= max ? 'var(--text-faint)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: 1,
          cursor: idx >= max ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >+</button>
    </div>
  );
}

function PreferencesPanel({ theme, setPanel }) {
  const {
    setTheme,
    sheetFontScale, setSheetFontScale,
    roomFontScale,  setRoomFontScale,
    bgArtEnabled,      setBgArtEnabled,
    parallaxEnabled,   setParallaxEnabled,
    parallaxIntensity, setParallaxIntensity,
  } = useTheme();
  const [savedMsg, setSavedMsg]   = useState('');
  const [homePage, setHomePage]   = useState(() => localStorage.getItem('coc_home_page') || '/');

  // Flash "Saved" confirmation when a setting changes
  const applySetting = (fn) => {
    fn();
    setSavedMsg('✓ Saved');
    setTimeout(() => setSavedMsg(''), 1500);
  };

  return (
    <>
      {/* ── Header with back button ── */}
      <div style={{
        padding:       '10px 12px',
        borderBottom:  '1px solid var(--border-main)',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
      }}>
        <button
          onClick={() => setPanel('main')}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '4px',
            background:  'none',
            border:      'none',
            cursor:      'pointer',
            fontFamily:  'var(--font-sans)',
            fontSize:    '13px',
            color:       'var(--text-secondary)',
            padding:     '2px 6px',
            borderRadius:'6px',
            transition:  'all 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--row-hover)';
            e.currentTarget.style.color      = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color      = 'var(--text-secondary)';
          }}
        >
          <span className="icon icon-sm">arrow_back</span>{' '}Back
        </button>

        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize:   '12px',
          fontWeight: '500',
          color:      'var(--text-primary)',
        }}>
          Preferences
        </span>

        {/* Saved confirmation flash */}
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize:   '11px',
          color:      'var(--success)',
          opacity:    savedMsg ? 1 : 0,
          transition: 'opacity 0.2s ease',
          minWidth:   '48px',
          textAlign:  'right',
        }}>
          {savedMsg}
        </span>
      </div>

      {/* ── Settings body ── */}
      <div style={{ padding: '10px 12px 14px' }}>

        {/* ── THEME ── */}
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionLabel}>Theme</div>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 '6px',
          }}>
            {THEMES.map(opt => {
              const isActive = theme === opt.id;
              return (
                <Tooltip key={opt.id} content={opt.label}>
                <button
                  onClick={() => applySetting(() => setTheme(opt.id))}
                  style={{
                    display:       'flex',
                    flexDirection: 'column',
                    alignItems:    'center',
                    gap:           '4px',
                    padding:       '6px 4px',
                    borderRadius:  '8px',
                    border:        isActive
                      ? '2px solid var(--accent)'
                      : '1.5px solid var(--border-main)',
                    background:    isActive ? 'var(--accent-bg)' : 'var(--bg-input)',
                    cursor:        isActive ? 'default' : 'pointer',
                    transition:    'border-color 0.15s ease, background 0.15s ease',
                  }}
                >
                  {/* Three-colour swatch: [background, accent, surface] */}
                  <div style={{ display: 'flex', gap: '2px', borderRadius: '3px', overflow: 'hidden' }}>
                    {opt.swatch.map((color, i) => (
                      <div key={i} style={{ width: '14px', height: '14px', background: color }} />
                    ))}
                  </div>
                  <span style={{
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '10px',
                    color:        isActive ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight:   isActive ? '500' : '400',
                    lineHeight:   1.2,
                    textAlign:    'center',
                    whiteSpace:   'nowrap',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth:     '100%',
                  }}>
                    {opt.label}
                  </span>
                </button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* ── FONT SCALE ── */}
        <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '10px', marginBottom: '4px' }}>
          <div style={sectionLabel}>Font Scale</div>
          {[
            { label: 'Sheet text',   desc: 'Character sheet size',  value: sheetFontScale, set: setSheetFontScale },
            { label: 'Display text', desc: 'Room / session panels', value: roomFontScale,  set: setRoomFontScale  },
          ].map(({ label, desc, value, set }) => {
            const idx = SCALE_OPTIONS.indexOf(value);
            const step = (dir) => {
              const next = SCALE_OPTIONS[idx + dir];
              if (next !== undefined) applySetting(() => set(next));
            };
            return (
              <SettingRow key={label} label={label} desc={desc}>
                <Stepper
                  value={value}
                  idx={idx}
                  min={0}
                  max={SCALE_OPTIONS.length - 1}
                  onStep={step}
                />
              </SettingRow>
            );
          })}
        </div>

        {/* ── VISUALS ── */}
        <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '10px', marginBottom: '4px' }}>
          <div style={sectionLabel}>Visuals</div>

          {/* Background master toggle */}
          <ToggleRow
            label="Background"
            desc="Atmospheric art behind pages"
            checked={bgArtEnabled}
            onChange={() => applySetting(() => setBgArtEnabled(!bgArtEnabled))}
          />

          {/* Sub-controls — shown only when Background is ON */}
          {bgArtEnabled && (
            <>
              <ToggleRow
                label="Parallax effect"
                desc="Art moves with your cursor"
                checked={parallaxEnabled}
                onChange={() => applySetting(() => setParallaxEnabled(!parallaxEnabled))}
              />

              {/* Amount slider — shown only when Parallax is also ON.
                  Indented slightly to show visual nesting under the parallax toggle. */}
              {parallaxEnabled && (
                <SettingRow label="Amount" desc="Parallax strength">
                  <div style={{ width: '88px' }}>
                    <Slider
                      value={parallaxIntensity}
                      min={0.25}
                      max={2}
                      step={0.05}
                      onChange={v => applySetting(() => setParallaxIntensity(v))}
                      ariaLabel="Parallax amount"
                    />
                  </div>
                </SettingRow>
              )}
            </>
          )}
        </div>

        {/* ── HOME PAGE ── */}
        <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '10px' }}>
          <div style={sectionLabel}>Home Page</div>
          {/* CustomDropdown already fills its container; wrap in a SettingRow-
              compatible block so spacing matches the rest of the panel. */}
          <div style={{ paddingBottom: '2px' }}>
            <CustomDropdown
              value={homePage}
              onChange={v => {
                setHomePage(v);
                localStorage.setItem('coc_home_page', v);
                applySetting(() => {});
              }}
              options={HOME_OPTIONS}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Upload Quota panel ─────────────────────────────────────
function QuotaPanel({ setPanel, navigate, onClose }) {
  const [quota, setQuota] = useState(null);

  const load = () => {
    apiClient.get('/profile/upload-quota')
      .then(r => setQuota(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const fmt = (b) => {
    const m = b / (1024 * 1024);
    return m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
  };
  const barColor = (pct) => pct >= 90 ? 'var(--danger)' : pct >= 60 ? '#d97706' : 'var(--color-primary)';

  const totalUsed  = quota?.totalUsed  ?? 0;
  const totalLimit = quota?.totalLimit ?? 200 * 1024 * 1024;
  const winUsed    = quota?.windowUsed ?? 0;
  const winLimit   = quota?.windowLimit ?? 50 * 1024 * 1024;
  const totalPct   = Math.min(100, Math.round((totalUsed / totalLimit) * 100));
  const winPct     = Math.min(100, Math.round((winUsed / winLimit) * 100));

  return (
    <>
      {/* Header */}
      <div style={{
        padding:        '10px 12px',
        borderBottom:   '1px solid var(--border-main)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={() => setPanel('main')}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: '13px',
            color: 'var(--text-secondary)', padding: '2px 6px',
            borderRadius: '6px', transition: 'all 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--row-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <span className="icon icon-sm">arrow_back</span>{' '}Back
        </button>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>
          Upload Quota
        </span>
        <span style={{ minWidth: '48px' }} />
      </div>

      {/* Content */}
      <div style={{ padding: '16px 14px 18px' }}>

        {/* Total storage */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Storage used
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: '600', color: barColor(totalPct) }}>
            {fmt(totalUsed)} <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>/ {fmt(totalLimit)} MB</span>
          </span>
        </div>
        <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border-main)', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ height: '100%', width: `${totalPct}%`, borderRadius: '4px', background: barColor(totalPct), transition: 'width 0.4s ease, background 0.3s ease' }} />
        </div>

        {/* 5-minute rate */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Uploaded · last 5 min
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: '600', color: barColor(winPct) }}>
            {fmt(winUsed)} <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>/ {fmt(winLimit)} MB</span>
          </span>
        </div>
        <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border-main)', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ height: '100%', width: `${winPct}%`, borderRadius: '4px', background: barColor(winPct), transition: 'width 0.4s ease, background 0.3s ease' }} />
        </div>

        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.5, marginBottom: '14px' }}>
          200&nbsp;MB total &middot; 50&nbsp;MB per 5 minutes.
        </div>

        {/* Manage files → */}
        <button
          onClick={() => { navigate('/files'); onClose?.(); }}
          style={{
            width: '100%', padding: '8px 12px',
            border: '1px solid var(--color-primary-mid)', borderRadius: '8px',
            background: 'var(--accent-bg)', color: 'var(--accent)',
            fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px', transition: 'background 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-bg)'}
        >
          <span className="icon icon-sm">folder_open</span>
          Manage files
        </button>
      </div>
    </>
  );
}