export default function StatValueCard({ msg }) {
  // content format: { stat, oldVal, newVal, characterName }
  const data = typeof msg.content === 'string'
    ? (() => { try { return JSON.parse(msg.content); } catch { return null; } })()
    : msg.content;

  if (!data) return null;

  const decreased = parseInt(data.newVal) < parseInt(data.oldVal);

  return (
    <div style={{
      background:   'var(--bg-section-hd)',
      border:       '1px solid var(--border-main)',
      borderRadius: '10px',
      padding:      '10px 14px',
      marginBottom: '8px',
    }}>
      <div style={{
        fontSize:     '12px',
        color:        'var(--text-muted)',
        marginBottom: '8px',
        fontFamily:   'var(--font-sans)',
      }}>
        {data.characterName || msg.username} changed {data.stat}
      </div>

      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '10px',
        fontFamily: 'var(--font-serif)',
      }}>
        {/* Old value */}
        <div style={{
          width:         '44px',
          height:        '44px',
          borderRadius:  '8px',
          border:        '1.5px solid var(--border-main)',
          background:    'var(--bg-input)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          fontSize:      '20px',
          color:         'var(--text-muted)',
          textDecoration:'line-through',
        }}>
          {data.oldVal}
        </div>

        {/* Arrow */}
        <div style={{
          fontSize: '18px',
          color:    decreased ? 'var(--danger)' : 'var(--success)',
        }}>
          {decreased ? '↓' : '↑'}
        </div>

        {/* New value */}
        <div style={{
          width:         '44px',
          height:        '44px',
          borderRadius:  '8px',
          border:        '2px solid ' + (decreased ? 'var(--danger)' : 'var(--success)'),
          background:    decreased ? 'var(--danger-bg)' : 'var(--accent-bg)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          fontSize:      '20px',
          fontWeight:    '700',
          color:         decreased ? 'var(--danger)' : 'var(--success)',
        }}>
          {data.newVal}
        </div>
      </div>
    </div>
  );
}