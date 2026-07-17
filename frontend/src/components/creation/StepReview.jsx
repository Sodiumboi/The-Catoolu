import { getSkillBase, PREFILLED_WEAPON_SKILLS } from '../../utils/skillBases';
import { calcDamageBonusAndBuild, calcMove } from '../../utils/cocCalculations';
import { getAgeUpdates } from '../../hooks/useCharacterCreation';
import ALL_SKILLS, { SKILL_ERAS } from '../../utils/allSkills';
import { resolveCompulsoryChoices } from '../../utils/compulsoryChoices';

const ERA_LABELS = {
  classic_1920s: 'Classic 1920s',
  modern:        'Modern',
  gaslight:      'Cthulhu by Gaslight',
  old_west:      'Old West',
  regency:       'Regency Cthulhu',
  dark_ages:     'Dark Ages',
};

const STAT_ORDER = ['STR', 'DEX', 'INT', 'CON', 'APP', 'POW', 'SIZ', 'EDU'];

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <div className="font-sans text-[0.7rem] font-bold uppercase tracking-[0.07em] text-(--text-muted) mb-[0.65rem] pb-[0.35rem] border-b border-(--border-main)">
        {title}
      </div>
      {children}
    </div>
  );
}

export default function StepReview({ state }) {
  const {
    name, age, residence, birthplace, portrait,
    gameEra, skillsCap,
    stats,
    selectedOccupation: occ,
    specialtyChoices,
    chosenCompulsoryChoices,
    occupationSkills,
    personalSkills,
    personalSkillSlots,
  } = state;

  const edu = stats.EDU;

  const chosenSpecialties = occ
    ? occ.specialtyChoices.flatMap((_, i) => {
        const sel = (specialtyChoices ?? {})[i];
        if (!sel) return [];
        return Array.isArray(sel) ? sel : [sel];
      })
    : [];
  const resolvedChoiceSkills = occ
    ? resolveCompulsoryChoices(occ.compulsoryChoices ?? [], chosenCompulsoryChoices)
    : [];
  const occSkillSet = occ
    ? [...new Set([...occ.compulsorySkills, ...resolvedChoiceSkills, ...chosenSpecialties])]
    : [];
  const crAbove = occupationSkills?.['Credit Rating'] ?? 0;
  const cr      = occ ? occ.creditRating.min + crAbove : null;
  const cashAssets = occ && cr !== null ? occ.cashAndAssets(cr) : null;

  // Occupation skills — always shown (compulsory + specialty picks)
  const occSkillRows = occSkillSet.map(skill => {
    const base         = getSkillBase(skill, edu, stats.DEX);
    const occAbove     = occupationSkills?.[skill] ?? 0;
    const personalAbove = personalSkills?.[skill] ?? 0;
    return { skill, base, occAbove, personalAbove, total: base + occAbove + personalAbove };
  });

  // Simple personal skills (above base, not already in occ list)
  const simpleNames = ALL_SKILLS.filter(e => typeof e === 'string');
  const personalSimpleRows = [...simpleNames, ...PREFILLED_WEAPON_SKILLS]
    .filter(s => !occSkillSet.includes(s) && (personalSkills?.[s] ?? 0) > 0 && !(SKILL_ERAS[s] && !SKILL_ERAS[s].includes(gameEra)))
    .map(s => {
      const base = getSkillBase(s, edu, stats.DEX);
      return { skill: s, base, total: base + personalSkills[s] };
    });

  // Named slot skills (grouped skills with name + points)
  const slotRows = Object.entries(personalSkillSlots ?? {}).flatMap(([group, slots]) =>
    slots
      .filter(sl => sl.name.trim() && sl.above > 0)
      .map(sl => {
        const fullName = group === 'Misc' ? sl.name.trim() : `${group} (${sl.name.trim()})`;
        const base     = group === 'Language (Own)' ? edu : getSkillBase(fullName, edu);
        return { skill: fullName, base, total: base + sl.above };
      })
  );

  // Derived stats
  const hp     = Math.floor((stats.CON + stats.SIZ) / 10);
  const mp     = Math.floor(stats.POW / 5);
  const sanity = stats.POW;
  const { movePenalty } = getAgeUpdates(age);
  const move   = Math.max(1, calcMove(stats.STR, stats.DEX, stats.SIZ) - movePenalty);
  const dbBuild = calcDamageBonusAndBuild(stats.STR, stats.SIZ);

  const cardClass = "bg-(--bg-card) border border-(--border-main) rounded-[10px] py-5 px-6 mb-5";

  return (
    <div>
      <h2 className="font-serif text-(--text-primary) text-[1.5rem] mb-1">
        Review & Create
      </h2>
      <p className="font-sans text-[0.88rem] text-(--text-muted) mb-6">
        Final check before your investigator enters the world. Everything looks good? Hit Create.
      </p>

      {/* Personal details */}
      <div className={`${cardClass} flex gap-5 items-start`}>
        {portrait && (
          <img
            src={`data:image/jpeg;base64,${portrait}`}
            alt="Portrait"
            className="w-20 h-25 object-cover rounded-md border border-(--border-main) shrink-0"
          />
        )}
        <div className="flex-1">
          <div className="font-serif text-[1.6rem] font-bold text-(--text-primary) leading-[1.1] mb-[0.3rem]">
            {name || '—'}
          </div>
          <div className="font-sans text-[0.9rem] text-(--color-primary-dark) font-semibold mb-[0.6rem]">
            {occ?.name ?? 'No Occupation'}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-[0.6rem]">
            {[
              { label: 'Age',        value: age },
              { label: 'Era',        value: ERA_LABELS[gameEra] ?? gameEra },
              { label: 'Skills Cap', value: `${skillsCap}%` },
              { label: 'Residence',  value: residence || '—' },
              { label: 'Birthplace', value: birthplace || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="font-sans text-[0.68rem] text-(--text-faint) uppercase tracking-[0.04em] block">{label}</span>
                <span className="font-sans text-[0.88rem] text-(--text-primary)">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Characteristics + derived */}
      <div className={cardClass}>
        <Section title="Characteristics">
          <div className="grid grid-cols-4 gap-2">
            {STAT_ORDER.map(stat => (
              <div key={stat} className="text-center py-2 px-1 bg-(--bg-page) rounded-lg border border-(--border-main)">
                <div className="font-sans text-[0.65rem] font-bold uppercase tracking-wider text-(--text-muted)">{stat}</div>
                <div className="font-serif text-[1.4rem] font-bold text-(--text-primary) leading-[1.1]">{stats[stat]}</div>
                <div className="font-sans text-[0.6rem] text-(--text-faint)">{Math.floor(stats[stat] / 2)} / {Math.floor(stats[stat] / 5)}</div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Derived Stats">
          <div className="flex flex-wrap gap-x-6 gap-y-[0.6rem]">
            {[
              { label: 'HP',           value: hp },
              { label: 'MP',           value: mp },
              { label: 'Sanity',       value: sanity },
              { label: 'Move',         value: move },
              { label: 'Damage Bonus', value: dbBuild.damageBonus },
              { label: 'Build',        value: dbBuild.build },
              { label: 'Dodge',        value: Math.floor(stats.DEX / 2) },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="font-sans text-[0.68rem] text-(--text-faint) uppercase tracking-[0.04em] block">{label}</span>
                <span className="font-serif text-[1.15rem] font-bold text-(--text-primary)">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Credit Rating + Cash */}
      {occ && cashAssets && (
        <div className={cardClass}>
          <Section title="Credit Rating & Finances">
            <div className="flex flex-wrap gap-x-6 gap-y-[0.6rem]">
              {[
                { label: 'Credit Rating', value: cr },
                { label: 'Cash',          value: `$${cashAssets.cash.toLocaleString()}` },
                { label: 'Assets',        value: `$${cashAssets.assets.toLocaleString()}` },
                { label: 'Spending Lvl', value: `$${cashAssets.spendingLimit.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="font-sans text-[0.68rem] text-(--text-faint) uppercase tracking-[0.04em] block">{label}</span>
                  <span className="font-serif text-[1.15rem] font-bold text-(--text-primary)">{value}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Skills */}
      <div className={cardClass}>
        {/* Occupation skills — always shown */}
        {occSkillRows.length > 0 && (
          <Section title={`Occupation Skills (${occSkillRows.length})`}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-[0.35rem]">
              {occSkillRows.map(({ skill, base, occAbove, personalAbove, total }) => (
                <div key={skill} className="flex justify-between items-center py-[0.3rem] px-[0.6rem] rounded-md bg-(--accent-bg) border border-(--border-main)">
                  <div className="min-w-0">
                    <span className="font-sans text-[0.78rem] text-(--text-primary) font-medium">{skill}</span>
                    {personalAbove > 0 && (
                      <span className="font-sans text-[0.62rem] text-(--text-faint) ml-1">+{personalAbove} personal</span>
                    )}
                  </div>
                  <span className="font-serif text-base font-bold text-(--color-primary-dark) shrink-0 ml-[0.4rem]">{total}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Personal skills */}
        {(personalSimpleRows.length > 0 || slotRows.length > 0) && (
          <Section title={`Personal Interest Skills (${personalSimpleRows.length + slotRows.length})`}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-[0.35rem]">
              {[...personalSimpleRows, ...slotRows].map(({ skill, base, total }) => (
                <div key={skill} className="flex justify-between items-center py-[0.3rem] px-[0.6rem] rounded-md bg-(--bg-page) border border-(--border-main)">
                  <span className="font-sans text-[0.78rem] text-(--text-primary)">{skill}</span>
                  <span className="font-serif text-base font-bold text-(--text-primary) shrink-0 ml-[0.4rem]">{total}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {occSkillRows.length === 0 && personalSimpleRows.length === 0 && slotRows.length === 0 && (
          <p className="font-sans text-[0.85rem] text-(--text-faint) m-0">
            No skills allocated yet.
          </p>
        )}
      </div>
    </div>
  );
}