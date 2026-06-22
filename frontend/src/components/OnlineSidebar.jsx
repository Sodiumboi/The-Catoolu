export default function OnlineSidebar({ members, onlineUsers, myRole, inviteCode }) {
  const onlineIds = new Set(onlineUsers.map(u => u.id));

  return (
    <div style={{
      width:        '220px',
      flexShrink:   0,
      borderLeft:   '1px solid var(--border-main)',
      display:      'flex',
      flexDirection:'column',
      background:   'var(--bg-card)',
      overflowY:    'auto',
      overscrollBehavior: 'contain',
    }}>

      {/* Online members */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-main)' }}>
        <div style={{
          fontSize:      '11px',
          fontWeight:    '500',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color:         'var(--text-muted)',
          marginBottom:  '10px',
        }}>
          Online ({onlineUsers.length})
        </div>
        {onlineUsers.map(user => (
          <div key={user.id} style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '8px',
            padding:    '4px 0',
          }}>
            <span style={{
              width:        '8px',
              height:       '8px',
              borderRadius: '50%',
              background:   '#22c55e',
              flexShrink:   0,
            }} />
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              {user.username}
            </span>
          </div>
        ))}
      </div>

      {/* All members */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-main)' }}>
        <div style={{
          fontSize:      '11px',
          fontWeight:    '500',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color:         'var(--text-muted)',
          marginBottom:  '10px',
        }}>
          Members ({members.length})
        </div>
        {members.map(member => (
          <div key={member.id} style={{
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding:    '4px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width:        '8px',
                height:       '8px',
                borderRadius: '50%',
                background:   onlineIds.has(member.id) ? '#22c55e' : 'var(--text-faint)',
                flexShrink:   0,
              }} />
              <span style={{
                fontSize: '13px',
                color:    onlineIds.has(member.id)
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
              }}>
                {member.username}
              </span>
            </div>
            {member.role === 'keeper' && (
              <span style={{
                fontSize:   '10px',
                color:      'var(--accent)',
                fontWeight: '500',
              }}>
                Keeper
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Invite code — Keeper only */}
      {myRole === 'keeper' && inviteCode && (
        <div style={{ padding: '16px' }}>
          <div style={{
            fontSize:      '11px',
            fontWeight:    '500',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color:         'var(--text-muted)',
            marginBottom:  '8px',
          }}>
            Invite Code
          </div>
          <div style={{
            fontFamily:    'monospace',
            fontSize:      '16px',
            fontWeight:    '700',
            color:         'var(--accent)',
            letterSpacing: '0.15em',
            background:    'var(--bg-section-hd)',
            border:        '1px solid var(--border-main)',
            borderRadius:  '6px',
            padding:       '8px 10px',
            textAlign:     'center',
          }}>
            {inviteCode}
          </div>
        </div>
      )}
    </div>
  );
}