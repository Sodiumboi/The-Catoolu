import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar   from '../components/NavBar';
import Footer   from '../components/Footer';
import apiClient from '../api/client';

export default function InboxPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  const load = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data.notifications);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    await apiClient.delete('/notifications');
    setNotifications(prev => prev.filter(n => n.is_pinned));
  };

  const handleDismiss = async (id) => {
    await apiClient.delete('/notifications/' + id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    await apiClient.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-page)',
      display:'flex', flexDirection:'column',
      fontFamily:'var(--font-sans)',
    }}>
      <NavBar activeTab="inbox" />

      <main style={{
        maxWidth:'680px', margin:'0 auto',
        padding:'32px 24px', flex:1, width:'100%',
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'flex-end',
          justifyContent:'space-between', marginBottom:'24px',
          flexWrap:'wrap', gap:'12px',
        }}>
          <div>
            <h1 style={{
              fontFamily:'var(--font-serif)', fontSize:'28px',
              color:'var(--text-primary)', margin:'0 0 4px',
            }}>
              Notifications
            </h1>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>
              {loading ? 'Loading...' :
               notifications.length === 0 ? 'All caught up' :
               unreadCount > 0
                 ? unreadCount + ' unread'
                 : notifications.length + ' notifications'}
            </p>
          </div>
          {notifications.length > 0 && (
            <div style={{ display:'flex', gap:'8px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    padding:'6px 14px', borderRadius:'8px',
                    border:'1px solid var(--border-main)',
                    background:'transparent', color:'var(--text-secondary)',
                    fontFamily:'var(--font-sans)', fontSize:'12px',
                    cursor:'pointer',
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={handleClear}
                style={{
                  padding:'6px 14px', borderRadius:'8px',
                  border:'1px solid var(--border-main)',
                  background:'transparent', color:'var(--text-muted)',
                  fontFamily:'var(--font-sans)', fontSize:'12px',
                  cursor:'pointer',
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                height:'72px', borderRadius:'12px',
                background:'var(--bg-card)',
                border:'1px solid var(--border-main)', opacity:0.5,
              }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && notifications.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px', opacity:0.3 }}>🔔</div>
            <p style={{
              fontFamily:'var(--font-serif)', fontSize:'18px',
              color:'var(--text-primary)', margin:'0 0 8px',
            }}>
              All caught up
            </p>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>
              Messages and dice rolls from campaigns will appear here
              when you're away.
            </p>
          </div>
        )}

        {/* Notification list */}
        {!loading && notifications.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>

            {/* Pinned invites section */}
            {notifications.some(n => n.is_pinned) && (
              <>
                <div style={{
                  fontSize:'10px', fontWeight:'600',
                  textTransform:'uppercase', letterSpacing:'0.08em',
                  color:'var(--accent)', marginBottom:'4px',
                }}>
                  📌 Invites
                </div>
                {notifications
                  .filter(n => n.is_pinned)
                  .map(n => (
                    <NotifCard
                      key={n.id}
                      notif={n}
                      onDismiss={() => handleDismiss(n.id)}
                      onClick={() => navigate('/campaign')}
                    />
                  ))}
                <div style={{
                  borderTop:'1px solid var(--border-main)',
                  margin:'8px 0',
                }} />
              </>
            )}

            {/* Regular notifications */}
            {notifications.some(n => !n.is_pinned) && (
              <>
                <div style={{
                  fontSize:'10px', fontWeight:'600',
                  textTransform:'uppercase', letterSpacing:'0.08em',
                  color:'var(--text-muted)', marginBottom:'4px',
                }}>
                  Recent
                </div>
                {notifications
                  .filter(n => !n.is_pinned)
                  .map(n => (
                    <NotifCard
                      key={n.id}
                      notif={n}
                      onDismiss={() => handleDismiss(n.id)}
                      onClick={() => {
                        handleDismiss(n.id);
                        if (n.campaign_id) navigate('/campaign/' + n.campaign_id);
                      }}
                    />
                  ))}
              </>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ── Notification Card ──────────────────────────────────────────
function NotifCard({ notif, onDismiss, onClick }) {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const time     = new Date(notif.created_at).toLocaleString([], {
    month:'short', day:'numeric',
    hour:'2-digit', minute:'2-digit',
  });

  return (
    <div
      onClick={onClick}
      style={{
        display:      'flex',
        alignItems:   'flex-start',
        gap:          '12px',
        padding:      '12px 14px',
        borderRadius: '12px',
        background:   notif.is_read ? 'var(--bg-card)' : 'var(--accent-bg)',
        border:       '1px solid ' + (notif.is_read
          ? 'var(--border-main)' : 'var(--accent)') + '44',
        cursor:       'pointer',
        transition:   'all 0.15s ease',
        position:     'relative',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <div style={{
          position:'absolute', top:'12px', right:'40px',
          width:'8px', height:'8px', borderRadius:'50%',
          background:'var(--accent)',
        }} />
      )}

      {/* Avatar */}
      <div style={{
        width:'40px', height:'40px', borderRadius:'50%',
        background:'var(--color-primary-light)',
        display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0, overflow:'hidden',
        border:'1px solid var(--border-main)',
      }}>
        {notif.avatar_url ? (
          <img
            src={API_BASE + notif.avatar_url}
            alt={notif.sender_name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
          />
        ) : (
          <span style={{
            fontFamily:'var(--font-sans)', fontSize:'14px',
            fontWeight:'600', color:'var(--color-primary-dark)',
          }}>
            {(notif.sender_name || '?').slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          display:'flex', justifyContent:'space-between',
          marginBottom:'3px', gap:'8px',
        }}>
          <span style={{
            fontFamily:'var(--font-sans)', fontSize:'13px',
            fontWeight:'600', color:'var(--text-primary)',
          }}>
            {notif.sender_name}
          </span>
          <span style={{ fontSize:'11px', color:'var(--text-faint)',
                         flexShrink:0 }}>
            {time}
          </span>
        </div>
        {notif.campaign_name && (
          <div style={{
            fontSize:'11px', color:'var(--accent)',
            marginBottom:'3px',
          }}>
            {notif.type === 'roll' ? '🎲 ' : '💬 '}
            {notif.campaign_name}
          </div>
        )}
        <p style={{
          fontFamily:'var(--font-sans)', fontSize:'13px',
          color:'var(--text-secondary)', margin:0,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {notif.content}
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        style={{
          background:'none', border:'none', cursor:'pointer',
          color:'var(--text-faint)', fontSize:'14px',
          padding:'0', lineHeight:1, flexShrink:0,
        }}
      >
        ✕
      </button>
    </div>
  );
}