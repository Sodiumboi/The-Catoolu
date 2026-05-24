const DICE = [4, 6, 8, 10, 12, 20, 100];

export default function DiceRow({
  advMode, disMode,
  rollVisibility,
  onToggleAdv, onToggleDis,
  onToggleVisibility,
  onRoll,
}) {
  const handleDie = (sides, shiftKey = false) => {
    const suffix = advMode ? 'adv' : disMode ? 'dis' : '';
    const notation = '1d' + sides + suffix;
    onRoll(notation, shiftKey);
  };

  return (
    <div className="dice-row" style={{
      display:        'flex',
      alignItems:     'center',
      gap:            '5px',
      padding:        '8px 12px 4px',
      borderTop:      '1px solid var(--border-main)',
      background:     'var(--bg-nav)',
      overflowX:      'auto',
      flexWrap:       'nowrap',
      scrollbarWidth: 'none',
    }}>
      {DICE.map(sides => {
        return (
          <button
            key={sides}
            onClick={e => handleDie(sides, e.shiftKey)}
            title={'Roll 1d' + sides + (advMode ? ' Adv' : disMode ? ' Dis' : '')
              + '\nShift+click for a surprise 🎉'}
            style={{
              padding:      '4px 9px',
              borderRadius: '6px',
              border:       '1px solid var(--border-main)',
              background:   'var(--bg-card)',
              color:        'var(--text-secondary)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '12px',
              fontWeight:   '400',
              cursor:       'pointer',
              transition:   'all 0.1s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background   = 'var(--accent-bg)';
              e.currentTarget.style.borderColor  = 'var(--accent)';
              e.currentTarget.style.color        = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-main)';
              e.currentTarget.style.color       = 'var(--text-secondary)';
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
        <span className="icon icon-sm" style={{ marginRight: '2px' }}>trending_down</span>Adv
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
        <span className="icon icon-sm" style={{ marginRight: '2px' }}>trending_up</span>Dis
      </button>

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: 'var(--border-main)', margin: '0 2px' }} />

      {/* Roll Visibility */}
      <button
        onClick={onToggleVisibility}
        title={rollVisibility === 'everyone'
          ? 'Rolls visible to everyone — click for Only Me'
          : 'Rolls only visible to you — click for Everyone'}
        style={{
          padding:     '4px 9px',
          borderRadius:'6px',
          border:      '1px solid ' + (rollVisibility === 'only_me'
            ? 'var(--warning)'
            : 'var(--border-main)'),
          background:  rollVisibility === 'only_me'
            ? 'rgba(186,117,23,0.1)'
            : 'var(--bg-card)',
          color:       rollVisibility === 'only_me'
            ? 'var(--warning)'
            : 'var(--text-faint)',
          fontFamily:  'var(--font-sans)',
          fontSize:    '11px',
          fontWeight:  rollVisibility === 'only_me' ? '600' : '400',
          cursor:      'pointer',
          transition:  'all 0.15s ease',
          whiteSpace:  'nowrap',
        }}
      >
        {rollVisibility === 'only_me'
          ? <><span className="icon icon-sm">lock</span>{' '}Only Me</>
          : <><span className="icon icon-sm">visibility</span>{' '}Everyone</>
        }
      </button>

    </div>
  );
}