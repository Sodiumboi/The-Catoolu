export default function ChatBubble({ msg, isOwn }) {
  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  // Use character first name if available, else username
  const displayName = msg.character_name
    ? msg.character_name.split(' ')[0]
    : msg.username;

  return (
    <div style={{
      display:       'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems:    'flex-end',
      gap:           '8px',
      marginBottom:  '8px',
    }}>
      {/* Portrait / avatar */}
      {!isOwn && (
        <div style={{
          width:         '32px',
          height:        '32px',
          borderRadius:  '50%',
          overflow:      'hidden',
          flexShrink:    0,
          background:    'var(--color-primary-light)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          border:        '1px solid var(--border-main)',
        }}>
          {msg.portrait ? (
            <img
              src={'data:image/jpeg;base64,' + msg.portrait}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : msg.avatar_url ? (
            <img
              src={msg.avatar_url}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize:   '11px',
              fontWeight: '600',
              color:      'var(--color-primary-dark)',
            }}>
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      )}

      <div style={{ maxWidth: '65%' }}>
        {!isOwn && (
          <div style={{
            fontSize:    '11px',
            color:       'var(--accent)',
            marginBottom:'2px',
            fontWeight:  '500',
            fontFamily:  'var(--font-sans)',
          }}>
            {displayName}
          </div>
        )}

        <div style={{
          background:   isOwn ? 'var(--color-primary)' : 'var(--bg-card)',
          color:        isOwn ? '#ffffff' : 'var(--text-primary)',
          border:       isOwn ? 'none' : '1px solid var(--border-main)',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding:      '8px 12px',
          fontSize:     '14px',
          lineHeight:   '1.5',
          wordBreak:    'break-word',
          fontFamily:   'var(--font-sans)',
        }}>
          {msg.content}
        </div>

        <div style={{
          fontSize:  '10px',
          color:     'var(--text-faint)',
          marginTop: '3px',
          textAlign: isOwn ? 'right' : 'left',
        }}>
          {time}
        </div>
      </div>
    </div>
  );
}