import { useState, useRef } from 'react';

const POPUP_W = 130;

export default function SessionTrackedStat({
  label,
  maxVal,
  currentVal,
  insaneVal,
  characterId,
  statKey,
  onSave,
  rollable,
  onRoll,
  advMode,
  disMode,
}) {
  const [showPopup, setShowPopup] = useState(false);
  const [pending,   setPending]   = useState(null);
  const [btnRect,   setBtnRect]   = useState(null);
  const btnRef = useRef(null);

  const currentNum = parseInt(currentVal ?? maxVal ?? 0);

  const handleOpen = () => {
    const rect = btnRef.current?.getBoundingClientRect() ?? null;
    setBtnRect(rect);
    setShowPopup(p => !p);
    setPending(null);
  };

  const handleMinus   = () => setPending(prev => (prev ?? currentNum) - 1);
  const handlePlus    = () => setPending(prev => (prev ?? currentNum) + 1);

  const handleConfirm = () => {
    if (pending !== null && pending !== currentNum) {
      onSave(statKey, String(currentNum), String(pending), characterId);
    }
    setShowPopup(false);
    setPending(null);
  };

  const handleClose = () => { setShowPopup(false); setPending(null); };

  const displayVal    = pending ?? currentNum;
  const changed       = pending !== null && pending !== currentNum;
  const rollModeLabel = advMode ? ' Adv' : disMode ? ' Dis' : '';

  // Fixed popup position — below button, clamped to viewport
  const popupStyle = btnRect ? {
    position:  'fixed',
    top:       btnRect.bottom + 6,
    left:      Math.max(
      POPUP_W / 2 + 8,
      Math.min(window.innerWidth - POPUP_W / 2 - 8, btnRect.left + btnRect.width / 2)
    ),
    transform: 'translateX(-50%)',
    zIndex:    100,
  } : { display: 'none' };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Label */}
      <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-(--accent) font-sans">
        {label}
      </span>

      {/* Max + Now */}
      <div className="flex gap-1 items-end">
        {/* Max */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-(--text-faint) mb-0.5">Max</span>
          <div className="w-9 h-9 rounded-[7px] bg-(--bg-input) border-[1.5px] border-(--border-input) flex items-center justify-center font-serif text-sm text-(--text-muted)">
            {maxVal ?? '—'}
          </div>
        </div>

        {/* Now — clickable */}
        <div className="flex flex-col items-center relative">
          <span className="text-[9px] text-(--text-faint) mb-0.5">Now</span>
          <button
            ref={btnRef}
            onClick={handleOpen}
            className="w-10.5 h-10.5 rounded-[7px] border-2 border-(--border-focus) bg-(--bg-input) text-(--text-primary) font-serif text-lg font-bold cursor-pointer flex items-center justify-center [transition:border-color_0.15s]"
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
          >
            {currentNum}
          </button>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <>
          <div className="fixed inset-0 z-90" onClick={handleClose} />
          {/* This whole block stays inline — popupStyle is runtime DOM-measured geometry (btnRect/window dimensions), merged into one style object with the rest of the popup's visual properties */}
          <div style={{
            ...popupStyle,
            background:    'var(--bg-popup)',
            border:        '1px solid var(--border-focus)',
            borderRadius:  '10px',
            boxShadow:     'var(--shadow-dropdown)',
            padding:       '10px 12px',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '8px',
            minWidth:      POPUP_W + 'px',
          }}>
            {/* Header */}
            <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-(--accent) font-sans">
              {label} {maxVal && '(' + maxVal + ')'}
            </div>

            {/* Value */}
            <div className={`font-serif text-[28px] font-bold min-w-10 text-center [transition:color_0.15s] ${changed ? 'text-(--color-primary)' : 'text-(--text-primary)'}`}>
              {displayVal}
            </div>

            {/* − ✓ + */}
            <div className="flex gap-1.5 items-center">
              {/* color stays inline — btnCssBase's only data-driven parameter, everything else is static */}
              <button onClick={handleMinus} className={btnCssBase} style={{ color: 'var(--danger)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                <span className="icon icon-sm">remove</span>
              </button>
              <button onClick={handleConfirm} className={`${btnCssBase} border-none [color:inherit] ${changed ? 'bg-(--color-primary)' : 'bg-(--bg-section-hd)'}`}>
                <span className={`icon icon-sm ${changed ? 'text-white' : 'text-(--text-muted)'}`}>check</span>
              </button>
              <button onClick={handlePlus} className={btnCssBase} style={{ color: 'var(--success)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                <span className="icon icon-sm">add</span>
              </button>
            </div>

            {/* Roll Sanity */}
            {rollable && (
              <>
                <div className="w-full h-px bg-(--border-main)" />
                <button
                  onClick={() => { onRoll?.(advMode ? 'adv' : disMode ? 'dis' : 'normal'); handleClose(); }}
                  className="w-full py-1.25 px-0 rounded-[7px] border border-(--border-main) bg-transparent text-(--accent) font-sans text-[11px] font-medium cursor-pointer flex items-center justify-center gap-1 [transition:all_0.1s]"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="icon icon-sm">casino</span>
                  Roll {label}{rollModeLabel} ({displayVal})
                </button>
              </>
            )}

            {/* Insane threshold */}
            {insaneVal !== undefined && (
              <div className="text-[10px] text-(--danger) font-sans">
                Insane below {insaneVal}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared button style helper (mirrors SessionSheet's MoneyField) ───
const btnCssBase = 'w-8 h-8 rounded-lg border border-(--border-main) bg-(--bg-input) cursor-pointer flex items-center justify-center [transition:all_0.1s]';
