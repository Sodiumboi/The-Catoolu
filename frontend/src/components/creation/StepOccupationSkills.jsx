import { getSkillBase, PREFILLED_WEAPON_SKILLS } from '../../utils/skillBases';

function SkillRow({ name, base, aboveBase, cap, onChange, isSpecialty, baseLabel, isPrefilled }) {
  const total    = base + aboveBase;
  const half     = Math.floor(total / 2);
  const fifth    = Math.floor(total / 5);
  const maxAbove = cap - base;

  const adjust = (delta) => {
    const next = Math.max(0, Math.min(maxAbove, aboveBase + delta));
    onChange(next);
  };

  const btnClass = (disabled) => `w-9 h-8 rounded-md border border-(--border-input) font-sans text-[0.8rem] font-semibold shrink-0 ${disabled ? 'bg-(--bg-card) text-(--text-faint) cursor-not-allowed opacity-45' : 'bg-(--bg-page) text-(--text-primary) cursor-pointer opacity-100'}`;

  return (
    <div className={`flex items-center gap-[0.6rem] py-[0.45rem] px-3 border-b border-(--border-main) ${isSpecialty ? 'bg-(--accent-bg)' : 'bg-transparent'}`}>
      {/* Name + base */}
      <div className="flex-1 min-w-0">
        <span className={`font-sans text-[0.88rem] text-(--text-primary) ${isSpecialty ? 'font-semibold' : 'font-normal'}`}>
          {name}
        </span>
        <span className="font-sans text-[0.73rem] text-(--text-faint) ml-[0.3rem]">
          {baseLabel ?? `(${base}%)`}
        </span>
        {isSpecialty && (
          <span className="ml-[0.4rem] text-[0.68rem] text-(--color-primary) font-sans font-bold uppercase tracking-[0.04em]">specialty</span>
        )}
        {isPrefilled && (
          <span className="ml-[0.4rem] text-[0.68rem] text-(--color-primary) font-sans font-bold uppercase tracking-[0.04em]">pre-filled</span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-[3px] shrink-0">
        {[-5, -1, 1, 5].map(d => (
          <button
            key={d}
            className={btnClass(d < 0 ? aboveBase <= 0 : aboveBase >= maxAbove)}
            onClick={() => adjust(d)}
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* Value + half/fifth */}
      <div className="flex items-end gap-1 min-w-15 justify-end shrink-0">
        <span className={`font-serif text-[1.4rem] font-bold leading-none ${aboveBase > 0 ? 'text-(--color-primary-dark)' : 'text-(--text-primary)'}`}>
          {total}
        </span>
        <div className="flex flex-col gap-px pb-0.5">
          <span className="text-[0.65rem] text-(--text-muted) font-sans leading-none">{half}</span>
          <span className="text-[0.65rem] text-(--text-faint) font-sans leading-none">{fifth}</span>
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

  if (!occ) return <p className="font-sans text-(--text-muted)">No occupation selected.</p>;

  const totalPts = occ.skillPointsCalc(stats);
  const edu      = stats.EDU;

  // Build full skill list: compulsory + chosen specialties (deduped)
  const chosenSpecialties = occ.specialtyChoices.flatMap((_, i) => {
    const sel = specialtyChoices[i];
    if (!sel) return [];
    return Array.isArray(sel) ? sel : [sel];
  });
  const skillSet = [...new Set([...occ.compulsorySkills, ...chosenSpecialties])];

  // Points spent (above base) across all occupation skills + credit rating
  const crAbove = occupationSkills['Credit Rating'] ?? 0;
  const spent   = skillSet.reduce((sum, skill) => sum + (occupationSkills[skill] ?? 0), 0) + crAbove;
  const balance = totalPts - spent;

  // All specialty choices filled?
  const allSpecialtiesPicked = occ.specialtyChoices.length === 0 ||
    occ.specialtyChoices.every((group, i) => {
      const sel = specialtyChoices[i];
      const count = Array.isArray(sel) ? sel.length : (sel ? 1 : 0);
      return count >= group.pick;
    });

  return (
    <div>
      <h2 className="font-serif text-(--text-primary) text-[1.5rem] mb-1">
        Occupation Skills
      </h2>
      <p className="font-sans text-[0.88rem] text-(--text-muted) mb-6">
        Allocate your <strong>{occ.name}</strong> skill points. Specialty picks are added to the list.
      </p>

      {/* ── A) Specialty Picker ── */}
      {occ.specialtyChoices.length > 0 && (
        <div className="bg-(--bg-page) border border-(--border-main) rounded-[10px] py-[1.1rem] px-5 mb-5">
          <h3 className="font-sans text-[0.8rem] font-bold uppercase tracking-[0.06em] text-(--text-muted) mb-[0.9rem]">
            Personal Specialty Skills
          </h3>
          <div className="flex flex-col gap-[0.9rem]">
            {occ.specialtyChoices.map((group, gi) => {
              const currentSel = Array.isArray(specialtyChoices[gi])
                ? specialtyChoices[gi]
                : (specialtyChoices[gi] ? [specialtyChoices[gi]] : []);
              const atMax = currentSel.length >= group.pick;
              return (
                <div key={gi}>
                  <p className="font-sans text-[0.82rem] text-(--text-secondary) mb-[0.4rem]">
                    Pick {group.pick} — <em>{group.label}</em>
                    {group.pick > 1 && (
                      <span className="ml-2 text-(--text-muted) font-normal">
                        ({currentSel.length} of {group.pick} selected)
                      </span>
                    )}:
                  </p>
                  <div className="flex flex-wrap gap-[0.4rem]">
                    {group.from.map(skill => {
                      const selected = currentSel.includes(skill);
                      const unselectable = !selected && atMax;
                      return (
                        <button
                          key={skill}
                          onClick={() => {
                            if (selected) {
                              setSpecialtyChoice(gi, currentSel.filter(s => s !== skill));
                            } else if (!atMax) {
                              setSpecialtyChoice(gi, [...currentSel, skill]);
                            }
                          }}
                          className={`py-[0.3rem] px-[0.85rem] rounded-full border-2 font-sans text-[0.82rem] [transition:all_0.12s] ${selected ? 'border-(--color-primary) bg-(--color-primary) text-white font-semibold cursor-pointer opacity-100' : unselectable ? 'border-(--border-input) bg-(--bg-card) text-(--text-faint) font-normal cursor-not-allowed opacity-50' : 'border-(--border-input) bg-(--bg-card) text-(--text-secondary) font-normal cursor-pointer opacity-100'}`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {!allSpecialtiesPicked && (
            <p className="mt-3 font-sans text-[0.78rem] text-(--warning)">
              Make all specialty selections above — they'll appear in the skill list below.
            </p>
          )}
        </div>
      )}

      {/* ── B) Point Allocation ── */}
      <div className="bg-(--bg-card) border border-(--border-main) rounded-[10px] overflow-hidden">

        {/* Sticky tracker */}
        <div className="flex gap-6 items-center py-3 px-4 bg-(--bg-page) border-b border-(--border-main) flex-wrap sticky top-0 z-1">
          {[
            { label: 'Occupation Pts', value: totalPts },
            { label: 'Allocated',      value: spent },
            { label: 'Balance',        value: balance },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-[0.68rem] font-sans text-(--text-muted) uppercase tracking-wider">{label}</span>
              <span className={`text-[1.3rem] font-bold font-serif ${label === 'Balance' ? (balance < 0 ? 'text-(--danger)' : balance === 0 ? 'text-(--success)' : 'text-(--text-primary)') : 'text-(--text-primary)'}`}>{value}</span>
            </div>
          ))}
          <p className="font-sans text-[0.76rem] text-(--text-faint) m-0 flex-1">
            Skills cap at {skillsCap}%. Half / fifth shown beside each value.
          </p>
          {balance < 0 && (
            <span className="font-sans text-[0.78rem] text-(--danger) font-semibold">
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
            const base     = getSkillBase(skill, edu, stats.DEX);
            const aboveBase = occupationSkills[skill] ?? 0;
            const isSpecialty = chosenSpecialties.includes(skill);
            const isPrefilled = PREFILLED_WEAPON_SKILLS.includes(skill);
            return (
              <SkillRow
                key={skill}
                name={skill}
                base={base}
                aboveBase={aboveBase}
                cap={skillsCap}
                isSpecialty={isSpecialty}
                isPrefilled={isPrefilled}
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
          <div className="mt-5 bg-(--bg-card) border border-(--border-main) rounded-[10px] py-4 px-5">
            <div className="font-sans text-[0.75rem] font-bold uppercase tracking-[0.06em] text-(--text-muted) mb-3">
              Cash & Assets — at Credit Rating {cr}
            </div>
            <div className="flex gap-6 flex-wrap">
              {[
                { label: 'Cash',           value: `$${cash.toLocaleString()}` },
                { label: 'Assets',         value: `$${assets.toLocaleString()}` },
                { label: 'Spending Level', value: `$${spendingLimit.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-[0.2rem]">
                  <span className="font-sans text-[0.7rem] text-(--text-faint) uppercase tracking-[0.04em]">{label}</span>
                  <span className="font-serif text-[1.25rem] font-bold text-(--text-primary)">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
