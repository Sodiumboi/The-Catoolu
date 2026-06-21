import { getSkillBase } from '../../utils/skillBases';
import ALL_SKILLS from '../../utils/allSkills';

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
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: 'var(--text-muted)',
        marginBottom: '0.65rem',
        paddingBottom: '0.35rem',
        borderBottom: '1px solid var(--border-main)',
      }}>
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
  const occSkillSet = occ
    ? [...new Set([...occ.compulsorySkills, ...chosenSpecialties])]
    : [];
  const crAbove = occupationSkills?.['Credit Rating'] ?? 0;
  const cr      = occ ? occ.creditRating.min + crAbove : null;
  const cashAssets = occ && cr !== null ? occ.cashAndAssets(cr) : null;

  // Occupation skills — always shown (compulsory + specialty picks)
  const occSkillRows = occSkillSet.map(skill => {
    const base         = getSkillBase(skill, edu);
    const occAbove     = occupationSkills?.[skill] ?? 0;
    const personalAbove = personalSkills?.[skill] ?? 0;
    return { skill, base, occAbove, personalAbove, total: base + occAbove + personalAbove };
  });

  // Simple personal skills (above base, not already in occ list)
  const simpleNames = ALL_SKILLS.filter(e => typeof e === 'string');
  const personalSimpleRows = simpleNames
    .filter(s => !occSkillSet.includes(s) && (personalSkills?.[s] ?? 0) > 0)
    .map(s => {
      const base = getSkillBase(s, edu);
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
  const move   = stats.DEX < stats.SIZ && stats.STR < stats.SIZ ? 7
               : stats.DEX > stats.SIZ && stats.STR > stats.SIZ ? 9
               : 8;
  const dbBuild = (() => {
    const sum = stats.STR + stats.SIZ;
    if (sum <= 64)  return { db: '-2',   build: -2 };
    if (sum <= 84)  return { db: '-1',   build: -1 };
    if (sum <= 124) return { db: 'None', build:  0 };
    if (sum <= 164) return { db: '+1D4', build:  1 };
    return             { db: '+1D6',   build:  2 };
  })();

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-main)',
    borderRadius: '10px',
    padding: '1.25rem 1.5rem',
    marginBottom: '1.25rem',
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        Review & Create
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Final check before your investigator enters the world. Everything looks good? Hit Create.
      </p>

      {/* Personal details */}
      <div style={{ ...cardStyle, display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        {portrait && (
          <img
            src={`data:image/jpeg;base64,${portrait}`}
            alt="Portrait"
            style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-main)', flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '0.3rem' }}>
            {name || '—'}
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--color-primary-dark)', fontWeight: 600, marginBottom: '0.6rem' }}>
            {occ?.name ?? 'No Occupation'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.5rem' }}>
            {[
              { label: 'Age',        value: age },
              { label: 'Era',        value: ERA_LABELS[gameEra] ?? gameEra },
              { label: 'Skills Cap', value: `${skillsCap}%` },
              { label: 'Residence',  value: residence || '—' },
              { label: 'Birthplace', value: birthplace || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Characteristics + derived */}
      <div style={cardStyle}>
        <Section title="Characteristics">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {STAT_ORDER.map(stat => (
              <div key={stat} style={{ textAlign: 'center', padding: '0.5rem 0.25rem', background: 'var(--bg-page)', borderRadius: '8px', border: '1px solid var(--border-main)' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{stat}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{stats[stat]}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', color: 'var(--text-faint)' }}>{Math.floor(stats[stat] / 2)} / {Math.floor(stats[stat] / 5)}</div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Derived Stats">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.5rem' }}>
            {[
              { label: 'HP',           value: hp },
              { label: 'MP',           value: mp },
              { label: 'Sanity',       value: sanity },
              { label: 'Move',         value: move },
              { label: 'Damage Bonus', value: dbBuild.db },
              { label: 'Build',        value: dbBuild.build },
              { label: 'Dodge',        value: Math.floor(stats.DEX / 2) },
            ].map(({ label, value }) => (
              <div key={label}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Credit Rating + Cash */}
      {occ && cashAssets && (
        <div style={cardStyle}>
          <Section title="Credit Rating & Finances">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.5rem' }}>
              {[
                { label: 'Credit Rating', value: cr },
                { label: 'Cash',          value: `$${cashAssets.cash.toLocaleString()}` },
                { label: 'Assets',        value: `$${cashAssets.assets.toLocaleString()}` },
                { label: 'Spending Lvl', value: `$${cashAssets.spendingLimit.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Skills */}
      <div style={cardStyle}>
        {/* Occupation skills — always shown */}
        {occSkillRows.length > 0 && (
          <Section title={`Occupation Skills (${occSkillRows.length})`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.35rem' }}>
              {occSkillRows.map(({ skill, base, occAbove, personalAbove, total }) => (
                <div key={skill} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.3rem 0.6rem', borderRadius: '6px',
                  background: 'var(--accent-bg)', border: '1px solid var(--border-main)',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>{skill}</span>
                    {personalAbove > 0 && (
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: 'var(--text-faint)', marginLeft: '0.25rem' }}>+{personalAbove} personal</span>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-dark)', flexShrink: 0, marginLeft: '0.4rem' }}>{total}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Personal skills */}
        {(personalSimpleRows.length > 0 || slotRows.length > 0) && (
          <Section title={`Personal Interest Skills (${personalSimpleRows.length + slotRows.length})`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.35rem' }}>
              {[...personalSimpleRows, ...slotRows].map(({ skill, base, total }) => (
                <div key={skill} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.3rem 0.6rem', borderRadius: '6px',
                  background: 'var(--bg-page)', border: '1px solid var(--border-main)',
                }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-primary)' }}>{skill}</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, marginLeft: '0.4rem' }}>{total}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {occSkillRows.length === 0 && personalSimpleRows.length === 0 && slotRows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-faint)', margin: 0 }}>
            No skills allocated yet.
          </p>
        )}
      </div>
    </div>
  );
}