import {
  calcMaxHP, calcMaxMP, calcDamageBonusAndBuild,
  calcDodge, calcMove, calcHalf, calcFifth,
} from '../../utils/cocCalculations';

const STAT_MINS = { STR: 15, DEX: 15, INT: 40, CON: 15, APP: 15, POW: 15, SIZ: 40, EDU: 40 };
const STAT_MAX  = 90;
const POOL      = 460;

const STAT_ROWS = [
  ['STR', 'DEX', 'INT', 'CON'],
  ['APP', 'POW', 'SIZ', 'EDU'],
];

function pointsUsed(stats) {
  return Object.values(stats).reduce((sum, v) => sum + v, 0);
}

function StatBox({ label, value, min, onChange }) {
  const half  = calcHalf(value);
  const fifth = calcFifth(value);

  const btnBase = {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid var(--border-input)',
    background: 'var(--bg-page)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    transition: 'background 0.1s',
    flexShrink: 0,
  };

  function adjust(delta) {
    const next = Math.min(STAT_MAX, Math.max(min, value + delta));
    onChange(next);
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: '10px',
      padding: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.4rem',
      minWidth: '90px',
    }}>
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {label}
      </span>

      {/* Main value + sub-values */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          lineHeight: 1,
          color: 'var(--text-primary)',
          fontWeight: 700,
        }}>
          {value}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '2px' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>{half}</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>{fifth}</span>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button style={btnBase} onClick={() => adjust(-5)} onMouseEnter={e => e.currentTarget.style.background='var(--row-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-page)'}>-5</button>
        <button style={btnBase} onClick={() => adjust(+5)} onMouseEnter={e => e.currentTarget.style.background='var(--row-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-page)'}>+5</button>
      </div>
    </div>
  );
}

function DerivedRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.35rem 0',
      borderBottom: '1px solid var(--border-main)',
    }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function StepCharacteristics({ state, setStat }) {
  const { stats } = state;

  const used    = pointsUsed(stats);
  const balance = POOL - used;

  const hp   = calcMaxHP(stats.CON, stats.SIZ);
  const mp   = calcMaxMP(stats.POW);
  const { damageBonus, build } = calcDamageBonusAndBuild(stats.STR, stats.SIZ);
  const dodge = calcDodge(stats.DEX);
  const move  = calcMove(stats.STR, stats.DEX, stats.SIZ);

  function resetAll() {
    Object.keys(STAT_MINS).forEach(k => setStat(k, STAT_MINS[k]));
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        Characteristics
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Total pool is <strong>{POOL} points</strong>. Minimums use 195 — leaving <strong>265 free points</strong> to distribute. Each stat caps at {STAT_MAX}. INT, SIZ, and EDU have a minimum of 40; all others 15.
      </p>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Left: stat boxes + point pool ── */}
        <div style={{ flex: '1', minWidth: '300px' }}>

          {/* Point pool tracker */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-page)',
            borderRadius: '8px',
            border: '1px solid var(--border-main)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pool</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{POOL}</span>
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-faint)' }}>−</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Used</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{used}</span>
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-faint)' }}>=</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</span>
              <span style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                fontFamily: 'var(--font-serif)',
                color: balance < 0 ? 'var(--danger)' : balance === 0 ? 'var(--success)' : 'var(--text-primary)',
              }}>
                {balance}
              </span>
            </div>
            <button
              onClick={resetAll}
              style={{
                marginLeft: 'auto',
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--border-input)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>

          {/* Stat rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {STAT_ROWS.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {row.map(stat => (
                  <StatBox
                    key={stat}
                    label={stat}
                    value={stats[stat]}
                    min={STAT_MINS[stat]}
                    onChange={v => setStat(stat, v)}
                  />
                ))}
              </div>
            ))}
          </div>

          {balance < 0 && (
            <p style={{ marginTop: '0.75rem', color: 'var(--danger)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>
              Overspent by {Math.abs(balance)} pts — reduce some stats before continuing.
            </p>
          )}
          {balance > 0 && (
            <p style={{ marginTop: '0.75rem', color: 'var(--warning)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>
              You have <strong>{balance} unspent points</strong>. You can continue, but unused points are lost.
            </p>
          )}
          {balance === 0 && used > 195 && (
            <p style={{ marginTop: '0.75rem', color: 'var(--success)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>
              All points allocated.
            </p>
          )}
        </div>

        {/* ── Right: derived stats ── */}
        <div style={{ minWidth: '200px', maxWidth: '240px' }}>
          <h3 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem',
          }}>
            Derived Stats
          </h3>
          <div style={{
            background: 'var(--bg-page)',
            border: '1px solid var(--border-main)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
          }}>
            <DerivedRow label="Move Rate"       value={move} />
            <DerivedRow label="Hit Points"      value={hp} />
            <DerivedRow label="Magic Points"    value={mp} />
            <DerivedRow label="Sanity"          value={stats.POW} />
            <DerivedRow label="Damage Bonus"    value={damageBonus} />
            <DerivedRow label="Build"           value={build} />
            <DerivedRow label="Dodge"           value={dodge} />
            <DerivedRow label="Interest Pts"    value={stats.INT * 2} />
          </div>
          <p style={{
            marginTop: '0.6rem',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.73rem',
            color: 'var(--text-faint)',
            lineHeight: 1.4,
          }}>
            Half and fifth values shown below each stat (used for pushed rolls).
          </p>
        </div>

      </div>
    </div>
  );
}
