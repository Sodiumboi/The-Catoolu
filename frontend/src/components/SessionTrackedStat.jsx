import { useState, useRef } from 'react';

export default function SessionTrackedStat({
  label,
  maxVal,
  currentVal,
  insaneVal,
  statKey,
  onSave,
}) {
  const [value,   setValue]   = useState(String(currentVal ?? maxVal ?? ''));
  const [saved,   setSaved]   = useState(false);
  const prevRef               = useRef(String(currentVal ?? maxVal ?? ''));

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed === prevRef.current) return; // no change
    if (trimmed === '' || isNaN(parseInt(trimmed))) {
      setValue(prevRef.current); // revert invalid input
      return;
    }
    const oldVal = prevRef.current;
    prevRef.current = trimmed;
    onSave(statKey, oldVal, trimmed);
    // Flash saved indicator
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const accent = saved ? 'var(--success)' : 'var(--border-focus)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
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

      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
        {/* Max */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-faint)', marginBottom: '2px' }}>Max</span>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border-input)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-serif)', fontSize: '16px',
            color: 'var(--text-muted)',
          }}>
            {maxVal ?? '—'}
          </div>
        </div>

        {/* Current — editable */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-faint)', marginBottom: '2px' }}>
            {saved ? '✓' : 'Now'}
          </span>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={handleBlur}
            style={{
              width: '44px', height: '44px', borderRadius: '8px',
              border: '2px solid ' + accent,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-serif)', fontSize: '18px',
              fontWeight: '700',
              textAlign: 'center', outline: 'none',
              transition: 'border-color 0.15s ease',
              MozAppearance: 'textfield',
            }}
          />
        </div>

        {/* Insane threshold — Sanity only */}
        {insaneVal !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-faint)', marginBottom: '2px' }}>Ins.</span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'var(--bg-input)',
              border: '1.5px solid var(--border-input)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontSize: '14px',
              color: 'var(--danger)',
            }}>
              {insaneVal ?? '—'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}