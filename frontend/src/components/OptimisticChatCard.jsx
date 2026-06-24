import UploadProgressBar from './UploadProgressBar';

// Discord-style optimistic placeholder for an in-flight chat-image upload.
// Renders own-user aligned (row-reverse). While `error` is null it shows aggregate
// upload progress; on error it shows the message + a Dismiss action.
export default function OptimisticChatCard({ progress, error, onDismiss }) {
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'row-reverse',
      alignItems:    'flex-end',
      gap:           8,
      marginBottom:  8,
    }}>
      <div style={{
        background:   error ? 'var(--danger-bg)' : 'var(--color-primary)',
        color:        error ? 'var(--danger)' : '#ffffff',
        border:       error ? '1px solid var(--danger)' : 'none',
        borderRadius: '16px 16px 4px 16px',
        padding:      '8px 12px',
        minWidth:     160,
        maxWidth:     '65%',
        fontFamily:   'var(--font-sans)',
        fontSize:     14,
      }}>
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>error</span>
              <span style={{ flex: 1, fontSize: 12, lineHeight: 1.4 }}>{error}</span>
            </div>
            <button
              onClick={() => onDismiss?.()}
              style={{
                alignSelf:  'flex-end',
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                color:      'var(--danger)',
                fontFamily: 'var(--font-sans)',
                fontSize:   12,
                fontWeight: 600,
                padding:    0,
                textDecoration: 'underline',
              }}
            >
              Dismiss
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Uploading…</span>
            <UploadProgressBar progress={progress ?? 0} />
          </div>
        )}
      </div>
    </div>
  );
}
