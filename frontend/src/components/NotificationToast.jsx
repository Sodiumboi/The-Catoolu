import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationToast() {
  const { toasts, dismiss } = useNotifications();
  const navigate = useNavigate();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position:      'fixed',
      top:           '72px',
      right:         '24px',
      zIndex:        500,
      display:       'flex',
      flexDirection: 'column',
      gap:           '10px',
      maxWidth:      '340px',
      width:         '100%',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background:   'var(--bg-card)',
            border:       '1px solid var(--border-main)',
            borderRadius: '12px',
            boxShadow:    'var(--shadow-dropdown)',
            padding:      '12px 14px',
            display:      'flex',
            gap:          '12px',
            alignItems:   'flex-start',
            cursor:       'pointer',
            animation:    'slideInFromRight 0.2s ease',
          }}
          onClick={() => {
            navigate('/campaign/' + toast.campaignId);
            dismiss(toast.id);
          }}
        >
          {/* Avatar */}
          <div style={{
            width:          '40px',
            height:         '40px',
            borderRadius:   '50%',
            background:     'var(--color-primary-light)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            overflow:       'hidden',
            border:         '1px solid var(--border-main)',
          }}>
            {toast.avatarUrl ? (
              <img
                src={'http://localhost:3001' + toast.avatarUrl}
                alt={toast.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize:   '14px',
                fontWeight: '600',
                color:      'var(--color-primary-dark)',
              }}>
                {(toast.username || '?').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '6px',
              marginBottom:'2px',
            }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize:   '13px',
                fontWeight: '600',
                color:      'var(--text-primary)',
              }}>
                {toast.username}
              </span>
              <span style={{
                fontSize:  '11px',
                color:     'var(--text-faint)',
              }}>
                in {toast.campaignName}
              </span>
            </div>
            <p style={{
              fontFamily:   'var(--font-sans)',
              fontSize:     '13px',
              color:        'var(--text-secondary)',
              margin:       0,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}>
              {toast.content}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={e => { e.stopPropagation(); dismiss(toast.id); }}
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      'var(--text-faint)',
              fontSize:   '14px',
              padding:    '0',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}