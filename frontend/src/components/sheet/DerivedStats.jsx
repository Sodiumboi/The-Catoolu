import { calcDodge } from '../../utils/cocCalculations';

// ── DerivedStats ─────────────────────────────────────────────────────
// HP / MP / Luck / Sanity (tracked) + Damage Bonus / Build / Dodge / Move
// (computed badges). The OG editor splits these into two regions — the
// tracked block sits in the characteristics row, the badges sit below — so
// this module exposes them as separate pieces (`TrackedStats`,
// `DerivedBadges`) and a default that stacks both for standalone use.

// ── Single tracked stat: Max + Current (+ optional third box) ─────────
function TrackedStat({ label, maxVal, currentVal, onChangeCurrent, thirdLabel, thirdVal, editable }) {
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
          {editable ? (
            <input
              type="number"
              value={currentVal ?? maxVal ?? ''}
              onChange={e => onChangeCurrent && onChangeCurrent(e.target.value)}
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
          ) : (
            <div className="text-center font-bold rounded flex items-center justify-center"
                 style={{
                   width: '44px', height: '44px', fontSize: '1.1rem',
                   background: 'var(--bg-input)',
                   border: '2px solid var(--border-focus)',
                   color: 'var(--text-primary)',
                 }}>
              {currentVal ?? maxVal ?? '—'}
            </div>
          )}
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

// ── Computed read-only badge (Damage Bonus, Build, Dodge, Move) ───────
function Badge({ label, value, color }) {
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

// ── Tracked block: HP / MP / Luck / Sanity ───────────────────────────
export function TrackedStats({ chars = {}, editable = false, onChangeCurrent }) {
  const set = (field) => editable && onChangeCurrent ? (v => onChangeCurrent(field, v)) : undefined;
  return (
    <div className="flex flex-col gap-3 justify-center">
      <TrackedStat label="Hit Points"
        maxVal={chars.HitPtsMax} currentVal={chars.HitPts}
        editable={editable} onChangeCurrent={set('HitPts')} />
      <TrackedStat label="Magic Points"
        maxVal={chars.MagicPtsMax} currentVal={chars.MagicPts}
        editable={editable} onChangeCurrent={set('MagicPts')} />
      <TrackedStat label="Luck"
        maxVal={chars.LuckMax} currentVal={chars.Luck}
        editable={editable} onChangeCurrent={set('Luck')} />
      <TrackedStat label="Sanity"
        maxVal={chars.SanityStart} currentVal={chars.Sanity}
        thirdLabel="Insane" thirdVal={chars.SanityMax}
        editable={editable} onChangeCurrent={set('Sanity')} />
    </div>
  );
}

// ── Badge row: Damage Bonus / Build / Dodge / Move ───────────────────
export function DerivedBadges({ chars = {}, inv }) {
  return (
    <div className="flex gap-6 flex-wrap justify-center">
      <Badge label="Damage Bonus" value={chars.DamageBonus || 'None'} color="var(--danger)" />
      <Badge label="Build"        value={chars.Build}                  color="var(--text-primary)" />
      <Badge label="Dodge"
        value={inv?.Combat?.Dodge?.value || calcDodge(chars.DEX)}
        color="#60a5fa" />
      <Badge label="Move"         value={chars.Move}                   color="var(--text-primary)" />
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
