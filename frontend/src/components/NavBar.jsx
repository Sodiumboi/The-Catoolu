import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/vault-logo.png';

// ── Tab definitions ────────────────────────────────────────
// 'available' tabs are clickable, 'soon' tabs are greyed out
const TABS = [
  { id: 'investigators', label: 'Investigators', path: '/dashboard', status: 'available' },
  { id: 'keeper',        label: 'Keeper',        path: '/keeper',   status: 'available' },
  { id: 'campaign',      label: 'Campaign',      path: '/campaign', status: 'available' },
  { id: 'inbox',         label: 'Inbox',         path: '/inbox',    status: 'available' },
];

export default function NavBar({ activeTab = 'investigators', onImport, investigatorCount }) {
  const { user, logout }          = useAuth();
  const { theme, toggleTheme }    = useTheme();
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tooltip,      setTooltip]      = useState(null);
  const [panel,        setPanel]        = useState('main'); // 'main' | 'preferences'
  const dropdownRef                     = useRef(null);
  const fileInputRef                    = useRef(null);

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
        width:      '100%',
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
            flexShrink: 0,
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

        {/* ── Tabs — pill shaped ── */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '4px',
          flex:       1,
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const isSoon   = tab.status === 'soon';

            return (
              <div key={tab.id} style={{ position: 'relative' }}>
                <button
                  onClick={() => !isSoon && navigate(tab.path)}
                  onMouseEnter={() => isSoon && setTooltip({ id: tab.id, label: tab.version })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           '6px',
                    padding:       '5px 14px',
                    borderRadius:  '20px',
                    border:        isActive
                      ? '1.5px solid var(--color-primary)'
                      : '1.5px solid transparent',
                    background:    isActive
                      ? 'var(--accent-bg)'
                      : 'transparent',
                    cursor:        isSoon ? 'default' : 'pointer',
                    fontFamily:    'var(--font-sans)',
                    fontSize:      '13px',
                    fontWeight:    isActive ? '500' : '400',
                    color:         isActive
                      ? 'var(--color-primary)'
                      : isSoon
                        ? 'var(--text-faint)'
                        : 'var(--text-secondary)',
                    whiteSpace:    'nowrap',
                    transition:    'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isSoon && !isActive) {
                      e.currentTarget.style.background   = 'var(--row-hover)';
                      e.currentTarget.style.color        = 'var(--text-primary)';
                      e.currentTarget.style.borderColor  = 'var(--border-main)';
                    }
                    if (isSoon) setTooltip({ id: tab.id, label: tab.version });
                  }}
                  onMouseLeave={e => {
                    if (!isSoon && !isActive) {
                      e.currentTarget.style.background  = 'transparent';
                      e.currentTarget.style.color       = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                    setTooltip(null);
                  }}
                >
                  {tab.label}

                  {/* Count badge */}
                  {tab.id === 'investigators' && investigatorCount > 0 && (
                    <span style={{
                      background:   isActive ? 'var(--color-primary)' : 'var(--border-main)',
                      color:        isActive ? '#ffffff' : 'var(--text-muted)',
                      borderRadius: '10px',
                      fontSize:     '10px',
                      fontWeight:   '500',
                      padding:      '0px 6px',
                      lineHeight:   '1.6',
                    }}>
                      {investigatorCount}
                    </span>
                  )}

                  {/* Lock icon */}
                  {isSoon && (
                    <span style={{ fontSize: '10px', opacity: 0.4 }}>🔒</span>
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
          display:    'flex',
          alignItems: 'center',
          gap:        '8px',
          marginLeft: 'auto',
          flexShrink: 0,
        }}>

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
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={e => {
                if (!dropdownOpen)
                  e.currentTarget.style.borderColor = 'var(--border-main)';
              }}
            >
              {initials}
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
          icon="⚙️"
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
  const { skillSize, setSkillSize } = useTheme();
  const [savedMsg, setSavedMsg]     = useState('');

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
          ← Back
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

        {/* ── Skill Text Size ── */}
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
            Skill Text Size
          </div>

          <div style={{
            display:       'flex',
            border:        '1.5px solid var(--border-main)',
            borderRadius:  '8px',
            overflow:      'hidden',
          }}>
            {[
              { value: 'sm',   label: 'S', title: 'Small'  },
              { value: 'base', label: 'M', title: 'Medium' },
              { value: 'lg',   label: 'L', title: 'Large'  },
            ].map((opt, i) => {
              const isActive = skillSize === opt.value;
              return (
                <button
                  key={opt.value}
                  title={opt.title}
                  onClick={() => applySetting(() => setSkillSize(opt.value))}
                  style={{
                    flex:       1,
                    padding:    '6px 0',
                    border:     'none',
                    borderLeft: i > 0 ? '1px solid var(--border-main)' : 'none',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color:      isActive ? '#ffffff'       : 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize:   i === 0 ? '11px' : i === 1 ? '13px' : '15px',
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
            More settings coming in v1.5
          </div>
        </div>
      </div>
    </>
  );
}