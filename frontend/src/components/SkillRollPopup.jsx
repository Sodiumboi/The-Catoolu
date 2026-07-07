import { createPortal } from 'react-dom';

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

  const POPUP_W = 180;
  const rawCenter = buttonRect ? buttonRect.left + buttonRect.width / 2 : 0;
  const clampedLeft = buttonRect
    ? Math.max(POPUP_W / 2 + 8, Math.min(window.innerWidth - POPUP_W / 2 - 8, rawCenter))
    : 0;

  const POPUP_ESTIMATED_H = 100; // approx rendered height (label + buttons + padding)
  const spaceBelow = buttonRect ? window.innerHeight - buttonRect.bottom - 8 : 0;
  const spaceAbove = buttonRect ? buttonRect.top - 8 : 0;
  const openAbove  = buttonRect && spaceBelow < POPUP_ESTIMATED_H && spaceAbove > spaceBelow;

  const fixedStyle = buttonRect ? {
    position:  'fixed',
    top:        openAbove
      ? Math.max(8, buttonRect.top - 8 - POPUP_ESTIMATED_H)
      : Math.min(buttonRect.bottom + 8, window.innerHeight - POPUP_ESTIMATED_H - 8),
    left:      clampedLeft,
    transform: 'translateX(-50%)',
  } : {
    position:  'absolute',
    bottom:    'calc(100% + 8px)',
    left:      '50%',
    transform: 'translateX(-50%)',
  };

  return createPortal(
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
        background:   'var(--bg-popup)',
        border:       '1px solid var(--border-focus)',
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
                className={`flex-1 py-1.5 px-1 rounded-[7px] font-sans text-xs cursor-pointer transition-colors hover:bg-(--accent-bg) hover:border-(--accent) hover:text-(--accent) ${
                  isDefault
                    ? 'border-[1.5px] border-(--color-primary) bg-(--accent-bg) text-(--color-primary) font-semibold'
                    : 'border border-(--border-main) bg-transparent text-(--text-secondary) font-normal'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}