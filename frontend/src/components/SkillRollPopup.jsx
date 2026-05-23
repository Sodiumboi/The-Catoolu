export default function SkillRollPopup({
  label, value, defaultMode,
  onRoll, onClose,
  buttonRect,
}) {
  const modes = [
    { key: 'normal', label: 'Normal' },
    { key: 'adv',    label: 'Adv'    },
    { key: 'dis',    label: 'Dis'    },
  ];

  const fixedStyle = buttonRect ? {
    position:  'fixed',
    top:       buttonRect.bottom + 8,
    left:      buttonRect.left + buttonRect.width / 2,
    transform: 'translateX(-50%)',
  } : {
    position:  'absolute',
    bottom:    'calc(100% + 8px)',
    left:      '50%',
    transform: 'translateX(-50%)',
  };

  return (
    <>
      {/* Click outside to close */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
        }}
        onClick={onClose}
      />

      {/* Popup */}
      <div style={{
        ...fixedStyle,
        background:   'var(--bg-card)',
        border:       '1px solid var(--border-main)',
        borderRadius: '10px',
        boxShadow:    'var(--shadow-dropdown)',
        padding:      '10px 12px',
        zIndex:       100,
        whiteSpace:   'nowrap',
        minWidth:     '180px',
      }}>
        <div style={{
          fontFamily:   'var(--font-sans)',
          fontSize:     '12px',
          color:        'var(--text-muted)',
          marginBottom: '8px',
          textAlign:    'center',
        }}>
          {label} ({value})?
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {modes.map(mode => {
            const isDefault = mode.key === defaultMode;
            return (
              <button
                key={mode.key}
                onClick={() => { onRoll(mode.key); onClose(); }}
                style={{
                  flex:         1,
                  padding:      '6px 4px',
                  borderRadius: '7px',
                  border:       isDefault
                    ? '1.5px solid var(--color-primary)'
                    : '1px solid var(--border-main)',
                  background:   isDefault
                    ? 'var(--accent-bg)'
                    : 'transparent',
                  color:        isDefault
                    ? 'var(--color-primary)'
                    : 'var(--text-secondary)',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     '12px',
                  fontWeight:   isDefault ? '600' : '400',
                  cursor:       'pointer',
                  transition:   'all 0.1s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--accent-bg)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isDefault ? 'var(--accent-bg)' : 'transparent';
                  e.currentTarget.style.borderColor = isDefault ? 'var(--color-primary)' : 'var(--border-main)';
                  e.currentTarget.style.color = isDefault ? 'var(--color-primary)' : 'var(--text-secondary)';
                }}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}