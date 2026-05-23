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

  const displayVal = pending ?? currentNum;
  const changed    = pending !== null && pending !== currentNum;

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {/* Label */}
      <span style={{
        fontSize:      '10px',
        fontWeight:    '600',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color:         'var(--accent)',
        fontFamily:    'var(--font-sans)',
      }}>
        {label}
      </span>

      {/* Max + Now */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
        {/* Max */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-faint)', marginBottom: '2px' }}>Max</span>
          <div style={{
            width: '36px', height: '36px', borderRadius: '7px',
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border-input)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-serif)', fontSize: '14px',
            color: 'var(--text-muted)',
          }}>
            {maxVal ?? '—'}
          </div>
        </div>

        {/* Now — clickable */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-faint)', marginBottom: '2px' }}>Now</span>
          <button
            ref={btnRef}
            onClick={handleOpen}
            style={{
              width:        '42px',
              height:       '42px',
              borderRadius: '7px',
              border:       '2px solid var(--border-focus)',
              background:   'var(--bg-input)',
              color:        'var(--text-primary)',
              fontFamily:   'var(--font-serif)',
              fontSize:     '18px',
              fontWeight:   '700',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              transition:   'border-color 0.15s ease',
            }}
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
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={handleClose} />
          <div style={{
            ...popupStyle,
            background:    'var(--bg-card)',
            border:        '1px solid var(--border-main)',
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
            <div style={{
              fontSize: '10px', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              color: 'var(--accent)', fontFamily: 'var(--font-sans)',
            }}>
              {label} {maxVal && '(' + maxVal + ')'}
            </div>

            {/* Value */}
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '700',
              color: changed ? 'var(--color-primary)' : 'var(--text-primary)',
              minWidth: '40px', textAlign: 'center', transition: 'color 0.15s ease',
            }}>
              {displayVal}
            </div>

            {/* − ✓ + */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button onClick={handleMinus} style={btnCss('var(--danger)')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                <span className="icon icon-sm">remove</span>
              </button>
              <button onClick={handleConfirm} style={{
                ...btnCss(),
                background:  changed ? 'var(--color-primary)' : 'var(--bg-section-hd)',
                border:      'none',
              }}>
                <span className="icon icon-sm" style={{ color: changed ? '#fff' : 'var(--text-muted)' }}>check</span>
              </button>
              <button onClick={handlePlus} style={btnCss('var(--success)')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                <span className="icon icon-sm">add</span>
              </button>
            </div>

            {/* Roll Sanity */}
            {rollable && (
              <>
                <div style={{ width: '100%', height: '1px', background: 'var(--border-main)' }} />
                <button
                  onClick={() => { onRoll?.(); handleClose(); }}
                  style={{
                    width: '100%', padding: '5px 0', borderRadius: '7px',
                    border: '1px solid var(--border-main)', background: 'transparent',
                    color: 'var(--accent)', fontFamily: 'var(--font-sans)',
                    fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    transition: 'all 0.1s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="icon icon-sm">casino</span>
                  Roll Sanity ({displayVal})
                </button>
              </>
            )}

            {/* Insane threshold */}
            {insaneVal !== undefined && (
              <div style={{ fontSize: '10px', color: 'var(--danger)', fontFamily: 'var(--font-sans)' }}>
                Insane below {insaneVal}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function btnCss(color) {
  return {
    width: '32px', height: '32px', borderRadius: '8px',
    border: '1px solid var(--border-main)',
    background: 'var(--bg-input)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: color ?? 'inherit', transition: 'all 0.1s ease',
  };
}
