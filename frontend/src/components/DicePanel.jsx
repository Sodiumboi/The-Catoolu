const DICE = [4, 6, 8, 10, 12, 20, 100];

export default function DicePanel({ onRoll, advMode, disMode, onToggleAdv, onToggleDis }) {

  const handleDie = (sides) => {
    const suffix = advMode ? 'adv' : disMode ? 'dis' : '';
    onRoll('1d' + sides + suffix);
  };

  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        '6px',
      padding:    '8px 16px 0',
      flexWrap:   'wrap',
    }}>

      {/* Die buttons */}
      {DICE.map(sides => (
        <button
          key={sides}
          onClick={() => handleDie(sides)}
          title={'Roll 1d' + sides + (advMode ? ' with advantage' : disMode ? ' with disadvantage' : '')}
          style={{
            padding:      '4px 10px',
            borderRadius: '6px',
            border:       '1px solid var(--border-main)',
            background:   'var(--bg-card)',
            color:        sides === 100
              ? 'var(--accent)'
              : 'var(--text-secondary)',
            fontFamily:   'var(--font-sans)',
            fontSize:     '12px',
            fontWeight:   sides === 100 ? '600' : '400',
            cursor:       'pointer',
            transition:   'all 0.1s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background   = 'var(--accent-bg)';
            e.currentTarget.style.borderColor  = 'var(--accent)';
            e.currentTarget.style.color        = 'var(--accent)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background   = 'var(--bg-card)';
            e.currentTarget.style.borderColor  = 'var(--border-main)';
            e.currentTarget.style.color        = sides === 100
              ? 'var(--accent)'
              : 'var(--text-secondary)';
          }}
        >
          D{sides}
        </button>
      ))}

      {/* Divider */}
      <div style={{
        width:      '1px',
        height:     '20px',
        background: 'var(--border-main)',
        margin:     '0 2px',
      }} />

      {/* Advantage toggle */}
      <button
        onClick={onToggleAdv}
        title="Advantage — roll twice, take lower"
        style={{
          padding:      '4px 10px',
          borderRadius: '6px',
          border:       '1px solid ' + (advMode ? 'var(--accent)' : 'var(--border-main)'),
          background:   advMode ? 'var(--accent-bg)' : 'var(--bg-card)',
          color:        advMode ? 'var(--accent)'    : 'var(--text-faint)',
          fontFamily:   'var(--font-sans)',
          fontSize:     '11px',
          fontWeight:   advMode ? '600' : '400',
          cursor:       'pointer',
          transition:   'all 0.15s ease',
        }}
      >
        Adv
      </button>

      {/* Disadvantage toggle */}
      <button
        onClick={onToggleDis}
        title="Disadvantage — roll twice, take higher"
        style={{
          padding:      '4px 10px',
          borderRadius: '6px',
          border:       '1px solid ' + (disMode ? 'var(--danger)' : 'var(--border-main)'),
          background:   disMode ? 'var(--danger-bg)' : 'var(--bg-card)',
          color:        disMode ? 'var(--danger)'    : 'var(--text-faint)',
          fontFamily:   'var(--font-sans)',
          fontSize:     '11px',
          fontWeight:   disMode ? '600' : '400',
          cursor:       'pointer',
          transition:   'all 0.15s ease',
        }}
      >
        Dis
      </button>

      {/* Active mode label */}
      {(advMode || disMode) && (
        <span style={{
          fontSize:  '11px',
          color:     advMode ? 'var(--accent)' : 'var(--danger)',
          fontStyle: 'italic',
        }}>
          {advMode ? '↓ taking lower' : '↑ taking higher'}
        </span>
      )}
    </div>
  );
}