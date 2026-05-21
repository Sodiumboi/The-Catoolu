const DICE = [4, 6, 8, 10, 12, 20, 100];

export default function DiceRow({
  advMode, disMode,
  hideResults,
  onToggleAdv, onToggleDis, onToggleHide,
  onRoll,
  text, setText,
}) {
  const handleDie = (sides, shiftKey = false) => {
    const suffix = advMode ? 'adv' : disMode ? 'dis' : '';
    const notation = '1d' + sides + suffix;
    onRoll(notation, shiftKey);
  };

  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        '5px',
      padding:    '8px 12px 4px',
      flexWrap:   'wrap',
      borderTop:  '1px solid var(--border-main)',
      background: 'var(--bg-nav)',
    }}>
      {DICE.map(sides => {
        const isD100 = sides === 100;
        return (
          <button
            key={sides}
            onClick={e => handleDie(sides, e.shiftKey)}
            title={'Roll 1d' + sides + (advMode ? ' Adv' : disMode ? ' Dis' : '')
              + '\nShift+click for a surprise 🎉'}
            style={{
              padding:      '4px 9px',
              borderRadius: '6px',
              border:       isD100
                ? '1.5px solid var(--color-primary)'
                : '1px solid var(--border-main)',
              background:   isD100 ? 'var(--accent-bg)' : 'var(--bg-card)',
              color:        isD100 ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '12px',
              fontWeight:   isD100 ? '600' : '400',
              cursor:       'pointer',
              transition:   'all 0.1s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background   = 'var(--accent-bg)';
              e.currentTarget.style.borderColor  = 'var(--accent)';
              e.currentTarget.style.color        = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = isD100 ? 'var(--accent-bg)' : 'var(--bg-card)';
              e.currentTarget.style.borderColor = isD100 ? 'var(--color-primary)' : 'var(--border-main)';
              e.currentTarget.style.color       = isD100 ? 'var(--color-primary)' : 'var(--text-secondary)';
            }}
          >
            D{sides}
          </button>
        );
      })}

      <div style={{ width: '1px', height: '20px', background: 'var(--border-main)', margin: '0 2px' }} />

      {/* Adv */}
      <button onClick={onToggleAdv}
        style={{
          padding:    '4px 9px', borderRadius: '6px', fontFamily: 'var(--font-sans)',
          fontSize:   '11px', fontWeight: advMode ? '600' : '400', cursor: 'pointer',
          border:     '1px solid ' + (advMode ? 'var(--accent)' : 'var(--border-main)'),
          background: advMode ? 'var(--accent-bg)' : 'var(--bg-card)',
          color:      advMode ? 'var(--accent)'    : 'var(--text-faint)',
          transition: 'all 0.1s ease',
        }}>
        Adv
      </button>

      {/* Dis */}
      <button onClick={onToggleDis}
        style={{
          padding:    '4px 9px', borderRadius: '6px', fontFamily: 'var(--font-sans)',
          fontSize:   '11px', fontWeight: disMode ? '600' : '400', cursor: 'pointer',
          border:     '1px solid ' + (disMode ? 'var(--danger)' : 'var(--border-main)'),
          background: disMode ? 'var(--danger-bg)' : 'var(--bg-card)',
          color:      disMode ? 'var(--danger)'    : 'var(--text-faint)',
          transition: 'all 0.1s ease',
        }}>
        Dis
      </button>

      {/* Hide Results */}
      <button onClick={onToggleHide}
        style={{
          padding:    '4px 9px', borderRadius: '6px', fontFamily: 'var(--font-sans)',
          fontSize:   '11px', cursor: 'pointer',
          border:     '1px solid var(--border-main)',
          background: hideResults ? 'var(--bg-section-hd)' : 'var(--bg-card)',
          color:      hideResults ? 'var(--text-primary)'  : 'var(--text-faint)',
          transition: 'all 0.1s ease',
          marginLeft: 'auto',
        }}>
        {hideResults ? 'Show Results' : 'Hide Results'}
      </button>
    </div>
  );
}