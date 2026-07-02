import ALL_SKILLS from '../../utils/allSkills';
import { getSkillBase } from '../../utils/skillBases';

// ── Shared sub-components ────────────────────────────────────────────────────
function Btns({ atMin, atMax, onAdjust }) {
  const s = (disabled) => `w-8 h-7 rounded-[5px] border border-(--border-input) font-sans text-xs font-semibold shrink-0 ${disabled ? 'bg-(--bg-card) text-(--text-faint) cursor-not-allowed opacity-40' : 'bg-(--bg-page) text-(--text-primary) cursor-pointer opacity-100'}`;
  return (
    <div className="flex gap-0.5 shrink-0">
      {[-5, -1, 1, 5].map(d => (
        <button key={d} className={s(d < 0 ? atMin : atMax)} onClick={() => onAdjust(d)}>
          {d > 0 ? `+${d}` : d}
        </button>
      ))}
    </div>
  );
}

function Val({ total }) {
  return (
    <div className="flex items-end gap-[3px] min-w-12.5 justify-end shrink-0">
      <span className="font-serif text-[1.25rem] font-bold leading-none text-(--text-primary)">
        {total}
      </span>
      <div className="flex flex-col gap-px pb-0.5">
        <span className="text-[0.6rem] text-(--text-muted) font-sans leading-none">{Math.floor(total / 2)}</span>
        <span className="text-[0.6rem] text-(--text-faint) font-sans leading-none">{Math.floor(total / 5)}</span>
      </div>
    </div>
  );
}

const ROW = "flex items-center gap-2 py-[0.35rem] px-3 border-t border-(--border-main)";

// ── Simple named skill row ───────────────────────────────────────────────────
function SimpleRow({ name, base, occAbove, personalAbove, cap, onChange, isOcc, readOnly }) {
  const total       = base + occAbove + personalAbove;
  const maxPersonal = Math.max(0, cap - base - occAbove);
  const adjust      = (d) => onChange(Math.max(0, Math.min(maxPersonal, personalAbove + d)));

  return (
    <div className={`${ROW} ${isOcc ? 'bg-(--accent-bg)' : 'bg-transparent'}`}>
      <div className="flex-1 min-w-0">
        <span className={`font-sans text-[0.83rem] text-(--text-primary) ${isOcc ? 'font-medium' : 'font-normal'}`}>
          {name}
        </span>
        <span className="font-sans text-[0.68rem] text-(--text-faint) ml-[0.3rem]">
          ({base}%)
        </span>
        {isOcc && (
          <span className="ml-[0.4rem] text-[0.63rem] font-sans font-bold uppercase tracking-[0.04em] text-(--color-primary-dark) bg-(--color-primary-light) py-[0.05rem] px-[0.3rem] rounded-full">{occAbove > 0 ? `occ +${occAbove}` : 'occ'}</span>
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
    <div className="my-[0.3rem] border border-(--border-main) rounded-lg overflow-hidden">
      {/* Header: "Group (base%) ─────" */}
      <div className="flex items-center gap-[0.4rem] py-[0.3rem] px-3 bg-transparent">
        <span className="font-sans text-[0.8rem] font-bold text-(--text-primary) whitespace-nowrap">
          {group}
        </span>
        <span className="font-sans text-[0.68rem] text-(--text-faint) whitespace-nowrap">
          ({typeof headerBase === 'number' ? `${headerBase}%` : headerBase})
        </span>
        <div className="flex-1 h-px bg-(--border-main)" />
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
          <div key={skill} className={`${ROW} bg-(--accent-bg)`}>
            <div className="flex-1 min-w-0">
              <span className="font-sans text-[0.83rem] text-(--text-primary) font-medium">
                {specialty}
              </span>
              <span className="font-sans text-[0.68rem] text-(--text-faint) ml-[0.3rem]">
                ({base}%)
              </span>
              <span className="ml-[0.4rem] text-[0.63rem] font-sans font-bold uppercase tracking-[0.04em] text-(--color-primary-dark) bg-(--color-primary-light) py-[0.05rem] px-[0.3rem] rounded-full">{occAbove > 0 ? `occ +${occAbove}` : 'occ'}</span>
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
          <div key={si} className={ROW}>
            <div className="flex-1 min-w-0 flex items-center gap-0.5">
              <input
                type="text"
                value={slot.name}
                onChange={e => setPersonalSlot(group, si, { name: e.target.value })}
                placeholder={isMisc ? 'Custom skill…' : (defaultName ?? 'Specialty…')}
                className={`font-sans text-[0.83rem] text-(--text-primary) bg-transparent border-b border-dashed border-(--border-input) outline-none px-0.5 py-0 ${isMisc ? 'w-45' : 'w-30'}`}
              />
              <span className="font-sans text-[0.68rem] text-(--text-faint) ml-[0.3rem]">
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
      <h2 className="font-serif text-(--text-primary) text-[1.5rem] mb-1">
        Personal Interest Skills
      </h2>
      <p className="font-sans text-[0.88rem] text-(--text-muted) mb-6">
        Spend your free-time skill points. Type any specialty into grouped skills.
        Occupation skills (<span className="text-(--color-primary-dark) font-semibold">occ</span>) can still receive additional personal points up to the cap.
      </p>

      <div className="bg-(--bg-card) border border-(--border-main) rounded-[10px] overflow-hidden pb-[0.4rem]">

        {/* Sticky tracker */}
        <div className="flex gap-6 items-center py-3 px-4 bg-(--bg-page) border-b border-(--border-main) flex-wrap sticky top-0 z-1">
          {[
            { label: 'Interest Pts', value: totalPts },
            { label: 'Used',         value: used },
            { label: 'Balance',      value: balance },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-[0.68rem] font-sans text-(--text-muted) uppercase tracking-wider">{label}</span>
              <span className={`text-[1.3rem] font-bold font-serif ${label === 'Balance' && balance < 0 ? 'text-(--danger)' : 'text-(--text-primary)'}`}>{value}</span>
            </div>
          ))}
          <p className="font-sans text-[0.76rem] text-(--text-faint) m-0 flex-1">
            INT × 2 = {totalPts} pts. Unspent points are fine.
          </p>
          {balance < 0 && (
            <span className="font-sans text-[0.78rem] text-(--danger) font-semibold">
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
