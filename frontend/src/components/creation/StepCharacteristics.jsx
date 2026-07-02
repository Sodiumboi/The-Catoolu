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

  /* background is toggled imperatively on hover — stays inline */
  const btnClass = "w-8 h-8 rounded-md border border-(--border-input) text-(--text-primary) font-sans text-[0.8rem] font-semibold cursor-pointer flex items-center justify-center select-none [transition:background_0.1s] shrink-0";

  function adjust(delta) {
    const next = Math.min(STAT_MAX, Math.max(min, value + delta));
    onChange(next);
  }

  return (
    <div className="bg-(--bg-card) border border-(--border-main) rounded-[10px] p-3 flex flex-col items-center gap-[0.4rem] min-w-22.5">
      <span className="font-sans text-[0.72rem] font-bold text-(--text-muted) uppercase tracking-[0.06em]">
        {label}
      </span>

      {/* Main value + sub-values */}
      <div className="flex gap-1 items-end">
        <span className="font-serif text-[2rem] leading-none text-(--text-primary) font-bold">
          {value}
        </span>
        <div className="flex flex-col gap-0.5 pb-0.5">
          <span className="text-[0.68rem] text-(--text-muted) font-sans leading-none">{half}</span>
          <span className="text-[0.68rem] text-(--text-faint) font-sans leading-none">{fifth}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-1">
        <button
          className={btnClass}
          style={{ background: 'var(--bg-page)' }}
          onClick={() => adjust(-5)}
          onMouseEnter={e => e.currentTarget.style.background='var(--row-hover)'}
          onMouseLeave={e => e.currentTarget.style.background='var(--bg-page)'}
        >-5</button>
        <button
          className={btnClass}
          style={{ background: 'var(--bg-page)' }}
          onClick={() => adjust(+5)}
          onMouseEnter={e => e.currentTarget.style.background='var(--row-hover)'}
          onMouseLeave={e => e.currentTarget.style.background='var(--bg-page)'}
        >+5</button>
      </div>
    </div>
  );
}

function DerivedRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-[0.35rem] border-b border-(--border-main)">
      <span className="font-sans text-[0.82rem] text-(--text-secondary)">{label}</span>
      <span className="font-sans text-[0.9rem] font-semibold text-(--text-primary)">{value}</span>
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
      <h2 className="font-serif text-(--text-primary) text-[1.5rem] mb-1">
        Characteristics
      </h2>
      <p className="font-sans text-[0.88rem] text-(--text-muted) mb-6">
        Total pool is <strong>{POOL} points</strong>. Minimums use 195 — leaving <strong>265 free points</strong> to distribute. Each stat caps at {STAT_MAX}. INT, SIZ, and EDU have a minimum of 40; all others 15.
      </p>

      <div className="flex gap-8 flex-wrap items-start">

        {/* ── Left: stat boxes + point pool ── */}
        <div className="flex-1 min-w-75">

          {/* Point pool tracker */}
          <div className="flex gap-4 mb-5 py-3 px-4 bg-(--bg-page) rounded-lg border border-(--border-main) items-center flex-wrap">
            <div className="flex flex-col items-center min-w-15">
              <span className="text-[0.7rem] text-(--text-muted) font-sans uppercase tracking-wider">Pool</span>
              <span className="text-[1.3rem] font-bold font-serif text-(--text-primary)">{POOL}</span>
            </div>
            <div className="text-base text-(--text-faint)">−</div>
            <div className="flex flex-col items-center min-w-15">
              <span className="text-[0.7rem] text-(--text-muted) font-sans uppercase tracking-wider">Used</span>
              <span className="text-[1.3rem] font-bold font-serif text-(--text-primary)">{used}</span>
            </div>
            <div className="text-base text-(--text-faint)">=</div>
            <div className="flex flex-col items-center min-w-15">
              <span className="text-[0.7rem] text-(--text-muted) font-sans uppercase tracking-wider">Balance</span>
              <span className={`text-[1.3rem] font-bold font-serif ${balance < 0 ? 'text-(--danger)' : balance === 0 ? 'text-(--success)' : 'text-(--text-primary)'}`}>
                {balance}
              </span>
            </div>
            <button
              onClick={resetAll}
              className="ml-auto py-[0.35rem] px-[0.8rem] rounded-md border border-(--border-input) bg-transparent text-(--text-muted) font-sans text-[0.78rem] cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Stat rows */}
          <div className="flex flex-col gap-[0.6rem]">
            {STAT_ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-[0.6rem] flex-wrap">
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
            <p className="mt-3 text-(--danger) font-sans text-[0.82rem]">
              Overspent by {Math.abs(balance)} pts — reduce some stats before continuing.
            </p>
          )}
          {balance > 0 && (
            <p className="mt-3 text-(--warning) font-sans text-[0.82rem]">
              You have <strong>{balance} unspent points</strong>. You can continue, but unused points are lost.
            </p>
          )}
          {balance === 0 && used > 195 && (
            <p className="mt-3 text-(--success) font-sans text-[0.82rem]">
              All points allocated.
            </p>
          )}
        </div>

        {/* ── Right: derived stats ── */}
        <div className="min-w-50 max-w-60">
          <h3 className="font-sans text-[0.78rem] font-bold uppercase tracking-[0.06em] text-(--text-muted) mb-3">
            Derived Stats
          </h3>
          <div className="bg-(--bg-page) border border-(--border-main) rounded-lg py-2 px-3">
            <DerivedRow label="Move Rate"       value={move} />
            <DerivedRow label="Hit Points"      value={hp} />
            <DerivedRow label="Magic Points"    value={mp} />
            <DerivedRow label="Sanity"          value={stats.POW} />
            <DerivedRow label="Damage Bonus"    value={damageBonus} />
            <DerivedRow label="Build"           value={build} />
            <DerivedRow label="Dodge"           value={dodge} />
            <DerivedRow label="Interest Pts"    value={stats.INT * 2} />
          </div>
          <p className="mt-[0.6rem] font-sans text-[0.73rem] text-(--text-faint) leading-[1.4]">
            Half and fifth values shown below each stat (used for pushed rolls).
          </p>
        </div>

      </div>
    </div>
  );
}
