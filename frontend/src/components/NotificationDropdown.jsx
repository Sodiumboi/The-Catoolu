import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import bellBlack from '../assets/noti_bell_black.svg';
import bellLight from '../assets/noti_bell_light.svg';

export default function NotificationDropdown() {
  const navigate              = useNavigate();
  const { toasts }            = useNotifications();
  const { theme }             = useTheme();
  const { socket }            = useSocket();
  const [open,    setOpen]    = useState(false);
  const [notifications, setNotifs] = useState([]);
  const [loading, setLoad]    = useState(true);
  const dropdownRef           = useRef(null);

  const unread = notifications.filter(n => !n.is_read).length;

  const fetchNotifs = useCallback(() => {
    apiClient.get('/notifications')
      .then(res => setNotifs(res.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoad(false));
  }, []);

  // Fetch on mount so the badge is correct immediately
  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // Re-fetch when dropdown opens
  useEffect(() => { if (open) fetchNotifs(); }, [open, fetchNotifs]);

  // Re-fetch when the backend pushes new_notification — fires on any page,
  // not just when inside a campaign room.
  useEffect(() => {
    if (!socket) return;
    socket.on('new_notification', fetchNotifs);
    return () => socket.off('new_notification', fetchNotifs);
  }, [socket, fetchNotifs]);

  // Re-fetch when a new toast fires (fallback for campaign-room activity).
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(fetchNotifs, 400);
    return () => clearTimeout(t);
  }, [toasts.length, fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    await apiClient.delete('/notifications/' + id).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = async () => {
    await apiClient.delete('/notifications').catch(() => {});
    setNotifs(prev => prev.filter(n => n.is_pinned));
  };

  const handleMarkAllRead = async () => {
    await apiClient.put('/notifications/read-all').catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClick = (notif) => {
    // Mark as read
    apiClient.put('/notifications/read-all').catch(() => {});
    setNotifs(prev => prev.map(n =>
      n.id === notif.id ? { ...n, is_read: true } : n
    ));
    if (notif.campaign_id) navigate('/campaign/' + notif.campaign_id);
    setOpen(false);
  };

  const API_BASE = import.meta.env.VITE_API_URL || '';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>

      {/* Bell button */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position:     'relative',
          width:        '36px',
          height:       '36px',
          borderRadius: '50%',
          border:       open
            ? '1.5px solid var(--color-primary)'
            : '1px solid var(--border-main)',
          background:   open ? 'var(--accent-bg)' : 'transparent',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          fontSize:     '16px',
          transition:   'all 0.15s ease',
          flexShrink:   0,
        }}
        title="Notifications"
      >
        <img
          src={theme === 'dark' ? bellLight : bellBlack}
          alt="notifications"
          style={{ width:'20px', height:'20px', display:'block', opacity: 0.7 }}
        />
        {/* Unread badge */}
        {unread > 0 && (
          <div style={{
            position:   'absolute',
            top:        '-2px',
            right:      '-2px',
            width:      '16px',
            height:     '16px',
            borderRadius:'50%',
            background: 'var(--danger)',
            color:      '#ffffff',
            fontSize:   '9px',
            fontWeight: '700',
            display:    'flex',
            alignItems: 'center',
            justifyContent:'center',
            fontFamily: 'var(--font-sans)',
            border:     '1.5px solid var(--bg-nav)',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:   'absolute',
          top:        'calc(100% + 8px)',
          right:      0,
          width:      '340px',
          maxHeight:  '480px',
          background: 'var(--bg-card)',
          border:     '1px solid var(--border-main)',
          borderRadius:'12px',
          boxShadow:  'var(--shadow-dropdown)',
          zIndex:     300,
          display:    'flex',
          flexDirection:'column',
          overflow:   'hidden',
        }}>

          {/* Header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '14px 16px 10px',
            borderBottom:   '1px solid var(--border-main)',
            flexShrink:     0,
          }}>
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '8px',
            }}>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize:   '15px',
                color:      'var(--text-primary)',
                fontWeight: '600',
              }}>
                Notifications
              </span>
              {unread > 0 && (
                <span style={{
                  background:   'var(--danger)',
                  color:        '#ffffff',
                  borderRadius: '10px',
                  fontSize:     '10px',
                  fontWeight:   '600',
                  padding:      '1px 6px',
                  fontFamily:   'var(--font-sans)',
                }}>
                  {unread} new
                </span>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background:'none', border:'none',
                    cursor:'pointer', fontSize:'11px',
                    color:'var(--accent)', fontFamily:'var(--font-sans)',
                    padding:'2px 4px',
                  }}
                >
                  Mark all read
                </button>
              )}
              {notifications.some(n => !n.is_pinned) && (
                <button
                  onClick={handleClearAll}
                  style={{
                    background:'none', border:'none',
                    cursor:'pointer', fontSize:'11px',
                    color:'var(--text-faint)', fontFamily:'var(--font-sans)',
                    padding:'2px 4px',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ overflowY:'auto', flex:1 }}>

            {loading && (
              <div style={{
                padding:'24px', textAlign:'center',
                fontSize:'13px', color:'var(--text-faint)',
              }}>
                Loading...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div style={{
                padding:'32px 16px', textAlign:'center',
              }}>
                <div style={{ marginBottom:'8px', opacity:0.3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'32px', lineHeight:1, color:'var(--text-muted)' }}>
                    notifications
                  </span>
                </div>
                <p style={{
                  fontSize:'13px', color:'var(--text-muted)',
                  margin:0, fontFamily:'var(--font-sans)',
                }}>
                  All caught up
                </p>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <>
                {/* Pinned invites */}
                {notifications.some(n => n.is_pinned) && (
                  <>
                    <div style={{
                      padding:'8px 16px 4px',
                      fontSize:'10px', fontWeight:'600',
                      textTransform:'uppercase', letterSpacing:'0.07em',
                      color:'var(--accent)',
                      fontFamily:'var(--font-sans)',
                    }}>
                      <span className="icon icon-sm">push_pin</span>{' '}Invites
                    </div>
                    {notifications
                      .filter(n => n.is_pinned)
                      .map(n => (
                        <NotifRow
                          key={n.id}
                          notif={n}
                          onClick={() => handleClick(n)}
                          onDismiss={(e) => handleDismiss(n.id, e)}
                          apiBase={API_BASE}
                        />
                      ))}
                    <div style={{
                      borderTop:'1px solid var(--border-main)',
                      margin:'4px 0',
                    }} />
                  </>
                )}

                {/* Regular notifications */}
                {notifications.some(n => !n.is_pinned) && (
                  <>
                    <div style={{
                      padding:'8px 16px 4px',
                      fontSize:'10px', fontWeight:'600',
                      textTransform:'uppercase', letterSpacing:'0.07em',
                      color:'var(--text-muted)',
                      fontFamily:'var(--font-sans)',
                    }}>
                      Recent
                    </div>
                    {notifications
                      .filter(n => !n.is_pinned)
                      .map(n => (
                        <NotifRow
                          key={n.id}
                          notif={n}
                          onClick={() => handleClick(n)}
                          onDismiss={(e) => handleDismiss(n.id, e)}
                          apiBase={API_BASE}
                        />
                      ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Single notification row ────────────────────────────────────
function NotifRow({ notif, onClick, onDismiss, apiBase }) {
  const time = new Date(notif.created_at).toLocaleString([], {
    month:'short', day:'numeric',
    hour:'2-digit', minute:'2-digit',
  });

  return (
    <div
      onClick={onClick}
      style={{
        display:    'flex',
        alignItems: 'flex-start',
        gap:        '10px',
        padding:    '10px 16px',
        cursor:     'pointer',
        background: notif.is_read ? 'transparent' : 'var(--accent-bg)',
        borderBottom:'1px solid var(--border-main)',
        transition: 'background 0.1s ease',
        position:   'relative',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
      onMouseLeave={e => e.currentTarget.style.background =
        notif.is_read ? 'transparent' : 'var(--accent-bg)'}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <div style={{
          position:'absolute', right:'36px', top:'50%',
          transform:'translateY(-50%)',
          width:'7px', height:'7px', borderRadius:'50%',
          background:'var(--accent)',
        }} />
      )}

      {/* Avatar */}
      <div style={{
        width:'36px', height:'36px', borderRadius:'50%',
        background:'var(--color-primary-light)',
        display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0, overflow:'hidden',
        border:'1px solid var(--border-main)',
      }}>
        {notif.avatar_url ? (
          <img
            src={apiBase + notif.avatar_url}
            alt={notif.sender_name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
          />
        ) : (
          <span style={{
            fontSize:'12px', fontWeight:'600',
            color:'var(--color-primary-dark)',
            fontFamily:'var(--font-sans)',
          }}>
            {(notif.sender_name || '?').slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          display:'flex', justifyContent:'space-between',
          gap:'6px', marginBottom:'2px',
        }}>
          <span style={{
            fontSize:'12px', fontWeight:'600',
            color:'var(--text-primary)',
            fontFamily:'var(--font-sans)',
          }}>
            {notif.sender_name}
          </span>
          <span style={{
            fontSize:'10px', color:'var(--text-faint)',
            flexShrink:0, fontFamily:'var(--font-sans)',
          }}>
            {time}
          </span>
        </div>
        {notif.campaign_name && (
          <div style={{
            fontSize:'10px', color:'var(--accent)',
            marginBottom:'2px', fontFamily:'var(--font-sans)',
            display:'flex', alignItems:'center', gap:'3px',
          }}>
            {notif.type === 'roll'
              ? <span className="icon icon-sm">casino</span>
              : <span className="icon icon-sm">chat</span>
            }{' '}{notif.campaign_name}
          </div>
        )}
        <p style={{
          fontSize:'12px', color:'var(--text-secondary)',
          margin:0, overflow:'hidden',
          textOverflow:'ellipsis', whiteSpace:'nowrap',
          fontFamily:'var(--font-sans)',
        }}>
          {notif.content}
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          background:'none', border:'none', cursor:'pointer',
          color:'var(--text-faint)',
          padding:'0', lineHeight:1, flexShrink:0,
          marginTop:'2px',
        }}
      >
        <span className="icon icon-sm">close</span>
      </button>
    </div>
  );
}
