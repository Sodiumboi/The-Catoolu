// ── StatBox ──────────────────────────────────────────────────────────
// One characteristic as a card: label / large value / half+fifth row.
//   editable → transparent underline input in the value slot
//   compact  → smaller sizing for the keeper read-only panel

export default function StatBox({ label, sublabel, value, editable = false, onChange, compact = false }) {
  const num   = parseInt(value) || 0;
  const half  = Math.floor(num / 2);
  const fifth = Math.floor(num / 5);

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           compact ? '3px' : '4px',
      padding:       compact ? '6px 8px' : '8px 10px',
      borderRadius:  compact ? '8px' : '10px',
      border:        '1px solid var(--border-main)',
      background:    'var(--bg-input)',
      minWidth:      compact ? '54px' : '64px',
    }}>
      {label && (
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <span style={{
            display:       'block',
            fontSize:      compact ? '11px' : '12px',
            fontWeight:    '700',
            color:         'var(--accent)',
            fontFamily:    'var(--font-sans)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {label}
          </span>
          <span style={{
            display:       'block',
            fontSize:      compact ? '7px' : '8px',
            color:         'var(--text-faint)',
            fontFamily:    'var(--font-sans)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginTop:     '1px',
            visibility:    sublabel ? 'visible' : 'hidden',
          }}>
            {sublabel || 'X'}
          </span>
        </div>
      )}

      {editable ? (
        <input
          type="number" min="1" max="99"
          value={value || ''}
          onChange={e => onChange && onChange(e.target.value)}
          style={{
            width:         compact ? '42px' : '52px',
            height:        compact ? '32px' : '40px',
            fontSize:      compact ? '18px' : '22px',
            fontWeight:    '700',
            fontFamily:    'var(--font-serif)',
            textAlign:     'center',
            background:    'transparent',
            border:        'none',
            borderBottom:  '2px solid var(--border-input)',
            color:         'var(--text-primary)',
            outline:       'none',
            MozAppearance: 'textfield',
            padding:       0,
          }}
          onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
          onBlur={e  => e.target.style.borderBottomColor = 'var(--border-input)'}
        />
      ) : (
        <div style={{
          fontSize:   compact ? '18px' : '22px',
          fontWeight: '700',
          fontFamily: 'var(--font-serif)',
          color:      'var(--text-primary)',
          lineHeight: 1,
          padding:    compact ? '4px 0 2px' : '6px 0 4px',
        }}>
          {num}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px' }}>
        <span style={{ fontSize: compact ? '10px' : '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
          {half}
        </span>
        <span style={{ fontSize: compact ? '10px' : '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
          {fifth}
        </span>
      </div>
    </div>
  );
}
