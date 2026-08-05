import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  { id: 'investigators', labelKey: 'nav.investigators', path: '/dashboard', status: 'available' },
  { id: 'keeper',        labelKey: 'nav.keeper',        path: '/keeper',   status: 'available' },
  { id: 'campaign',      labelKey: 'nav.campaign',      path: '/campaign', status: 'available' },
];

// Width the track needs to hold its tabs: tab widths + gaps + padding + border
// (border-box, so padding/border are inside the width). The track is inline-flex
// with an intrinsic width, and intrinsic widths can't be CSS-transitioned — so we
// compute the number ourselves. Two callers need it and must agree exactly: the
// animated width we set, and the gate that decides when the track is wide enough
// to reveal the labels.
function trackWidthFor(container, tabs) {
  const cs    = getComputedStyle(container);
  const gap   = parseFloat(cs.columnGap || cs.gap) || 0;
  const padX  = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  const bordX = (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
  const content = tabs.reduce((sum, n) => sum + n.getBoundingClientRect().width, 0);
  // Ceil so a subpixel shortfall can never clip the rounded end cap.
  return Math.ceil(content + gap * (tabs.length - 1) + padX + bordX);
}

// NavBar remounts on every page — these carry state across remounts.
let _lastPillBounds = null;
// Maintenance pill: persists so the pill stays visible on navigation while maintenance is on.
let _maintState = { mounted: false, visible: false, message: '' };


export default function NavBar({ activeTab = 'investigators' }) {
  const { t, i18n }               = useTranslation();
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
  const [trackWidth, setTrackWidth]     = useState(null);

  const didMountLang                    = useRef(false);

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
  const measurePill = useCallback(() => {
    const el        = tabRefs.current[currentActiveTab];
    const container = containerRef.current;
    if (!el || !container) return;
    const r          = el.getBoundingClientRect();
    const c          = container.getBoundingClientRect();
    const cs         = getComputedStyle(container);
    const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
    const b = { left: r.left - c.left - borderLeft, width: r.width };
    _lastPillBounds = b;
    setPillBounds(b);

    // Give the track a concrete px width so it can stretch/contract between
    // label sizes. Only the three tab labels feed this, and they only change on
    // language switch, so a JS-driven width stays stable the rest of the time.
    const tabs = TABS.map(x => tabRefs.current[x.id]).filter(Boolean);
    if (tabs.length === TABS.length) setTrackWidth(trackWidthFor(container, tabs));
  }, [currentActiveTab]);

  // Translated glyphs re-lay-out instantly while the track and pill animate to
  // their new size over 0.35s, so for that window the text would sit outside its
  // own box (obvious when growing, e.g. TH→EN). Blank the labels for the frame
  // the language flips, then release them so CSS fades them back in as the
  // boxes converge — text and boxes land together.
  //
  // useLayoutEffect, not useEffect: this runs before paint, so the misaligned
  // frame is never shown. Done by touching classList rather than React state so
  // it costs no extra render (and no set-state-in-effect).
  useLayoutEffect(() => {
    if (!didMountLang.current) { didMountLang.current = true; return; }  // no fade on first load
    const container = containerRef.current;
    const nodes     = TABS.map(x => tabRefs.current[x.id]).filter(Boolean);
    if (!container || nodes.length !== TABS.length) return;

    const needed = trackWidthFor(container, nodes);          // width the NEW labels require
    const have   = container.getBoundingClientRect().width;  // width the track has right now
    if (Math.abs(have - needed) <= 0.5) return;              // already the right size, nothing to animate

    const reveal = () => nodes.forEach(n => n.classList.remove('is-lang-swapping'));
    nodes.forEach(n => n.classList.add('is-lang-swapping'));

    // Poll the track's real animated width and reveal the labels the frame it
    // arrives at its new size — geometry-driven rather than timed, so the box
    // always resizes empty and the text only appears once it fits properly.
    // Direction-aware: growing arrives from below the target, shrinking from
    // above. Testing the crossing (rather than equality) also means the spring's
    // overshoot uncovers the text a touch before the box finishes settling.
    const growing = have < needed;
    const arrived = () => {
      const w = container.getBoundingClientRect().width;
      return growing ? w + 0.5 >= needed : w - 0.5 <= needed;
    };

    let raf;
    const tick = () => {
      if (arrived()) { reveal(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Failsafe: never leave the labels invisible if the width never arrives
    // (interrupted transition, measurement drift, reduced-motion overrides).
    const bail = setTimeout(reveal, 800);

    return () => { cancelAnimationFrame(raf); clearTimeout(bail); reveal(); };
  }, [i18n.language]);

  // Re-measure on tab change AND on language change — translated labels have
  // different widths, so the pill has to resize with them, not just slide.
  useEffect(() => {
    measurePill();
    // Thai renders in Noto Sans Thai, an async webfont. A measurement taken
    // before it swaps in is based on fallback-font widths, which matters on a
    // cold load with the language already persisted to 'th'. Re-measure once
    // fonts settle; the promise is already resolved on later switches, so this
    // is a cheap no-op then.
    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled) measurePill(); });
    return () => { cancelled = true; };
  }, [measurePill, i18n.language]);

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
    <nav className="bg-(--bg-nav) border-b border-(--border-main) shadow-(--shadow-nav) sticky top-0 z-50">
      <div className="px-6 flex items-center h-14 gap-6 relative">

        {/* ── Logo ── */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 outline-none! shrink-0 mr-auto"
        >
          <img
            src={logo}
            alt="The Catoolu"
            className="w-9 h-9 object-contain"
          />
          <div className="text-left">
            <div className="font-serif text-lg text-(--color-primary-dark) leading-[1.1]">
              The Catoolu
            </div>
            <div className="font-sans text-[11px] text-(--text-muted) leading-[1.2]">
              {t('nav.welcome', { name: user?.username ?? '' })}
            </div>
          </div>
        </button>
        {/* ── Tabs — absolutely centered regardless of logo/avatar width ── */}
        {/* Positioning wrapper: .pill-nav-container is position:relative (it
            anchors the sliding indicator), so the absolute centering lives on
            this outer div instead. */}
        <div className="absolute left-1/2 -translate-x-1/2">
        <div
          ref={containerRef}
          className="pill-nav-container"
          // Runtime-measured so the track can animate between label widths.
          // null until first measure — falls back to the CSS intrinsic width,
          // so there is no width animation on initial page load.
          style={trackWidth ? { width: trackWidth } : undefined}
        >
          {/* Single pill — slides across the container */}
          {pillBounds && (
            <div
              // left/width are runtime-measured (getBoundingClientRect) — stay inline
              className="pill-nav-indicator"
              style={{ left: pillBounds.left, width: pillBounds.width }}
            />
          )}

          {TABS.map(tab => {
            const isActive = currentActiveTab === tab.id;
            const isSoon   = tab.status === 'soon';

            return (
              <div key={tab.id} className="relative">
                <button
                  ref={el => { tabRefs.current[tab.id] = el; }}
                  onClick={() => !isSoon && navigate(tab.path)}
                  onMouseEnter={() => {
                    if (isSoon) setTooltip({ id: tab.id, label: tab.version });
                  }}
                  onMouseLeave={() => {
                    setTooltip(null);
                  }}
                  className={`pill-nav-tab flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'active' : ''}`}
                  // 'soon' tabs override the shared class's muted colour + pointer
                  // cursor (unlayered .pill-nav-tab wins over utilities, so inline)
                  style={isSoon ? { color: 'var(--text-faint)', cursor: 'default' } : undefined}
                >
                  {t(tab.labelKey)}

                  {isSoon && (
                    <span className="icon icon-sm opacity-40">lock</span>
                  )}
                </button>

                {/* Tooltip */}
                {tooltip?.id === tab.id && (
                  <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-(--text-primary) text-(--bg-page) text-[11px] py-1 px-2.5 rounded-md whitespace-nowrap pointer-events-none z-[100]">
                    Coming in {tab.version}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>

        {/* ── Right side — pushed to far right with marginLeft auto ── */}
        <div className="flex items-center gap-2 flex-1 justify-end">

          {/* Maintenance warning pill — fades in/out, pulses like Return to Room */}
          {maintPill.mounted && <MaintPill pill={maintPill} />}

          {/* Return to Room pill — only shown when in a session */}
          {roomPill.data && (
            <div
              ref={roomPillRef}
              className={`relative origin-right [transition:opacity_0.2s_ease,transform_0.22s_cubic-bezier(0.34,1.56,0.64,1)] ${roomPill.visible ? 'opacity-100' : 'opacity-0'} ${roomPill.visible ? '[transform:scale(1)]' : '[transform:scale(0.5)]'} ${roomPill.visible ? 'pointer-events-auto' : 'pointer-events-none'}`}
              onMouseEnter={() => setRoomPillHovered(true)}
              onMouseLeave={() => { setRoomPillHovered(false); }}
            >
              {/* Pill itself */}
              <div
                // .pill-room supplies the frosted base. This is a COMPOUND control
                // (nav button + morphing chevron), so padding/gap are zeroed to keep
                // the inner buttons flush, and the open-state colour inversion is
                // inline — it must override the unlayered .pill-room base colours.
                className={`pill-room overflow-hidden max-w-[220px] ${roomMenuOpen ? 'animate-none' : 'animate-[pulse_2s_infinite]'}`}
                style={{
                  padding: 0,
                  gap: 0,
                  ...(roomMenuOpen && {
                    background:  'var(--color-primary)',
                    color:       '#fff',
                    borderColor: 'var(--color-primary)',
                  }),
                }}
              >
                {/* Left: navigate to room */}
                <Tooltip content={'Return to ' + roomPill.data.name}>
                <button
                  onClick={() => { setRoomMenuOpen(false); navigate('/campaign/' + roomPill.data.uuid); }}
                  className="flex items-center gap-1.5 py-[5px] pr-2.5 pl-3.5 bg-transparent border-none text-inherit [font-family:inherit] [font-size:inherit] [font-weight:inherit] cursor-pointer min-w-0"
                >
                  <span className="icon icon-sm">play_arrow</span>
                  <span className="truncate">
                    {roomPill.data.name}
                  </span>
                </button>
                </Tooltip>

                {/* Right: chevron — morphs in on hover */}
                <button
                  onClick={() => setRoomMenuOpen(o => !o)}
                  className={`flex items-center justify-center bg-transparent border-none text-inherit cursor-pointer overflow-hidden [transition:width_0.2s_ease,opacity_0.15s_ease,padding_0.2s_ease,border_0.15s_ease] ${(roomPillHovered || roomMenuOpen) ? 'py-[5px] pr-2.5 pl-1 border-l border-l-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] w-7 opacity-100' : 'py-[5px] px-0 border-l-0 w-0 opacity-0'}`}
                  tabIndex={roomPillHovered || roomMenuOpen ? 0 : -1}
                >
                  <span className={`icon text-base [transition:transform_0.2s_ease] ${roomMenuOpen ? '[transform:rotate(180deg)]' : '[transform:rotate(0deg)]'}`}>
                    expand_more
                  </span>
                </button>
              </div>

              {/* Dropdown */}
              {roomMenuOpen && (
                <div className="absolute top-[calc(100%+6px)] right-0 bg-(--bg-card) border border-(--border-main) rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-1.5 min-w-[140px] z-[1000]">
                  <button
                    onClick={() => { setRoomMenuOpen(false); handlePillDisconnect(); }}
                    className="flex items-center gap-2 w-full py-2 px-3 rounded-md border-none bg-transparent text-(--danger) font-sans text-[13px] cursor-pointer text-left [transition:background_0.12s_ease]"
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
                className="flex items-center gap-[5px] bg-transparent border border-(--border-main) rounded-lg py-[5px] px-3 cursor-pointer font-sans text-[13px] text-(--text-secondary) [transition:all_0.15s_ease]"
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
                className="hidden"
              />
            </>
          )}

          {/* Avatar */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className={`w-9 h-9 rounded-full bg-(--color-primary-light) border-[1.5px] cursor-pointer font-sans text-xs font-medium text-(--color-primary-dark) flex items-center justify-center [transition:border-color_0.15s_ease] overflow-hidden p-0 ${dropdownOpen ? 'border-(--color-primary)' : 'border-(--border-main)'}`}
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
                  className="w-9 h-9 object-cover rounded-full block"
                />
              ) : initials}
            </button>

            {/* Dropdown */}
            {/* ── Dropdown ─────────────────────────── */}
              {dropdownOpen && (
                <div className={`absolute top-[calc(100%+8px)] right-0 bg-(--bg-card) border border-(--border-main) rounded-xl shadow-(--shadow-dropdown) overflow-hidden z-[100] [transition:width_0.2s_ease] ${panel === 'main' ? 'w-[200px]' : 'w-[240px]'}`}>

                  {/* Panel content — key triggers remount + animation */}
                  <div
                    key={panel}
                    className={panel === 'preferences'
                      ? 'animate-[slideInFromRight_0.18s_ease]'
                      : 'animate-[slideInFromLeft_0.18s_ease]'}
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
    <div className="relative">
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`pill-maintenance cursor-help select-none overflow-hidden max-w-[180px] [transition:opacity_0.3s_ease,transform_0.3s_ease] ${pill.visible ? 'animate-[pulse-danger_2s_infinite]' : 'animate-none'} ${pill.visible ? 'opacity-100' : 'opacity-0'} ${pill.visible ? '[transform:translateY(0)_scale(1)]' : '[transform:translateY(4px)_scale(0.95)]'} ${pill.visible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <span className="icon icon-sm shrink-0">warning</span>
        <span className="truncate">
          Maintenance soon
        </span>
      </div>

      {/* Custom tooltip — faster than the native title attribute */}
      {hover && pill.message && (
        <div className="absolute top-[calc(100%+7px)] right-0 bg-(--text-primary) text-(--bg-page) text-[11px] leading-normal py-1.5 px-2.5 rounded-[7px] whitespace-pre-wrap max-w-[240px] break-words pointer-events-none z-[200] shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
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
      className={`flex items-center gap-2 w-full py-2 px-2.5 rounded-lg bg-transparent border-none cursor-pointer font-sans text-[13px] text-left [transition:background_0.1s_ease,color_0.1s_ease] ${danger ? 'text-(--danger)' : 'text-(--text-secondary)'}`}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'var(--danger-bg)' : 'var(--row-hover)';
        if (!danger) e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-secondary)';
      }}
    >
      <span className="text-sm">{icon}</span>
      <span className="flex-1">{label}</span>
      {chevron && (
        <span className="text-sm text-(--text-faint) leading-none">
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
      <div className="pt-3 px-4 pb-2.5 border-b border-(--border-main)">
        <div className="font-serif text-[15px] text-(--text-primary)">
          {user?.username}
        </div>
      </div>

      {/* Menu items */}
      <div className="p-1.5">
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

        <div className="h-px bg-(--border-main) my-1" />

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

// ── Shared section header utility classes (used by every section in
// PreferencesPanel) — expanded inline at each call site.

// ── Shared setting row wrapper ──────────────────────────────
// label on the left, control on the right, consistent vertical padding,
// divider on the bottom. Mirrors the ToggleRow rhythm.
function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-2.5 py-2 border-b border-(--border-main)">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-(--text-primary) font-sans">
          {label}
        </div>
        {desc && (
          <div className="text-[11px] text-(--text-muted) font-sans leading-[1.4]">
            {desc}
          </div>
        )}
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}

// ── ± stepper control ───────────────────────────────────────
function Stepper({ value, idx, min, max, onStep }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onStep(-1)}
        disabled={idx <= min}
        className={`w-6 h-6 rounded-md border border-(--border-main) bg-transparent font-sans text-[15px] leading-none flex items-center justify-center ${idx <= min ? 'text-(--text-faint) cursor-default' : 'text-(--text-secondary) cursor-pointer'}`}
      >−</button>
      <span className="font-sans text-xs text-(--text-primary) min-w-9 text-center">
        {Math.round(value * 100)}%
      </span>
      <button
        onClick={() => onStep(+1)}
        disabled={idx >= max}
        className={`w-6 h-6 rounded-md border border-(--border-main) bg-transparent font-sans text-[15px] leading-none flex items-center justify-center ${idx >= max ? 'text-(--text-faint) cursor-default' : 'text-(--text-secondary) cursor-pointer'}`}
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
  const { i18n }                  = useTranslation();
  const [savedMsg, setSavedMsg]   = useState('');
  const [homePage, setHomePage]   = useState(() => localStorage.getItem('coc_home_page') || '/');

  // i18next holds the active language; localStorage only seeds it on next boot.
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('catoolu_lang', lang);
  };

  // Flash "Saved" confirmation when a setting changes
  const applySetting = (fn) => {
    fn();
    setSavedMsg('✓ Saved');
    setTimeout(() => setSavedMsg(''), 1500);
  };

  return (
    <>
      {/* ── Header with back button ── */}
      <div className="py-2.5 px-3 border-b border-(--border-main) flex items-center justify-between">
        <button
          onClick={() => setPanel('main')}
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer font-sans text-[13px] text-(--text-secondary) py-0.5 px-1.5 rounded-md [transition:all_0.1s]"
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

        <span className="font-sans text-xs font-medium text-(--text-primary)">
          Preferences
        </span>

        {/* Saved confirmation flash */}
        <span className={`font-sans text-[11px] text-(--success) [transition:opacity_0.2s_ease] min-w-12 text-right ${savedMsg ? 'opacity-100' : 'opacity-0'}`}>
          {savedMsg}
        </span>
      </div>

      {/* ── Settings body ── */}
      <div className="pt-2.5 px-3 pb-3.5">

        {/* ── THEME ── */}
        <div className="mb-3.5">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) mb-2">Theme</div>
          <div className="grid grid-cols-3 gap-1.5">
            {THEMES.map(opt => {
              const isActive = theme === opt.id;
              return (
                <Tooltip key={opt.id} content={opt.label}>
                <button
                  onClick={() => applySetting(() => setTheme(opt.id))}
                  className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg [transition:border-color_0.15s_ease,background_0.15s_ease] ${isActive ? 'border-2 border-(--accent)' : 'border-[1.5px] border-(--border-main)'} ${isActive ? 'bg-(--accent-bg)' : 'bg-(--bg-input)'} ${isActive ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {/* Three-colour swatch: [background, accent, surface] */}
                  <div className="flex gap-0.5 rounded-[3px] overflow-hidden">
                    {opt.swatch.map((color, i) => (
                      // swatch colour is dynamic per-theme data — stays inline
                      <div key={i} className="w-3.5 h-3.5" style={{ background: color }} />
                    ))}
                  </div>
                  <span className={`font-sans text-[10px] leading-[1.2] text-center truncate max-w-full ${isActive ? 'text-(--accent)' : 'text-(--text-muted)'} ${isActive ? 'font-medium' : 'font-normal'}`}>
                    {opt.label}
                  </span>
                </button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* ── LANGUAGE ── */}
        <div className="border-t border-(--border-main) pt-2.5 mb-3.5">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) mb-2">Language</div>
          <div className="seg">
            {[{ id: 'en', label: 'EN' }, { id: 'th', label: 'ภาษาไทย' }].map(l => (
              <button
                key={l.id}
                onClick={() => applySetting(() => handleLanguageChange(l.id))}
                className={`seg-tab ${i18n.language === l.id ? 'active' : ''}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── FONT SCALE ── */}
        <div className="border-t border-(--border-main) pt-2.5 mb-1">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) mb-2">Font Scale</div>
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
        <div className="border-t border-(--border-main) pt-2.5 mb-1">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) mb-2">Visuals</div>

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
                  <div className="w-[88px]">
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
        <div className="border-t border-(--border-main) pt-2.5">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) mb-2">Home Page</div>
          {/* CustomDropdown already fills its container; wrap in a SettingRow-
              compatible block so spacing matches the rest of the panel. */}
          <div className="pb-0.5">
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
      <div className="py-2.5 px-3 border-b border-(--border-main) flex items-center justify-between">
        <button
          onClick={() => setPanel('main')}
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer font-sans text-[13px] text-(--text-secondary) py-0.5 px-1.5 rounded-md [transition:all_0.1s]"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--row-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <span className="icon icon-sm">arrow_back</span>{' '}Back
        </button>
        <span className="font-sans text-xs font-medium text-(--text-primary)">
          Upload Quota
        </span>
        <span className="min-w-12" />
      </div>

      {/* Content */}
      <div className="pt-4 px-3.5 pb-[18px]">

        {/* Total storage */}
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="font-sans text-[13px] text-(--text-secondary)">
            Storage used
          </span>
          {/* color is dynamic (barColor) — stays inline */}
          <span className="font-sans text-[13px] font-semibold" style={{ color: barColor(totalPct) }}>
            {fmt(totalUsed)} <span className="text-(--text-faint) font-normal">/ {fmt(totalLimit)} MB</span>
          </span>
        </div>
        <div className="h-2 rounded bg-(--border-main) overflow-hidden mb-3.5">
          {/* width + background are runtime values — stay inline */}
          <div className="h-full rounded [transition:width_0.4s_ease,background_0.3s_ease]" style={{ width: `${totalPct}%`, background: barColor(totalPct) }} />
        </div>

        {/* 5-minute rate */}
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="font-sans text-[13px] text-(--text-secondary)">
            Uploaded · last 5 min
          </span>
          {/* color is dynamic (barColor) — stays inline */}
          <span className="font-sans text-[13px] font-semibold" style={{ color: barColor(winPct) }}>
            {fmt(winUsed)} <span className="text-(--text-faint) font-normal">/ {fmt(winLimit)} MB</span>
          </span>
        </div>
        <div className="h-2 rounded bg-(--border-main) overflow-hidden mb-2.5">
          {/* width + background are runtime values — stay inline */}
          <div className="h-full rounded [transition:width_0.4s_ease,background_0.3s_ease]" style={{ width: `${winPct}%`, background: barColor(winPct) }} />
        </div>

        <div className="font-sans text-[11px] text-(--text-faint) leading-normal mb-3.5">
          200&nbsp;MB total &middot; 50&nbsp;MB per 5 minutes.
        </div>

        {/* Manage files → */}
        <button
          onClick={() => { navigate('/files'); onClose?.(); }}
          className="w-full py-2 px-3 border border-(--color-primary-mid) rounded-lg bg-(--accent-bg) text-(--accent) font-sans text-[13px] font-medium cursor-pointer flex items-center justify-center gap-1.5 [transition:background_0.1s]"
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