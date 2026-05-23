export default function StatValueCard({ msg, isOwn }) {
  const data = typeof msg.content === 'string'
    ? (() => { try { return JSON.parse(msg.content); } catch { return null; } })()
    : msg.content;

  if (!data) return null;

  const decreased = parseInt(data.newVal) < parseInt(data.oldVal);
  const accentColor = decreased ? 'var(--danger)' : 'var(--success)';

  const statLabels = { HitPts: 'HP', MagicPts: 'MP', Luck: 'Luck', Sanity: 'Sanity' };
  const label      = statLabels[data.stat] || data.stat;
  const name       = data.characterName || msg.username || 'Someone';

  const time = msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div style={{
      display:        'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom:   '6px',
      paddingLeft:    isOwn ? '80px' : '0',
      paddingRight:   isOwn ? '0'    : '80px',
    }}>
      <div style={{
        display:      'flex',
        borderRadius: '10px',
        overflow:     'hidden',
        border:       '1px solid var(--border-main)',
        background:   'var(--bg-card)',
        opacity:      0.82,
        minWidth:     '200px',
        maxWidth:     '300px',
      }}>
        {/* Left accent strip */}
        <div style={{
          width:      '3px',
          flexShrink: 0,
          background: accentColor,
          opacity:    0.5,
        }} />

        {/* Content */}
        <div style={{ flex: 1, padding: '8px 12px' }}>

          {/* Label row */}
          <div style={{
            fontSize:      '10px',
            fontWeight:    '600',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color:         'var(--text-faint)',
            fontFamily:    'var(--font-sans)',
            marginBottom:  '6px',
          }}>
            {name} · {label}
          </div>

          {/* Values */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'flex-start',
            gap:            '8px',
          }}>
            {/* Old value */}
            <div style={{
              minWidth:       '36px',
              height:         '40px',
              borderRadius:   '6px',
              border:         '1px solid var(--border-main)',
              background:     'var(--bg-input)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontFamily:     'var(--font-serif)',
              fontSize:       '16px',
              fontWeight:     '700',
              color:          'var(--text-faint)',
              textDecoration: 'line-through',
              padding:        '0 6px',
            }}>
              {data.oldVal}
            </div>

            {/* Arrow */}
            <div style={{ fontSize: '14px', color: accentColor, opacity: 0.7 }}>
              {decreased ? '↓' : '↑'}
            </div>

            {/* New value */}
            <div style={{
              minWidth:       '36px',
              height:         '40px',
              borderRadius:   '6px',
              border:         `1px solid ${accentColor}`,
              background:     'var(--bg-input)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontFamily:     'var(--font-serif)',
              fontSize:       '18px',
              fontWeight:     '700',
              color:          accentColor,
              padding:        '0 6px',
            }}>
              {data.newVal}
            </div>

            {/* Time inline */}
            <div style={{
              fontSize:   '10px',
              color:      'var(--text-faint)',
              fontFamily: 'var(--font-sans)',
              marginLeft: 'auto',
              alignSelf:  'flex-end',
              paddingBottom: '2px',
            }}>
              {time}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
