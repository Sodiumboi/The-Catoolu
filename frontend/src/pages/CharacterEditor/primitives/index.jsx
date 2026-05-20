// ── Section wrapper ────────────────────────────────────────
export function Section({ title, children }) {
  return (
    <div className="rounded-lg border mb-6 overflow-hidden"
         style={{ borderColor: 'var(--border-main)', background: 'var(--bg-card)' }}>
      <div className="px-4 py-2 border-b"
           style={{ borderColor: 'var(--border-main)', background: 'var(--bg-section-hd)' }}>
        <h2 className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--accent)' }}>
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Stat box: Reg / Half / Fifth ───────────────────────────
export function StatBox({ label, value, onChange, sublabel }) {
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
          <input
            type="number" min="1" max="99"
            value={value || ''}
            onChange={e => onChange && onChange(e.target.value)}
            className="rounded outline-none font-bold"
            style={{
              width: '48px', height: '48px', fontSize: '1.2rem',
              textAlign: 'center',
              background: 'var(--bg-input)',
              border: '2px solid var(--border-main)',
              color: 'var(--text-primary)',
              MozAppearance: 'textfield',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
          />
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

// ── Tracked stat: Max + Current ────────────────────────────
export function TrackedStat({ label, maxVal, currentVal, onChangeCurrent, thirdLabel, thirdVal }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--accent)' }}>
        {label}
      </span>
      <div className="flex gap-2 items-end">
        <div className="flex flex-col items-center">
          <span className="text-xs mb-0.5" style={{ color: 'var(--text-faint)', fontSize: '9px' }}>Max</span>
          <div className="text-center font-bold rounded flex items-center justify-center"
               style={{
                 width: '44px', height: '44px', fontSize: '1.1rem',
                 background: 'var(--bg-input)',
                 border: '1.5px solid var(--border-input)',
                 color: 'var(--text-muted)',
               }}>
            {maxVal ?? '—'}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs mb-0.5" style={{ color: 'var(--text-faint)', fontSize: '9px' }}>Current</span>
          <input
            type="number"
            value={currentVal ?? maxVal ?? ''}
            onChange={e => onChangeCurrent(e.target.value)}
            className="text-center font-bold rounded outline-none"
            style={{
              width: '44px', height: '44px', fontSize: '1.1rem',
              background: 'var(--bg-input)',
              border: '2px solid var(--border-focus)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-focus)'}
          />
        </div>
        {thirdLabel && (
          <div className="flex flex-col items-center">
            <span className="text-xs mb-0.5" style={{ color: 'var(--text-faint)', fontSize: '9px' }}>{thirdLabel}</span>
            <div className="text-center font-bold rounded flex items-center justify-center"
                 style={{
                   width: '44px', height: '44px', fontSize: '1.1rem',
                   background: 'var(--bg-input)',
                   border: '1.5px solid var(--border-input)',
                   color: 'var(--text-muted)',
                 }}>
              {thirdVal ?? '—'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Backstory textarea ─────────────────────────────────────
export function BackstoryField({ label, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-widest mb-1"
             style={{ color: 'var(--accent)' }}>
        {label}
      </label>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded text-sm outline-none resize-y"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--accent)33',
          color: 'var(--text-primary)',
          lineHeight: '1.6',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border-main)'}
      />
    </div>
  );
}

// ── Personal detail text input ─────────────────────────────
export function DetailInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-1"
             style={{ color: 'var(--accent)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded text-sm outline-none"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--accent)33',
          color: 'var(--text-primary)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border-main)'}
      />
    </div>
  );
}

// ── Read-only badge (Damage Bonus, Build, Dodge, Move) ─────
export function ReadOnlyBadge({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
        {label}
      </div>
      <div className="text-lg font-bold px-4 py-2 rounded"
           style={{ background: 'var(--bg-input)', color, border: '1px solid var(--accent)33' }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

// ── Skill table column headers ─────────────────────────────
export function SkillTableHeader() {
  return (
    <tr className="border-b" style={{ borderColor: 'var(--border-main)' }}>
      <th className="w-3" />
      <th className="text-left py-1.5 pl-1 text-xs uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}>Skill</th>
      <th className="text-center py-1.5 text-xs uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}>Val</th>
      <th className="text-center py-1.5 text-xs uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}>½</th>
      <th className="text-center py-1.5 pr-2 text-xs uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}>⅕</th>
    </tr>
  );
}
