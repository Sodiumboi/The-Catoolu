import ALL_SKILLS, { SKILL_ERAS } from '../../utils/allSkills';
import { getSkillBase, PREFILLED_WEAPON_SKILLS, MISC_ONLY_SKILLS } from '../../utils/skillBases';
import { resolveCompulsoryChoices } from '../../utils/compulsoryChoices';

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
function GroupBox({ groupDef, occSkillsForGroup, occSkillSet, freeSlots, occGrantedFreeSlot = false, edu, skillsCap, occupationSkills, personalSkills, setPersonalSkillValue, setPersonalSlot }) {
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
        const isGrantedByOcc = occSkillSet.includes(skill);
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
              {isGrantedByOcc && (
                <span className="ml-[0.4rem] text-[0.63rem] font-sans font-bold uppercase tracking-[0.04em] text-(--color-primary-dark) bg-(--color-primary-light) py-[0.05rem] px-[0.3rem] rounded-full">{occAbove > 0 ? `occ +${occAbove}` : 'occ'}</span>
              )}
              {PREFILLED_WEAPON_SKILLS.includes(skill) && (
                <span className="ml-[0.3rem] text-[0.63rem] font-sans font-bold uppercase tracking-[0.04em] text-(--color-primary-dark) bg-(--color-primary-light) py-[0.05rem] px-[0.3rem] rounded-full">pre-filled</span>
              )}
            </div>
            <Btns atMin={personalAbove <= 0} atMax={personalAbove >= maxPersonal} onAdjust={adjust} />
            <Val total={total} />
          </div>
        );
      })}

      {/* Free-name slots */}
      {freeSlots.map((slot, si) => {
        const hasName   = Boolean(slot.name);
        const fullName  = isMisc ? (slot.name || 'Custom') : `${group} (${slot.name || defaultName || 'x'})`;
        const base      = isOwn ? edu : (hasName ? getSkillBase(fullName, edu) : 1);
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
                className={`font-sans text-[0.83rem] text-(--text-primary) bg-transparent border-b border-dashed border-(--border-input) outline-none! px-0.5 py-0 focus:border-(--border-focus) input-focus-glow ${isMisc ? 'w-45' : 'w-30'}`}
              />
              <span className="font-sans text-[0.68rem] text-(--text-faint) ml-[0.3rem]">
                ({base}%)
              </span>
              {occGrantedFreeSlot && (
                <span className="ml-[0.4rem] text-[0.63rem] font-sans font-bold uppercase tracking-[0.04em] text-(--color-primary-dark) bg-(--color-primary-light) py-[0.05rem] px-[0.3rem] rounded-full">occ</span>
              )}
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
  const { selectedOccupation: occ, occupationSkills, specialtyChoices, chosenCompulsoryChoices, personalSkills, personalSkillSlots, stats, skillsCap, gameEra } = state;
  const edu      = stats.EDU;
  const totalPts = stats.INT * 2;

  const chosenSpecialties = occ
    ? occ.specialtyChoices.flatMap((_, i) => {
        const sel = specialtyChoices?.[i];
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

  // Group prefixes — occ skills matching these go inside the group box, not the flat list
  const groupEntries  = ALL_SKILLS.filter(e => typeof e === 'object');
  const groupPrefixes = groupEntries.map(e => e.group);

  const simpleNames = ALL_SKILLS.filter(e => typeof e === 'string');

  // Occ skills that don't fit anywhere → append at bottom
  const extraOccSkills = occSkillSet.filter(s => {
    if (simpleNames.includes(s)) return false;
    if (s === 'Own Language' || s === 'Language Own') return false;
    if (MISC_ONLY_SKILLS.includes(s)) return false; // rendered inside the Misc box, not as a catch-all row
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
  const unchosenOptions = allSpecialtyOptions.filter(s => !occSkillSet.includes(s) && !PREFILLED_WEAPON_SKILLS.includes(s));

  function getGroupOccSkills(groupDef) {
    // Language (Own) must NEVER render as a fixed, locked "Own Language" label row.
    // The player always names their native tongue via the editable free slot (which
    // shows an "occ" badge when the occupation grants it), so the fixed-row path
    // (occSkillsForGroup) must receive nothing for this group.
    const base = groupDef.group === 'Language (Own)'
      ? []
      : occSkillSet.filter(s => s.startsWith(groupDef.group + ' (') || s === groupDef.group);
    const alwaysShown = PREFILLED_WEAPON_SKILLS.filter(s => s.startsWith(groupDef.group + ' ('));
    // Misc-only skills (e.g. Animal Handling, Diving) have no standalone row; when an
    // occupation grants one, show it as a named row inside the Misc box. Unlike weapon
    // skills, these only appear when actually occupation-granted (present in occSkillSet).
    const miscOnly = groupDef.group === 'Misc'
      ? MISC_ONLY_SKILLS.filter(s => occSkillSet.includes(s))
      : [];
    return [...new Set([...base, ...alwaysShown, ...miscOnly])];
  }

  function getUnchosenForGroup(groupDef) {
    return unchosenOptions
      .filter(s => s.startsWith(groupDef.group + ' (') || s === groupDef.group)
      .map(s => s.includes('(') ? s.slice(groupDef.group.length + 2, -1) : s);
  }

  function getFreeSlots(groupDef, occCount) {
    const unchosen   = getUnchosenForGroup(groupDef);
    // Multi-slot groups keep a floor of 1 so players can add specialties beyond
    // what the occupation already granted. Single-slot groups (only Language (Own))
    // must NOT floor at 1 — once the occupation grants the group's one slot, there
    // are zero additional free slots (an investigator has exactly one native language).
    const freeCount  = groupDef.slots > 1
      ? Math.max(1, groupDef.slots - occCount)
      : Math.max(0, groupDef.slots - occCount);
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

        {/* Unified display list */}
        {displayList.map((entry, i) => {
          if (typeof entry === 'object') {
            const occForGroup = getGroupOccSkills(entry);
            const freeSlots   = getFreeSlots(entry, occForGroup.length);
            // Language (Own)'s single editable slot shows an "occ" badge when the
            // occupation grants the native language. Scoped to this group only —
            // every other group's free slots are optional personal picks (no badge).
            const occGrantedFreeSlot = entry.group === 'Language (Own)'
              && (occSkillSet.includes('Own Language') || occSkillSet.includes('Language Own'));
            return (
              <GroupBox
                key={entry.group}
                groupDef={entry}
                occSkillsForGroup={occForGroup}
                occSkillSet={occSkillSet}
                freeSlots={freeSlots}
                occGrantedFreeSlot={occGrantedFreeSlot}
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
          if (SKILL_ERAS[skill] && !SKILL_ERAS[skill].includes(gameEra) && !isOcc) return null;
          const base          = getSkillBase(skill, edu, stats.DEX);
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
