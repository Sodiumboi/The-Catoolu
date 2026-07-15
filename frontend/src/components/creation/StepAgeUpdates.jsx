import { useEffect, useState } from 'react';
import { getAgeUpdates } from '../../hooks/useCharacterCreation';

export default function StepAgeUpdates({ state, initStep4, useEduRoll, applyAgeDeduction }) {
  const { age, stats, eduRollsUsed, ageDeductionSpent } = state;
  const { eduRolls, deductionTotal, eligibleStats, eduPenalty } = getAgeUpdates(age);

  // Local state for the current pending d100 roll result
  const [rollResult, setRollResult]   = useState(null); // { d100, passed, eduAtRoll, eduGain }

  useEffect(() => { initStep4(); }, []);

  const rollsRemaining  = eduRolls - eduRollsUsed;
  const deductRemaining = deductionTotal - ageDeductionSpent;

  function doRoll() {
    const d100    = Math.floor(Math.random() * 100) + 1;
    const passed  = d100 > stats.EDU;
    const eduGain = passed ? Math.floor(Math.random() * 10) + 1 : 0;
    setRollResult({ d100, passed, eduAtRoll: stats.EDU, eduGain });
  }

  function commitRoll() {
    useEduRoll(rollResult.eduGain);
    setRollResult(null);
  }

  const sectionClass = "bg-(--bg-page) border border-(--border-main) rounded-[10px] py-5 px-6 mb-5";

  const sectionTitleClass = "font-serif text-[1.1rem] text-(--color-primary-dark) mb-3";

  const btn = (disabled, variant = 'default') => {
    const padding = variant === 'primary' ? 'py-[0.45rem] px-[1.1rem]' : 'py-[0.3rem] px-[0.7rem]';
    const border  = variant === 'primary' ? 'border-none' : 'border border-(--border-input)';
    const bg      = disabled ? 'bg-(--bg-card)' : variant === 'primary' ? 'bg-(--color-primary)' : 'bg-(--bg-page)';
    const color   = disabled ? 'text-(--text-faint)' : variant === 'primary' ? 'text-white' : 'text-(--text-primary)';
    const cursor  = disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100';
    return `${padding} rounded-[7px] ${border} ${bg} ${color} font-sans text-[0.88rem] font-semibold ${cursor} [transition:background_0.12s]`;
  };

  return (
    <div>
      <h2 className="font-serif text-(--text-primary) text-[1.5rem] mb-1">
        Age Updates
      </h2>
      <p className="font-sans text-[0.88rem] text-(--text-muted) mb-6">
        Age {age} — applying CoC 7e age rules. Any EDU changes carry forward to Step 6.
      </p>

      {/* ── EDU Improvement ── */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>EDU Improvement Rolls</h3>

        {/* Young investigator — auto penalty, no rolls */}
        {eduPenalty > 0 && (
          <div className="py-[0.6rem] px-[0.9rem] bg-(--danger-bg) border border-(--danger) rounded-[7px] font-sans text-[0.85rem] text-(--danger) mb-2">
            Age 15–19: EDU automatically reduced by {eduPenalty}. No improvement rolls available.
          </div>
        )}

        {eduRolls === 0 && eduPenalty === 0 && (
          <p className="font-sans text-[0.85rem] text-(--text-muted)">
            No EDU improvement rolls for this age range.
          </p>
        )}

        {eduRolls > 0 && (
          <div>
            <p className="font-sans text-[0.85rem] text-(--text-secondary) mb-4">
              <strong>Education</strong> improvement rolls based on age. EDU Improvement Rolls = {eduRolls}.
            </p>

            {/* Roll history */}
            {eduRollsUsed > 0 && (
              <div className="mb-3 flex flex-col gap-[0.3rem]">
                {/* We can't store history in hook state easily, so just show summary */}
                <p className="font-sans text-[0.82rem] text-(--text-muted)">
                  Rolls used: {eduRollsUsed} / {eduRolls} — Current EDU: <strong>{stats.EDU}</strong>
                </p>
              </div>
            )}

            {/* Current roll */}
            {rollsRemaining > 0 && !rollResult && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-sans text-[0.88rem] text-(--text-secondary)">
                  Roll #{eduRollsUsed + 1}: Target (1d100) over EDU of {stats.EDU}
                </span>
                <button className={btn(false, 'primary')} onClick={doRoll}>
                  Roll 1d100
                </button>
                <span className="font-sans text-[0.78rem] text-(--text-faint)">
                  (unused rolls can be skipped)
                </span>
              </div>
            )}

            {/* Roll result */}
            {rollResult && (
              <div className={`py-3 px-4 bg-(--bg-card) rounded-lg mb-3 border ${rollResult.passed ? 'border-(--color-primary-mid)' : 'border-(--border-main)'}`}>
                <p className={`font-sans text-[0.88rem] text-(--text-primary) ${rollResult.passed ? 'mb-3' : 'mb-0'}`}>
                  <strong>Roll #{eduRollsUsed + 1}:</strong> Target (1d100 = {rollResult.d100}) over EDU of {rollResult.eduAtRoll} —{' '}
                  <strong className={rollResult.passed ? 'text-(--success)' : 'text-(--danger)'}>
                    {rollResult.passed ? 'PASS' : 'FAIL'}
                  </strong>
                  {!rollResult.passed && `, EDU = ${stats.EDU}.`}
                </p>

                {rollResult.passed && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-sans text-[0.85rem] text-(--text-secondary)">
                      1d10 improvement roll: <strong>+{rollResult.eduGain}</strong>
                    </span>
                    <button className={btn(false, 'primary')} onClick={commitRoll}>Apply</button>
                  </div>
                )}

                {!rollResult.passed && (
                  <button className={btn(false, 'primary')} onClick={commitRoll}>Next Roll</button>
                )}
              </div>
            )}

            {/* Skip remaining rolls */}
            {rollsRemaining > 0 && !rollResult && (
              <button
                onClick={() => useEduRoll(0)}
                className={`${btn(false)} mt-[0.4rem] text-[0.78rem] text-(--text-faint)`}
              >
                Skip this roll
              </button>
            )}

            {rollsRemaining === 0 && (
              <p className="font-sans text-[0.85rem] text-(--text-muted) mt-1">
                All rolls complete. EDU is now <strong>{stats.EDU}</strong>.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Characteristic Deductions ── */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Characteristic Deductions</h3>

        {deductionTotal === 0 ? (
          <p className="font-sans text-[0.88rem] text-(--text-muted)">
            No characteristic deductions for age {age}. You're in your prime.
          </p>
        ) : (
          <div>
            <div className="flex gap-6 mb-5 py-3 px-4 bg-(--bg-card) rounded-lg border border-(--border-main) flex-wrap items-center">
              {[
                { label: 'To Deduct', value: deductionTotal },
                { label: 'Deducted',  value: ageDeductionSpent },
                { label: 'Remaining', value: deductRemaining },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center min-w-17.5">
                  <span className="text-[0.7rem] text-(--text-muted) font-sans uppercase tracking-wider">{label}</span>
                  <span className={`text-[1.4rem] font-bold font-serif ${label === 'Remaining' ? (deductRemaining > 0 ? 'text-(--danger)' : 'text-(--success)') : 'text-(--text-primary)'}`}>{value}</span>
                </div>
              ))}
              <p className="font-sans text-[0.78rem] text-(--text-faint) m-0 flex-1 min-w-40">
                Distribute {deductionTotal} pts across eligible stats. Cannot go below 1.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {eligibleStats.map(stat => (
                <div key={stat} className="flex items-center gap-4 py-[0.55rem] px-[0.9rem] bg-(--bg-card) rounded-lg border border-(--border-main)">
                  <span className="font-sans font-bold text-[0.88rem] text-(--text-secondary) w-10 uppercase">{stat}</span>
                  <span className="font-serif text-[1.6rem] font-bold text-(--text-primary) min-w-12">{stats[stat]}</span>
                  <div className="flex gap-[0.4rem]">
                    {[5, 1].map(amt => {
                      const disabled = deductRemaining <= 0 || stats[stat] <= 1;
                      return (
                        <button key={amt} disabled={disabled} onClick={() => applyAgeDeduction(stat, amt)} className={btn(disabled)}>
                          −{amt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {deductRemaining === 0 && (
              <p className="mt-3 text-(--success) font-sans text-[0.82rem]">
                All deductions applied.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
