import { calcDodge } from '../../utils/cocCalculations';

// ── DerivedStats ─────────────────────────────────────────────────────
// HP / MP / Luck / Sanity (tracked) + Damage Bonus / Build / Dodge / Move.
//
// TrackedStats accepts `horizontal` — renders all four stats in a row
// with vertical dividers between them (editor / read-only sheet style).
// Without it, stats stack vertically (legacy / compact uses).

// ── Vertical divider used between stat groups ─────────────────────────
function VDivider({ style }) {
  return (
    <div className="w-px bg-(--border-main) mx-5 self-stretch shrink-0" style={style} />
  );
}

// ── Single tracked stat ───────────────────────────────────────────────
function TrackedStat({ label, maxVal, currentVal, onChangeCurrent, thirdLabel, thirdVal, editable, horizontal, compact }) {

  if (horizontal) {
    const mBoxClass = compact
      ? 'w-9 h-9 text-sm rounded-md bg-(--bg-input) border-[1.5px] border-(--border-input) flex items-center justify-center font-serif font-bold text-(--text-muted)'
      : 'w-11.5 h-11.5 text-lg rounded-lg bg-(--bg-input) border-[1.5px] border-(--border-input) flex items-center justify-center font-serif font-bold text-(--text-muted)';
    const nBoxClass = compact
      ? 'w-10 h-10 text-base rounded-md bg-(--bg-input) border-2 border-(--accent) flex items-center justify-center font-serif font-bold text-(--text-primary)'
      : 'w-12.5 h-12.5 text-xl rounded-lg bg-(--bg-input) border-2 border-(--accent) flex items-center justify-center font-serif font-bold text-(--text-primary)';

    return (
      <div className={`flex flex-col items-center ${compact ? 'gap-1.25' : 'gap-2'}`}>
        <span className={`font-bold uppercase tracking-[0.06em] text-(--accent) font-sans ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {label}
        </span>

        <div className={`flex items-start ${compact ? 'gap-1.25' : 'gap-2'}`}>
          {/* Max */}
          <div className="flex flex-col items-center gap-0.75">
            <span className="text-[9px] text-(--text-faint) font-sans">Max</span>
            <div className={mBoxClass}>{maxVal ?? '—'}</div>
          </div>

          {/* Now */}
          <div className="flex flex-col items-center gap-0.75">
            <span className="text-[9px] text-(--text-faint) font-sans">Now</span>
            {editable ? (
              <input
                type="number"
                value={currentVal ?? maxVal ?? ''}
                onChange={e => onChangeCurrent && onChangeCurrent(e.target.value)}
                className={`${nBoxClass} text-center outline-none! [-moz-appearance:textfield] p-0`}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary-dark)'}
                onBlur={e  => e.target.style.borderColor = 'var(--accent)'}
              />
            ) : (
              <div className={nBoxClass}>{currentVal ?? maxVal ?? '—'}</div>
            )}
          </div>

          {/* Optional third box (Insane for Sanity) */}
          {thirdLabel && (
            <div className="flex flex-col items-center gap-0.75">
              <span className="text-[9px] text-(--text-faint) font-sans">{thirdLabel}</span>
              <div className={mBoxClass}>{thirdVal ?? '—'}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Vertical (original) layout ────────────────────────────────────
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs font-bold uppercase tracking-widest text-(--accent)">
        {label}
      </span>
      <div className="flex gap-2 items-end">
        <div className="flex flex-col items-center">
          <span className="text-[9px] mb-0.5 text-(--text-faint)">Max</span>
          <div className="text-center font-bold rounded flex items-center justify-center w-11 h-11 text-[1.1rem] bg-(--bg-input) border-[1.5px] border-(--border-input) text-(--text-muted)">
            {maxVal ?? '—'}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] mb-0.5 text-(--text-faint)">Current</span>
          {editable ? (
            <input
              type="number"
              value={currentVal ?? maxVal ?? ''}
              onChange={e => onChangeCurrent && onChangeCurrent(e.target.value)}
              className="text-center font-bold rounded outline-none! w-11 h-11 text-[1.1rem] bg-(--bg-input) border-2 border-(--border-focus) text-(--text-primary)"
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-focus)'}
            />
          ) : (
            <div className="text-center font-bold rounded flex items-center justify-center w-11 h-11 text-[1.1rem] bg-(--bg-input) border-2 border-(--border-focus) text-(--text-primary)">
              {currentVal ?? maxVal ?? '—'}
            </div>
          )}
        </div>
        {thirdLabel && (
          <div className="flex flex-col items-center">
            <span className="text-[9px] mb-0.5 text-(--text-faint)">{thirdLabel}</span>
            <div className="text-center font-bold rounded flex items-center justify-center w-11 h-11 text-[1.1rem] bg-(--bg-input) border-[1.5px] border-(--border-input) text-(--text-muted)">
              {thirdVal ?? '—'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Computed read-only badge ──────────────────────────────────────────
function Badge({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--accent) font-sans mb-1.5">
        {label}
      </div>
      {/* color stays inline — caller-supplied, not a fixed token */}
      <div className="font-serif text-xl font-bold py-1.5 px-4.5 rounded-lg bg-(--bg-input) border border-(--border-main)" style={{ color }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

// ── Tracked block: HP / MP / Luck / Sanity ───────────────────────────
export function TrackedStats({ chars = {}, editable = false, onChangeCurrent, horizontal = false, compact = false }) {
  const set = (field) => editable && onChangeCurrent ? (v => onChangeCurrent(field, v)) : undefined;

  if (horizontal) {
    // vdGap stays inline — passed through VDivider's style prop, its only customization channel; not converting to keep VDivider's prop interface unchanged
    const vdGap = compact ? '12px' : '20px';
    return (
      <div className="flex items-start justify-center flex-wrap gap-0">
        <TrackedStat label="HP" horizontal compact={compact}
          maxVal={chars.HitPtsMax}   currentVal={chars.HitPts}
          editable={editable} onChangeCurrent={set('HitPts')} />
        <VDivider style={{ margin: `0 ${vdGap}` }} />
        <TrackedStat label="MP" horizontal compact={compact}
          maxVal={chars.MagicPtsMax} currentVal={chars.MagicPts}
          editable={editable} onChangeCurrent={set('MagicPts')} />
        <VDivider style={{ margin: `0 ${vdGap}` }} />
        <TrackedStat label="LUCK" horizontal compact={compact}
          maxVal={chars.LuckMax}     currentVal={chars.Luck}
          editable={editable} onChangeCurrent={set('Luck')} />
        <VDivider style={{ margin: `0 ${vdGap}` }} />
        <TrackedStat label="SANITY" horizontal compact={compact}
          maxVal={chars.SanityStart} currentVal={chars.Sanity}
          thirdLabel="Insane" thirdVal={chars.SanityMax}
          editable={editable} onChangeCurrent={set('Sanity')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 justify-center">
      <TrackedStat label="Hit Points"
        maxVal={chars.HitPtsMax}   currentVal={chars.HitPts}
        editable={editable} onChangeCurrent={set('HitPts')} />
      <TrackedStat label="Magic Points"
        maxVal={chars.MagicPtsMax} currentVal={chars.MagicPts}
        editable={editable} onChangeCurrent={set('MagicPts')} />
      <TrackedStat label="Luck"
        maxVal={chars.LuckMax}     currentVal={chars.Luck}
        editable={editable} onChangeCurrent={set('Luck')} />
      <TrackedStat label="Sanity"
        maxVal={chars.SanityStart} currentVal={chars.Sanity}
        thirdLabel="Insane" thirdVal={chars.SanityMax}
        editable={editable} onChangeCurrent={set('Sanity')} />
    </div>
  );
}

// ── Badge row: Damage Bonus / Build / Dodge / Move ───────────────────
export function DerivedBadges({ chars = {}, inv, compact = false }) {
  const badgeClass = compact
    ? 'font-serif text-[15px] font-bold py-1 px-3 rounded-md bg-(--bg-input) border border-(--border-main)'
    : 'font-serif text-xl font-bold py-1.5 px-4.5 rounded-lg bg-(--bg-input) border border-(--border-main)';
  const labelClass = compact
    ? 'text-[9px] font-semibold uppercase tracking-[0.08em] text-(--accent) font-sans mb-1'
    : 'text-[11px] font-semibold uppercase tracking-[0.08em] text-(--accent) font-sans mb-1.5';

  const items = [
    { label: 'Damage Bonus', value: chars.DamageBonus || 'None', color: 'var(--danger)' },
    { label: 'Build',        value: chars.Build,                  color: 'var(--text-primary)' },
    { label: 'Dodge',        value: inv?.Combat?.Dodge?.value || calcDodge(chars.DEX), color: '#60a5fa' },
    { label: 'Move',         value: chars.Move,                   color: 'var(--text-primary)' },
  ];

  return (
    <div className={`flex flex-wrap justify-center ${compact ? 'gap-4' : 'gap-6'}`}>
      {items.map(({ label, value, color }) => (
        <div key={label} className="text-center">
          <div className={labelClass}>{label}</div>
          {/* color stays inline — per-badge color varies by stat (danger/primary/hardcoded blue), not a fixed token */}
          <div className={badgeClass} style={{ color }}>{value ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}

// ── Default: tracked block then badge row (standalone / read-only) ────
export default function DerivedStats({ chars = {}, inv, editable = false, onChangeCurrent }) {
  return (
    <div className="flex flex-col gap-4">
      <TrackedStats chars={chars} editable={editable} onChangeCurrent={onChangeCurrent} />
      <DerivedBadges chars={chars} inv={inv} />
    </div>
  );
}
