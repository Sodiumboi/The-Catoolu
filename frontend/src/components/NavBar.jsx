import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCampaign } from '../context/CampaignContext';
import { useNavBarActions } from '../context/NavBarActionsContext';
import logo from '../assets/vault-logo.png';

// ── Tab definitions ────────────────────────────────────────
// 'available' tabs are clickable, 'soon' tabs are greyed out
const TABS = [
  { id: 'investigators', label: 'Investigators', path: '/dashboard', status: 'available' },
  { id: 'keeper',        label: 'Keeper',        path: '/keeper',   status: 'available' },
  { id: 'campaign',      label: 'Campaign',      path: '/campaign', status: 'available' },
];

// NavBar remounts on every page — this carries the pill's last measured position
// across remounts so the sliding animation can play on navigation.
let _lastPillBounds = null;


export default function NavBar({ activeTab = 'investigators' }) {
  const { user, logout }          = useAuth();
  const { theme, toggleTheme }    = useTheme();
  const { activeRoom }            = useCampaign();
  const { onImport }              = useNavBarActions();
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Close dropdown on route change ──────────────────────
  useEffect(() => {
    setDropdownOpen(false);
    setPanel('main'); // ← reset panel on navigation too
  }, [location.pathname]);

  // Derive active tab from URL so navigation always triggers re-measurement
  const currentActiveTab = TABS.find(
    t => location.pathname === t.path || location.pathname.startsWith(t.path + '/')
  )?.id ?? activeTab;

  // Measure active tab position; persist across remounts so animation plays on navigation
  useEffect(() => {
    const el        = tabRefs.current[currentActiveTab];
    const container = containerRef.current;
    if (!el || !container) return;
    const r = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    const b = { left: r.left - c.left, width: r.width };
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
            flex:       1,
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

        {/* ── Tabs — sliding pill ── */}
        <div
          ref={containerRef}
          style={{
            display:   'flex',
            alignItems:'center',
            gap:       '4px',
            position:  'relative',
          }}
        >
          {/* Single pill — slides across the container */}
          {pillBounds && (
            <div
              style={{
                position:      'absolute',
                top:           0,
                bottom:        0,
                left:          pillBounds.left,
                width:         pillBounds.width,
                borderRadius:  '20px',
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
                    borderRadius: '20px',
                    border:       '1.5px solid transparent',
                    background:   'transparent',
                    cursor:       isSoon ? 'default' : 'pointer',
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '13px',
                    fontWeight:   isActive ? '500' : '400',
                    color:        isActive
                      ? 'var(--color-primary)'
                      : isSoon
                        ? 'var(--text-faint)'
                        : 'var(--text-secondary)',
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

          {/* Return to Room pill — only shown when in a session */}
          {activeRoom && (
            <button
              onClick={() => navigate('/campaign/' + activeRoom.uuid)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '5px 14px',
                borderRadius: '20px',
                border:       '1.5px solid var(--color-primary)',
                background:   'var(--accent-bg)',
                color:        'var(--color-primary)',
                fontFamily:   'var(--font-sans)',
                fontSize:     '12px',
                fontWeight:   '500',
                cursor:       'pointer',
                transition:   'all 0.15s ease',
                animation:    'pulse 2s infinite',
                maxWidth:     '180px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-primary)';
                e.currentTarget.style.color      = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--accent-bg)';
                e.currentTarget.style.color      = 'var(--color-primary)';
              }}
              title={'Return to ' + activeRoom.name}
            >
              <span className="icon icon-sm">play_arrow</span>
              <span style={{
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
              }}>
                {activeRoom.name}
              </span>
            </button>
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
                  src={(import.meta.env.VITE_API_URL || '') + user.avatar_url}
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
                  width:      panel === 'preferences' ? '240px' : '200px',
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
                    {panel === 'main'
                      ? <MainMenuPanel
                          user={user}
                          navigate={navigate}
                          setDropdownOpen={setDropdownOpen}
                          setPanel={setPanel}
                          handleLogout={handleLogout}
                        />
                      : <PreferencesPanel
                          theme={theme}
                          toggleTheme={toggleTheme}
                          setPanel={setPanel}
                        />
                    }
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </nav>
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
  user, navigate, setDropdownOpen, setPanel, handleLogout
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

        {/* Preferences — navigates to prefs panel */}
        <DropdownItem
          label="Preferences"
          icon={<span className="icon icon-sm">settings</span>}
          onClick={() => setPanel('preferences')}
          chevron
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
function PreferencesPanel({ theme, toggleTheme, setPanel }) {
  const { sheetSize, setSheetSize } = useTheme();
  const [savedMsg, setSavedMsg]      = useState('');

  // Flash "Saved" confirmation when a setting changes
  const applySetting = (fn) => {
    fn();
    setSavedMsg('✓ Saved');
    setTimeout(() => setSavedMsg(''), 1500);
  };

  return (
    <>
      {/* Header with back button */}
      <div style={{
        padding:      '10px 12px',
        borderBottom: '1px solid var(--border-main)',
        display:      'flex',
        alignItems:   'center',
        justifyContent:'space-between',
      }}>
        <button
          onClick={() => setPanel('main')}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '4px',
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize:   '13px',
            color:      'var(--text-secondary)',
            padding:    '2px 6px',
            borderRadius:'6px',
            transition: 'all 0.1s',
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

      {/* Settings */}
      <div style={{ padding: '8px 12px 12px' }}>

        {/* ── Theme ── */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontFamily:    'var(--font-sans)',
            fontSize:      '11px',
            fontWeight:    '500',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color:         'var(--text-muted)',
            marginBottom:  '8px',
          }}>
            Theme
          </div>

          <div style={{
            display:       'flex',
            gap:           '6px',
          }}>
            {[
              { value: 'light', label: '☀️ Light' },
              { value: 'dark',  label: '🌑 Dark'  },
            ].map(opt => {
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => applySetting(toggleTheme)}
                  style={{
                    flex:         1,
                    padding:      '6px 8px',
                    borderRadius: '8px',
                    border:       isActive
                      ? '1.5px solid var(--color-primary)'
                      : '1.5px solid var(--border-main)',
                    background:   isActive
                      ? 'var(--accent-bg)'
                      : 'transparent',
                    color:        isActive
                      ? 'var(--color-primary)'
                      : 'var(--text-secondary)',
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '12px',
                    fontWeight:   isActive ? '500' : '400',
                    cursor:       isActive ? 'default' : 'pointer',
                    transition:   'all 0.15s ease',
                    whiteSpace:   'nowrap',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Sheet Text Size ── */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontFamily:    'var(--font-sans)',
            fontSize:      '11px',
            fontWeight:    '500',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color:         'var(--text-muted)',
            marginBottom:  '8px',
          }}>
            Sheet Text Size
          </div>

          <div style={{
            display:      'flex',
            border:       '1.5px solid var(--border-main)',
            borderRadius: '8px',
            overflow:     'hidden',
          }}>
            {[
              { value: 'sm', label: 'S', title: 'Small',  fontSize: '11px' },
              { value: 'md', label: 'M', title: 'Medium', fontSize: '13px' },
              { value: 'lg', label: 'L', title: 'Large',  fontSize: '15px' },
            ].map((opt, i) => {
              const isActive = sheetSize === opt.value;
              return (
                <button
                  key={opt.value}
                  title={opt.title}
                  onClick={() => applySetting(() => setSheetSize(opt.value))}
                  style={{
                    flex:       1,
                    padding:    '6px 0',
                    border:     'none',
                    borderLeft: i > 0 ? '1px solid var(--border-main)' : 'none',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color:      isActive ? '#ffffff'       : 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize:   opt.fontSize,
                    fontWeight: isActive ? '500' : '400',
                    cursor:     isActive ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Coming soon ── */}
        <div style={{
          borderTop:  '1px solid var(--border-main)',
          paddingTop: '10px',
        }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize:   '11px',
            color:      'var(--text-faint)',
            fontStyle:  'italic',
            textAlign:  'center',
          }}>
            More settings coming in v2.0
          </div>
        </div>
      </div>
    </>
  );
}