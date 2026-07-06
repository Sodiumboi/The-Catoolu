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
    <div className="min-h-screen bg-(--bg-page) flex flex-col font-sans">
      <NavBar activeTab="inbox" />

      <main className="animate-fade-rise max-w-[680px] mx-auto py-8 px-6 flex-1 w-full">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-[28px] text-(--text-primary) m-0 mb-1">
              Notifications
            </h1>
            <p className="text-[13px] text-(--text-muted) m-0">
              {loading ? 'Loading...' :
               notifications.length === 0 ? 'All caught up' :
               unreadCount > 0
                 ? unreadCount + ' unread'
                 : notifications.length + ' notifications'}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="btn-secondary btn-secondary-sm"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={handleClear}
                className="btn-secondary btn-secondary-sm"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-[72px] rounded-xl bg-(--bg-card) border border-(--border-main) opacity-50" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-20 px-5">
            <div className="mb-3 opacity-30">
              <span className="icon text-5xl">notifications</span>
            </div>
            <p className="font-serif text-lg text-(--text-primary) m-0 mb-2">
              All caught up
            </p>
            <p className="text-[13px] text-(--text-muted) m-0">
              Messages and dice rolls from campaigns will appear here
              when you're away.
            </p>
          </div>
        )}

        {/* Notification list */}
        {!loading && notifications.length > 0 && (
          <div className="flex flex-col gap-2">

            {/* Pinned invites section */}
            {notifications.some(n => n.is_pinned) && (
              <>
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-(--accent) mb-1">
                  <span className="icon icon-sm">push_pin</span>{' '}Invites
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
                <div className="border-t border-(--border-main) my-2" />
              </>
            )}

            {/* Regular notifications */}
            {notifications.some(n => !n.is_pinned) && (
              <>
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) mb-1">
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
      className={`flex items-start gap-3 py-3 px-3.5 rounded-xl cursor-pointer [transition:all_0.15s_ease] relative ${notif.is_read ? 'bg-(--bg-card) [border:1px_solid_var(--border-main)44]' : 'bg-(--accent-bg) [border:1px_solid_var(--accent)44]'}`}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <div className="absolute top-3 right-10 w-2 h-2 rounded-full bg-(--accent)" />
      )}

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-(--color-primary-light) flex items-center justify-center shrink-0 overflow-hidden border border-(--border-main)">
        {notif.avatar_url ? (
          <img
            src={API_BASE + notif.avatar_url}
            alt={notif.sender_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-sans text-sm font-semibold text-(--color-primary-dark)">
            {(notif.sender_name || '?').slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-[3px] gap-2">
          <span className="font-sans text-[13px] font-semibold text-(--text-primary)">
            {notif.sender_name}
          </span>
          <span className="text-[11px] text-(--text-faint) shrink-0">
            {time}
          </span>
        </div>
        {notif.campaign_name && (
          <div className="text-[11px] text-(--accent) mb-[3px]">
            {notif.type === 'roll'
              ? <span className="icon icon-sm">casino</span>
              : <span className="icon icon-sm">chat</span>
            }{' '}{notif.campaign_name}
          </div>
        )}
        <p className="font-sans text-[13px] text-(--text-secondary) m-0 truncate">
          {notif.content}
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        className="bg-transparent border-none cursor-pointer text-(--text-faint) text-sm p-0 leading-none shrink-0"
      >
        <span className="icon icon-sm">close</span>
      </button>
    </div>
  );
}