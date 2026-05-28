import { useEffect, useState } from 'react';
import { getAgeUpdates } from '../../hooks/useCharacterCreation';

export default function StepAgeUpdates({ state, initStep4, useEduRoll, applyAgeDeduction }) {
  const { age, stats, eduRollsUsed, ageDeductionSpent } = state;
  const { eduRolls, deductionTotal, eligibleStats, eduPenalty } = getAgeUpdates(age);

  // Local state for the current pending d100 roll result
  const [rollResult, setRollResult]   = useState(null); // { d100, passed, eduAtRoll }
  const [rollPoints, setRollPoints]   = useState(1);

  useEffect(() => { initStep4(); }, []);

  const rollsRemaining  = eduRolls - eduRollsUsed;
  const deductRemaining = deductionTotal - ageDeductionSpent;

  function doRoll() {
    const d100   = Math.floor(Math.random() * 100) + 1;
    const passed = d100 > stats.EDU;
    setRollResult({ d100, passed, eduAtRoll: stats.EDU });
    setRollPoints(1);
  }

  function commitRoll() {
    useEduRoll(rollResult.passed ? rollPoints : 0);
    setRollResult(null);
  }

  const sectionStyle = {
    background: 'var(--bg-page)',
    border: '1px solid var(--border-main)',
    borderRadius: '10px',
    padding: '1.25rem 1.5rem',
    marginBottom: '1.25rem',
  };

  const sectionTitle = {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.1rem',
    color: 'var(--color-primary-dark)',
    marginBottom: '0.75rem',
  };

  const btn = (disabled, variant = 'default') => ({
    padding: variant === 'primary' ? '0.45rem 1.1rem' : '0.3rem 0.7rem',
    borderRadius: '7px',
    border: variant === 'primary' ? 'none' : '1px solid var(--border-input)',
    background: disabled
      ? 'var(--bg-card)'
      : variant === 'primary'
        ? 'var(--color-primary)'
        : 'var(--bg-page)',
    color: disabled ? 'var(--text-faint)' : variant === 'primary' ? '#fff' : 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background 0.12s',
  });

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        Age Updates
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Age {age} — applying CoC 7e age rules. Any EDU changes carry forward to Step 6.
      </p>

      {/* ── EDU Improvement ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>EDU Improvement Rolls</h3>

        {/* Young investigator — auto penalty, no rolls */}
        {eduPenalty > 0 && (
          <div style={{ padding: '0.6rem 0.9rem', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '7px', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
            Age 15–19: EDU automatically reduced by {eduPenalty}. No improvement rolls available.
          </div>
        )}

        {eduRolls === 0 && eduPenalty === 0 && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No EDU improvement rolls for this age range.
          </p>
        )}

        {eduRolls > 0 && (
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <strong>Education</strong> improvement rolls based on age. EDU Improvement Rolls = {eduRolls}.
            </p>

            {/* Roll history */}
            {eduRollsUsed > 0 && (
              <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {/* We can't store history in hook state easily, so just show summary */}
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Rolls used: {eduRollsUsed} / {eduRolls} — Current EDU: <strong>{stats.EDU}</strong>
                </p>
              </div>
            )}

            {/* Current roll */}
            {rollsRemaining > 0 && !rollResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Roll #{eduRollsUsed + 1}: Target (1d100) over EDU of {stats.EDU}
                </span>
                <button style={btn(false, 'primary')} onClick={doRoll}>
                  Roll 1d100
                </button>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                  (unused rolls can be skipped)
                </span>
              </div>
            )}

            {/* Roll result */}
            {rollResult && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', border: `1px solid ${rollResult.passed ? 'var(--color-primary-mid)' : 'var(--border-main)'}`, borderRadius: '8px', marginBottom: '0.75rem' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', marginBottom: rollResult.passed ? '0.75rem' : '0', color: 'var(--text-primary)' }}>
                  <strong>Roll #{eduRollsUsed + 1}:</strong> Target (1d100 = {rollResult.d100}) over EDU of {rollResult.eduAtRoll} —{' '}
                  <strong style={{ color: rollResult.passed ? 'var(--success)' : 'var(--danger)' }}>
                    {rollResult.passed ? 'PASS' : 'FAIL'}
                  </strong>
                  {!rollResult.passed && `, EDU = ${stats.EDU}.`}
                </p>

                {rollResult.passed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Points to add (1–10):
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button style={btn(rollPoints <= 1)} onClick={() => setRollPoints(p => Math.max(1, p - 1))}>−1</button>
                      <span style={{ minWidth: '2rem', textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700 }}>{rollPoints}</span>
                      <button style={btn(rollPoints >= 10)} onClick={() => setRollPoints(p => Math.min(10, p + 1))}>+1</button>
                    </div>
                    <button style={btn(false, 'primary')} onClick={commitRoll}>Apply</button>
                  </div>
                )}

                {!rollResult.passed && (
                  <button style={btn(false, 'primary')} onClick={commitRoll}>Next Roll</button>
                )}
              </div>
            )}

            {/* Skip remaining rolls */}
            {rollsRemaining > 0 && !rollResult && (
              <button
                onClick={() => useEduRoll(0)}
                style={{ ...btn(false), marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-faint)' }}
              >
                Skip this roll
              </button>
            )}

            {rollsRemaining === 0 && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                All rolls complete. EDU is now <strong>{stats.EDU}</strong>.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Characteristic Deductions ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Characteristic Deductions</h3>

        {deductionTotal === 0 ? (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            No characteristic deductions for age {age}. You're in your prime.
          </p>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-main)', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'To Deduct', value: deductionTotal },
                { label: 'Deducted',  value: ageDeductionSpent },
                { label: 'Remaining', value: deductRemaining },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  <span style={{
                    fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-serif)',
                    color: label === 'Remaining'
                      ? deductRemaining > 0 ? 'var(--danger)' : 'var(--success)'
                      : 'var(--text-primary)',
                  }}>{value}</span>
                </div>
              ))}
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-faint)', margin: '0', flex: 1, minWidth: '160px' }}>
                Distribute {deductionTotal} pts across eligible stats. Cannot go below 1.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {eligibleStats.map(stat => (
                <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.55rem 0.9rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-main)' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-secondary)', width: '2.5rem', textTransform: 'uppercase' }}>{stat}</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: '3rem' }}>{stats[stat]}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[5, 1].map(amt => {
                      const disabled = deductRemaining <= 0 || stats[stat] <= 1;
                      return (
                        <button key={amt} disabled={disabled} onClick={() => applyAgeDeduction(stat, amt)} style={btn(disabled)}>
                          −{amt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {deductRemaining === 0 && (
              <p style={{ marginTop: '0.75rem', color: 'var(--success)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>
                All deductions applied.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
