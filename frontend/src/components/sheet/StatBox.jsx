// ── StatBox ──────────────────────────────────────────────────────────
// One characteristic shown as Reg / Half / Fifth. Pure display.
//   editable → 48px number input in the Reg slot (OG Editor)
//   read-only → a static box of identical size (KeeperSheet)
// Half and Fifth are always derived and always static.

export default function StatBox({ label, sublabel, value, editable = false, onChange }) {
  const num   = parseInt(value) || 0;
  const half  = Math.floor(num / 2);
  const fifth = Math.floor(num / 5);

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <div className="flex flex-col items-center">
          <span className="font-bold uppercase leading-none"
                style={{ color: 'var(--accent)', fontSize: '13px' }}>
            {label}
          </span>
          {sublabel && (
            <span className="leading-none mt-0.5"
                  style={{ color: 'var(--text-faint)', fontSize: '8px' }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
      <div className="flex gap-1 items-end">
        <div className="flex flex-col items-center">
          <span className="mb-0.5" style={{ color: 'var(--text-faint)', fontSize: '9px' }}>Reg</span>
          {editable ? (
            <input
              type="number" min="1" max="99"
              value={value || ''}
              onChange={e => onChange && onChange(e.target.value)}
              className="rounded outline-none font-bold"
              style={{
                width: '48px', height: '48px', fontSize: '1.2rem',
                textAlign: 'center',
                background: 'var(--bg-input)',
                border: '2px solid var(--border-input)',
                color: 'var(--text-primary)',
                MozAppearance: 'textfield',
                transition: 'border-color 0.12s ease',
              }}
              onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-focus)'; }}
              onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-input)'; }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
            />
          ) : (
            <div className="rounded font-bold flex items-center justify-center"
                 style={{
                   width: '48px', height: '48px', fontSize: '1.2rem',
                   textAlign: 'center',
                   background: 'var(--bg-input)',
                   border: '2px solid var(--border-input)',
                   color: 'var(--text-primary)',
                 }}>
              {num}
            </div>
          )}
        </div>
        {[['½', half], ['⅕', fifth]].map(([lbl, val]) => (
          <div key={lbl} className="flex flex-col items-center">
            <span className="mb-0.5" style={{ color: 'var(--text-faint)', fontSize: '9px' }}>{lbl}</span>
            <div className="rounded font-bold flex items-center justify-center"
                 style={{
                   width: '38px', height: '38px', fontSize: '0.95rem',
                   textAlign: 'center',
                   background: 'var(--bg-input)',
                   border: '1.5px solid var(--border-input)',
                   color: 'var(--text-muted)',
                 }}>
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
