import { FlatSkillRow } from './SkillRow';
import SkillGroup from './SkillGroup';

// ── SkillList ────────────────────────────────────────────────────────
// Full skill section: two-column layout with Reg/½/⅕ headers.
// Font sizing comes from --sheet-font-scale CSS variable on the container.

function Header() {
  return (
    <div className="flex items-center gap-2 px-3 pb-1 mb-1 border-b border-(--border-main)">
      <span className="w-2" />
      <span className="flex-1 uppercase tracking-widest text-[calc(9px*var(--sheet-font-scale))] text-(--accent)">Skill</span>
      <span className="uppercase tracking-widest text-center text-[calc(9px*var(--sheet-font-scale))] w-[calc(44px*var(--sheet-font-scale))] text-(--accent)">Val</span>
      <span className="uppercase tracking-widest text-center text-[calc(9px*var(--sheet-font-scale))] w-[calc(32px*var(--sheet-font-scale))] text-(--text-muted)">½</span>
      <span className="uppercase tracking-widest text-center text-[calc(9px*var(--sheet-font-scale))] w-[calc(32px*var(--sheet-font-scale))] text-(--text-muted)">⅕</span>
    </div>
  );
}

export default function SkillList({ skills = [], onChangeSkill, editable = false }) {
  const groups = [];
  const seen   = {};

  skills.forEach((skill, index) => {
    const isOcc = skill.occupation === 'true';
    if (skill.subskill !== undefined && skill.subskill !== null) {
      if (!seen[skill.name]) {
        seen[skill.name] = { type: 'group', parentName: skill.name, entries: [] };
        groups.push(seen[skill.name]);
      }
      seen[skill.name].entries.push({ skill, index, isOcc });
    } else {
      groups.push({ type: 'flat', skill, index, isOcc });
    }
  });

  const half        = Math.ceil(groups.length / 2);
  const leftGroups  = groups.slice(0, half);
  const rightGroups = groups.slice(half);

  const renderGroup = (g) => g.type === 'flat' ? (
    <FlatSkillRow
      key={g.index}
      skill={g.skill}
      onChange={editable ? (updated => onChangeSkill(g.index, updated)) : undefined}
      isOcc={g.isOcc} editable={editable}
    />
  ) : (
    <SkillGroup
      key={g.parentName}
      parentName={g.parentName}
      entries={g.entries}
      onChangeEntry={editable ? ((idx, updated) => onChangeSkill(idx, updated)) : undefined}
      editable={editable}
    />
  );

  return (
    <div className="grid grid-cols-2 gap-x-4">
      <div>
        <Header />
        {leftGroups.map(renderGroup)}
      </div>
      <div>
        <Header />
        {rightGroups.map(renderGroup)}
      </div>
    </div>
  );
}
