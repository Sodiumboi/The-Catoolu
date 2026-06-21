import ALL_SKILLS from '../../utils/allSkills';
import { getSkillBase } from '../../utils/skillBases';

// ── Shared sub-components ────────────────────────────────────────────────────
function Btns({ atMin, atMax, onAdjust }) {
  const s = (disabled) => ({
    width: '32px', height: '28px', borderRadius: '5px',
    border: '1px solid var(--border-input)',
    background: disabled ? 'var(--bg-card)' : 'var(--bg-page)',
    color: disabled ? 'var(--text-faint)' : 'var(--text-primary)',
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, flexShrink: 0,
  });
  return (
    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
      {[-5, -1, 1, 5].map(d => (
        <button key={d} style={s(d < 0 ? atMin : atMax)} onClick={() => onAdjust(d)}>
          {d > 0 ? `+${d}` : d}
        </button>
      ))}
    </div>
  );
}

function Val({ total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', minWidth: '50px', justifyContent: 'flex-end', flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>
        {total}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingBottom: '2px' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>{Math.floor(total / 2)}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>{Math.floor(total / 5)}</span>
      </div>
    </div>
  );
}

const ROW = { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderTop: '1px solid var(--border-main)' };

// ── Simple named skill row ───────────────────────────────────────────────────
function SimpleRow({ name, base, occAbove, personalAbove, cap, onChange, isOcc, readOnly }) {
  const total       = base + occAbove + personalAbove;
  const maxPersonal = Math.max(0, cap - base - occAbove);
  const adjust      = (d) => onChange(Math.max(0, Math.min(maxPersonal, personalAbove + d)));

  return (
    <div style={{ ...ROW, background: isOcc ? 'var(--accent-bg)' : 'transparent', borderTop: '1px solid var(--border-main)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: isOcc ? 500 : 400 }}>
          {name}
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-faint)', marginLeft: '0.3rem' }}>
          ({base}%)
        </span>
        {isOcc && (
          <span style={{
            marginLeft: '0.4rem', fontSize: '0.63rem', fontFamily: 'var(--font-sans)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            color: 'var(--color-primary-dark)', background: 'var(--color-primary-light)',
            padding: '0.05rem 0.3rem', borderRadius: '9999px',
          }}>{occAbove > 0 ? `occ +${occAbove}` : 'occ'}</span>
        )}
      </div>
      {!readOnly && (
        <Btns atMin={personalAbove <= 0} atMax={personalAbove >= maxPersonal} onAdjust={adjust} />
      )}
      <Val total={total} />
    </div>
  );
}

// ── Group box (fieldset-style card) ─────────────────────────────────────────
function GroupBox({ groupDef, occSkillsForGroup, freeSlots, edu, skillsCap, occupationSkills, personalSkills, setPersonalSkillValue, setPersonalSlot }) {
  const { group, defaultName } = groupDef;
  const isOwn  = group === 'Language (Own)';
  const isMisc = group === 'Misc';
  const headerBase = isOwn ? 'EDU' : getSkillBase(group, edu);

  return (
    <div style={{
      margin: '0.3rem 0',
      border: '1px solid var(--border-main)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Header: "Group (base%) ─────" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', background: 'transparent' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {group}
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
          ({typeof headerBase === 'number' ? `${headerBase}%` : headerBase})
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-main)' }} />
      </div>

      {/* Occ skills inside this group (fixed name, can still receive personal pts) */}
      {occSkillsForGroup.map(skill => {
        // "Fighting (Brawl)" → "Brawl";  "Firearms" (generic) → "Firearms"
        const specialty = skill.includes('(') ? skill.slice(group.length + 2, -1) : skill;
        const base        = getSkillBase(skill, edu);
        const occAbove    = occupationSkills?.[skill] ?? 0;
        const personalAbove = personalSkills?.[skill] ?? 0;
        const maxPersonal = Math.max(0, skillsCap - base - occAbove);
        const total       = base + occAbove + personalAbove;
        const adjust      = (d) => setPersonalSkillValue(skill, Math.max(0, Math.min(maxPersonal, personalAbove + d)));

        return (
          <div key={skill} style={{ ...ROW, background: 'var(--accent-bg)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {specialty}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-faint)', marginLeft: '0.3rem' }}>
                ({base}%)
              </span>
              <span style={{
                marginLeft: '0.4rem', fontSize: '0.63rem', fontFamily: 'var(--font-sans)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                color: 'var(--color-primary-dark)', background: 'var(--color-primary-light)',
                padding: '0.05rem 0.3rem', borderRadius: '9999px',
              }}>{occAbove > 0 ? `occ +${occAbove}` : 'occ'}</span>
            </div>
            <Btns atMin={personalAbove <= 0} atMax={personalAbove >= maxPersonal} onAdjust={adjust} />
            <Val total={total} />
          </div>
        );
      })}

      {/* Free-name slots */}
      {freeSlots.map((slot, si) => {
        const fullName  = isMisc ? (slot.name || 'Custom') : `${group} (${slot.name || defaultName || 'x'})`;
        const base      = isOwn ? edu : getSkillBase(fullName, edu);
        const maxAbove  = Math.max(0, skillsCap - base);
        const total     = base + slot.above;
        const adjust    = (d) => setPersonalSlot(group, si, { name: slot.name, above: Math.max(0, Math.min(maxAbove, slot.above + d)) });

        return (
          <div key={si} style={ROW}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
              <input
                type="text"
                value={slot.name}
                onChange={e => setPersonalSlot(group, si, { name: e.target.value })}
                placeholder={isMisc ? 'Custom skill…' : (defaultName ?? 'Specialty…')}
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.83rem',
                  color: 'var(--text-primary)', background: 'transparent',
                  border: 'none', borderBottom: '1px dashed var(--border-input)',
                  outline: 'none', width: isMisc ? '180px' : '120px', padding: '0 2px',
                }}
              />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-faint)', marginLeft: '0.3rem' }}>
                ({base}%)
              </span>
            </div>
            <Btns atMin={slot.above <= 0} atMax={slot.above >= maxAbove} onAdjust={adjust} />
            <Val total={total} />
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function StepPersonalInterestSkills({ state, setPersonalSkillValue, setPersonalSlot }) {
  const { selectedOccupation: occ, occupationSkills, specialtyChoices, personalSkills, personalSkillSlots, stats, skillsCap } = state;
  const edu      = stats.EDU;
  const totalPts = stats.INT * 2;

  const chosenSpecialties = occ
    ? occ.specialtyChoices.flatMap((_, i) => {
        const sel = specialtyChoices?.[i];
        if (!sel) return [];
        return Array.isArray(sel) ? sel : [sel];
      })
    : [];
  const occSkillSet = occ
    ? [...new Set([...occ.compulsorySkills, ...chosenSpecialties])]
    : [];

  // Group prefixes — occ skills matching these go inside the group box, not the flat list
  const groupEntries  = ALL_SKILLS.filter(e => typeof e === 'object');
  const groupPrefixes = groupEntries.map(e => e.group);

  const simpleNames = ALL_SKILLS.filter(e => typeof e === 'string');

  // Occ skills that don't fit anywhere → append at bottom
  const extraOccSkills = occSkillSet.filter(s => {
    if (simpleNames.includes(s)) return false;
    if (s === 'Own Language' || s === 'Language Own') return false;
    return !groupPrefixes.some(p => s.startsWith(p + ' (') || s === p);
  });

  // Points used: simple personalSkills + free slot points
  const simpleUsed = Object.values(personalSkills ?? {}).reduce((s, v) => s + v, 0);
  const slotUsed   = Object.values(personalSkillSlots ?? {}).flatMap(a => a).reduce((s, sl) => s + sl.above, 0);
  const used    = simpleUsed + slotUsed;
  const balance = totalPts - used;

  // All specialty options not chosen → pre-fill free slots in their group
  const allSpecialtyOptions = occ
    ? [...new Set(occ.specialtyChoices.flatMap(g => g.from))]
    : [];
  const unchosenOptions = allSpecialtyOptions.filter(s => !occSkillSet.includes(s));

  function getGroupOccSkills(groupDef) {
    if (groupDef.group === 'Language (Own)') {
      return occSkillSet.filter(s =>
        s.startsWith('Language (Own)') || s === 'Own Language' || s === 'Language Own'
      );
    }
    return occSkillSet.filter(s => s.startsWith(groupDef.group + ' (') || s === groupDef.group);
  }

  function getUnchosenForGroup(groupDef) {
    return unchosenOptions
      .filter(s => s.startsWith(groupDef.group + ' (') || s === groupDef.group)
      .map(s => s.includes('(') ? s.slice(groupDef.group.length + 2, -1) : s);
  }

  function getFreeSlots(groupDef, occCount) {
    const unchosen   = getUnchosenForGroup(groupDef);
    const freeCount  = Math.max(1, groupDef.slots - occCount);
    const totalSlots = Math.max(freeCount, unchosen.length);
    const raw        = personalSkillSlots?.[groupDef.group] ?? [];
    return Array.from({ length: totalSlots }, (_, i) => ({
      name: raw[i] !== undefined
        ? raw[i].name
        : (unchosen[i] ?? (i === 0 && groupDef.defaultName ? groupDef.defaultName : '')),
      above: raw[i]?.above ?? 0,
    }));
  }

  const displayList = [...ALL_SKILLS, ...extraOccSkills];

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        Personal Interest Skills
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Spend your free-time skill points. Type any specialty into grouped skills.
        Occupation skills (<span style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>occ</span>) can still receive additional personal points up to the cap.
      </p>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: '10px', overflow: 'hidden', paddingBottom: '0.4rem' }}>

        {/* Sticky tracker */}
        <div style={{
          display: 'flex', gap: '1.5rem', alignItems: 'center',
          padding: '0.75rem 1rem', background: 'var(--bg-page)',
          borderBottom: '1px solid var(--border-main)',
          flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 1,
        }}>
          {[
            { label: 'Interest Pts', value: totalPts },
            { label: 'Used',         value: used },
            { label: 'Balance',      value: balance },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-sans)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              <span style={{
                fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-serif)',
                color: label === 'Balance' && balance < 0 ? 'var(--danger)' : 'var(--text-primary)',
              }}>{value}</span>
            </div>
          ))}
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.76rem', color: 'var(--text-faint)', margin: 0, flex: 1 }}>
            INT × 2 = {totalPts} pts. Unspent points are fine.
          </p>
          {balance < 0 && (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 600 }}>
              Overspent — reduce some skills.
            </span>
          )}
        </div>

        {/* Dodge — auto-calculated, read-only */}
        <SimpleRow
          name="Dodge" base={Math.floor(stats.DEX / 2)}
          occAbove={0} personalAbove={0} cap={skillsCap}
          onChange={() => {}} isOcc={false} readOnly
        />

        {/* Unified display list */}
        {displayList.map((entry, i) => {
          if (typeof entry === 'object') {
            const occForGroup = getGroupOccSkills(entry);
            const freeSlots   = getFreeSlots(entry, occForGroup.length);
            return (
              <GroupBox
                key={entry.group}
                groupDef={entry}
                occSkillsForGroup={occForGroup}
                freeSlots={freeSlots}
                edu={edu}
                skillsCap={skillsCap}
                occupationSkills={occupationSkills}
                personalSkills={personalSkills}
                setPersonalSkillValue={setPersonalSkillValue}
                setPersonalSlot={setPersonalSlot}
              />
            );
          }

          const skill         = entry;
          const isOcc         = occSkillSet.includes(skill);
          const base          = getSkillBase(skill, edu);
          const occAbove      = isOcc ? (occupationSkills?.[skill] ?? 0) : 0;
          const personalAbove = personalSkills?.[skill] ?? 0;

          return (
            <SimpleRow
              key={skill}
              name={skill}
              base={base}
              occAbove={occAbove}
              personalAbove={personalAbove}
              cap={skillsCap}
              onChange={v => setPersonalSkillValue(skill, v)}
              isOcc={isOcc}
              readOnly={skill === 'Cthulhu Mythos'}
            />
          );
        })}
      </div>
    </div>
  );
}
