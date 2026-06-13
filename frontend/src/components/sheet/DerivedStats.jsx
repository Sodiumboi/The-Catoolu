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
    <div style={{
      width:      '1px',
      background: 'var(--border-main)',
      margin:     '0 20px',
      alignSelf:  'stretch',
      flexShrink: 0,
      ...style,
    }} />
  );
}

// ── Box helpers shared by horizontal + vertical layouts ───────────────
const dimBox = {
  width: '46px', height: '46px',
  background: 'var(--bg-input)',
  border: '1.5px solid var(--border-input)',
  borderRadius: '8px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700',
  color: 'var(--text-muted)',
};
const nowBox = {
  width: '50px', height: '50px',
  background: 'var(--bg-input)',
  border: '2px solid var(--accent)',
  borderRadius: '8px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: '700',
  color: 'var(--text-primary)',
};

// ── Single tracked stat ───────────────────────────────────────────────
function TrackedStat({ label, maxVal, currentVal, onChangeCurrent, thirdLabel, thirdVal, editable, horizontal, compact }) {

  if (horizontal) {
    const mBox = compact
      ? { ...dimBox, width: '36px', height: '36px', fontSize: '14px', borderRadius: '6px' }
      : dimBox;
    const nBox = compact
      ? { ...nowBox, width: '40px', height: '40px', fontSize: '16px', borderRadius: '6px' }
      : nowBox;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? '5px' : '8px' }}>
        <span style={{
          fontSize: compact ? '10px' : '12px', fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--accent)', fontFamily: 'var(--font-sans)',
        }}>
          {label}
        </span>

        <div style={{ display: 'flex', gap: compact ? '5px' : '8px', alignItems: 'flex-start' }}>
          {/* Max */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>Max</span>
            <div style={mBox}>{maxVal ?? '—'}</div>
          </div>

          {/* Now */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>Now</span>
            {editable ? (
              <input
                type="number"
                value={currentVal ?? maxVal ?? ''}
                onChange={e => onChangeCurrent && onChangeCurrent(e.target.value)}
                style={{ ...nBox, textAlign: 'center', outline: 'none', MozAppearance: 'textfield', padding: 0 }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary-dark)'}
                onBlur={e  => e.target.style.borderColor = 'var(--accent)'}
              />
            ) : (
              <div style={nBox}>{currentVal ?? maxVal ?? '—'}</div>
            )}
          </div>

          {/* Optional third box (Insane for Sanity) */}
          {thirdLabel && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>{thirdLabel}</span>
              <div style={mBox}>{thirdVal ?? '—'}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Vertical (original) layout ────────────────────────────────────
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
        {label}
      </span>
      <div className="flex gap-2 items-end">
        <div className="flex flex-col items-center">
          <span className="text-xs mb-0.5" style={{ color: 'var(--text-faint)', fontSize: '9px' }}>Max</span>
          <div className="text-center font-bold rounded flex items-center justify-center"
               style={{ width: '44px', height: '44px', fontSize: '1.1rem', background: 'var(--bg-input)', border: '1.5px solid var(--border-input)', color: 'var(--text-muted)' }}>
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
              style={{ width: '44px', height: '44px', fontSize: '1.1rem', background: 'var(--bg-input)', border: '2px solid var(--border-focus)', color: 'var(--text-primary)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-focus)'}
            />
          ) : (
            <div className="text-center font-bold rounded flex items-center justify-center"
                 style={{ width: '44px', height: '44px', fontSize: '1.1rem', background: 'var(--bg-input)', border: '2px solid var(--border-focus)', color: 'var(--text-primary)' }}>
              {currentVal ?? maxVal ?? '—'}
            </div>
          )}
        </div>
        {thirdLabel && (
          <div className="flex flex-col items-center">
            <span className="text-xs mb-0.5" style={{ color: 'var(--text-faint)', fontSize: '9px' }}>{thirdLabel}</span>
            <div className="text-center font-bold rounded flex items-center justify-center"
                 style={{ width: '44px', height: '44px', fontSize: '1.1rem', background: 'var(--bg-input)', border: '1.5px solid var(--border-input)', color: 'var(--text-muted)' }}>
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
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--accent)', fontFamily: 'var(--font-sans)',
        marginBottom: '6px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: '700',
        padding: '6px 18px', borderRadius: '8px',
        background: 'var(--bg-input)', color,
        border: '1px solid var(--border-main)',
      }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

// ── Tracked block: HP / MP / Luck / Sanity ───────────────────────────
export function TrackedStats({ chars = {}, editable = false, onChangeCurrent, horizontal = false, compact = false }) {
  const set = (field) => editable && onChangeCurrent ? (v => onChangeCurrent(field, v)) : undefined;

  if (horizontal) {
    const vdGap = compact ? '12px' : '20px';
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap', gap: '0' }}>
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
  const badgeStyle = compact ? {
    fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: '700',
    padding: '4px 12px', borderRadius: '6px',
    background: 'var(--bg-input)', border: '1px solid var(--border-main)',
  } : {
    fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: '700',
    padding: '6px 18px', borderRadius: '8px',
    background: 'var(--bg-input)', border: '1px solid var(--border-main)',
  };
  const labelStyle = compact ? {
    fontSize: '9px', fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--accent)', fontFamily: 'var(--font-sans)',
    marginBottom: '4px',
  } : {
    fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--accent)', fontFamily: 'var(--font-sans)',
    marginBottom: '6px',
  };

  const items = [
    { label: 'Damage Bonus', value: chars.DamageBonus || 'None', color: 'var(--danger)' },
    { label: 'Build',        value: chars.Build,                  color: 'var(--text-primary)' },
    { label: 'Dodge',        value: inv?.Combat?.Dodge?.value || calcDodge(chars.DEX), color: '#60a5fa' },
    { label: 'Move',         value: chars.Move,                   color: 'var(--text-primary)' },
  ];

  return (
    <div style={{ display: 'flex', gap: compact ? '16px' : '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={labelStyle}>{label}</div>
          <div style={{ ...badgeStyle, color }}>{value ?? '—'}</div>
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
