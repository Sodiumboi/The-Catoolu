import { getSkillBase } from '../../utils/skillBases';

function SkillRow({ name, base, aboveBase, cap, onChange, isSpecialty, baseLabel }) {
  const total    = base + aboveBase;
  const half     = Math.floor(total / 2);
  const fifth    = Math.floor(total / 5);
  const maxAbove = cap - base;

  const adjust = (delta) => {
    const next = Math.max(0, Math.min(maxAbove, aboveBase + delta));
    onChange(next);
  };

  const btnStyle = (disabled) => ({
    width: '36px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid var(--border-input)',
    background: disabled ? 'var(--bg-card)' : 'var(--bg-page)',
    color: disabled ? 'var(--text-faint)' : 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    flexShrink: 0,
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.45rem 0.75rem',
      borderBottom: '1px solid var(--border-main)',
      background: isSpecialty ? 'var(--accent-bg)' : 'transparent',
    }}>
      {/* Name + base */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.88rem',
          color: 'var(--text-primary)',
          fontWeight: isSpecialty ? 600 : 400,
        }}>
          {name}
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.73rem', color: 'var(--text-faint)', marginLeft: '0.3rem' }}>
          {baseLabel ?? `(${base}%)`}
        </span>
        {isSpecialty && (
          <span style={{ marginLeft: '0.4rem', fontSize: '0.68rem', color: 'var(--color-primary)', fontFamily: 'var(--font-sans)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>specialty</span>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
        {[-5, -1, 1, 5].map(d => (
          <button
            key={d}
            style={btnStyle(d < 0 ? aboveBase <= 0 : aboveBase >= maxAbove)}
            onClick={() => adjust(d)}
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* Value + half/fifth */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', minWidth: '60px', justifyContent: 'flex-end', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.4rem',
          fontWeight: 700,
          lineHeight: 1,
          color: aboveBase > 0 ? 'var(--color-primary-dark)' : 'var(--text-primary)',
        }}>
          {total}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingBottom: '2px' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>{half}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>{fifth}</span>
        </div>
      </div>
    </div>
  );
}

export default function StepOccupationSkills({
  state,
  setSpecialtyChoice,
  setOccupationSkillValue,
}) {
  const { selectedOccupation: occ, specialtyChoices, occupationSkills, stats, skillsCap } = state;

  if (!occ) return <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>No occupation selected.</p>;

  const totalPts = occ.skillPointsCalc(stats);
  const edu      = stats.EDU;

  // Build full skill list: compulsory + chosen specialties (deduped)
  const chosenSpecialties = occ.specialtyChoices.map((_, i) => specialtyChoices[i]).filter(Boolean);
  const skillSet = [...new Set([...occ.compulsorySkills, ...chosenSpecialties])];

  // Points spent (above base) across all occupation skills + credit rating
  const crAbove = occupationSkills['Credit Rating'] ?? 0;
  const spent   = skillSet.reduce((sum, skill) => sum + (occupationSkills[skill] ?? 0), 0) + crAbove;
  const balance = totalPts - spent;

  // All specialty choices filled?
  const allSpecialtiesPicked = occ.specialtyChoices.length === 0 ||
    occ.specialtyChoices.every((_, i) => specialtyChoices[i]);

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        Occupation Skills
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Allocate your <strong>{occ.name}</strong> skill points. Specialty picks are added to the list.
      </p>

      {/* ── A) Specialty Picker ── */}
      {occ.specialtyChoices.length > 0 && (
        <div style={{
          background: 'var(--bg-page)',
          border: '1px solid var(--border-main)',
          borderRadius: '10px',
          padding: '1.1rem 1.25rem',
          marginBottom: '1.25rem',
        }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
            Personal Specialty Skills
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {occ.specialtyChoices.map((group, gi) => (
              <div key={gi}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Pick {group.pick} — <em>{group.label}</em>:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {group.from.map(skill => {
                    const selected = specialtyChoices[gi] === skill;
                    return (
                      <button
                        key={skill}
                        onClick={() => setSpecialtyChoice(gi, selected ? null : skill)}
                        style={{
                          padding: '0.3rem 0.85rem',
                          borderRadius: '9999px',
                          border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--border-input)'}`,
                          background: selected ? 'var(--color-primary)' : 'var(--bg-card)',
                          color: selected ? '#fff' : 'var(--text-secondary)',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.82rem',
                          fontWeight: selected ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.12s',
                        }}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {!allSpecialtiesPicked && (
            <p style={{ marginTop: '0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--warning)' }}>
              Make all specialty selections above — they'll appear in the skill list below.
            </p>
          )}
        </div>
      )}

      {/* ── B) Point Allocation ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: '10px', overflow: 'hidden' }}>

        {/* Sticky tracker */}
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          background: 'var(--bg-page)',
          borderBottom: '1px solid var(--border-main)',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}>
          {[
            { label: 'Occupation Pts', value: totalPts },
            { label: 'Allocated',      value: spent },
            { label: 'Balance',        value: balance },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-sans)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              <span style={{
                fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-serif)',
                color: label === 'Balance'
                  ? balance < 0 ? 'var(--danger)' : balance === 0 ? 'var(--success)' : 'var(--text-primary)'
                  : 'var(--text-primary)',
              }}>{value}</span>
            </div>
          ))}
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.76rem', color: 'var(--text-faint)', margin: 0, flex: 1 }}>
            Skills cap at {skillsCap}%. Half / fifth shown beside each value.
          </p>
          {balance < 0 && (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 600 }}>
              Overspent — reduce skills to continue.
            </span>
          )}
        </div>

        {/* Skill rows */}
        <div>
          {/* Credit Rating — special row: base=min, cap=max */}
          <SkillRow
            name="Credit Rating"
            base={occ.creditRating.min}
            aboveBase={crAbove}
            cap={occ.creditRating.max}
            baseLabel={`(${occ.creditRating.min} – ${occ.creditRating.max})`}
            onChange={v => setOccupationSkillValue('Credit Rating', v)}
          />
          {skillSet.map(skill => {
            const base     = getSkillBase(skill, edu);
            const aboveBase = occupationSkills[skill] ?? 0;
            const isSpecialty = chosenSpecialties.includes(skill);
            return (
              <SkillRow
                key={skill}
                name={skill}
                base={base}
                aboveBase={aboveBase}
                cap={skillsCap}
                isSpecialty={isSpecialty}
                onChange={v => setOccupationSkillValue(skill, v)}
              />
            );
          })}
        </div>
      </div>

      {/* Cash & Assets preview */}
      {(() => {
        const cr = occ.creditRating.min + crAbove;
        const { cash, assets, spendingLimit } = occ.cashAndAssets(cr);
        return (
          <div style={{
            marginTop: '1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
          }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Cash & Assets — at Credit Rating {cr}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Cash',           value: `$${cash.toLocaleString()}` },
                { label: 'Assets',         value: `$${assets.toLocaleString()}` },
                { label: 'Spending Level', value: `$${spendingLimit.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
