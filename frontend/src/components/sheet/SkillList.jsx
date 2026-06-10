import { useTheme } from '../../context/ThemeContext';
import { FlatSkillRow } from './SkillRow';
import SkillGroup from './SkillGroup';

// ── SkillList ────────────────────────────────────────────────────────
// The full skill section: groups skills into families (subskill clusters)
// vs flat skills, splits them across two columns each with a Reg/½/⅕
// header, and renders them. Pure display + theme-driven sizing.
//
// Skills are expected to arrive already filtered by the caller (e.g. a
// search box). `onChangeSkill(index, updatedSkill)` is only used when
// `editable` is true.

const SIZE_MAP = {
  sm:   { cls: 'text-xs',   inputW: '40px', numW: '28px' },
  base: { cls: 'text-sm',   inputW: '44px', numW: '32px' },
  lg:   { cls: 'text-base', inputW: '50px', numW: '36px' },
};

function Header({ inputW, numW }) {
  return (
    <div className="flex items-center gap-2 px-3 pb-1 mb-1 border-b"
         style={{ borderColor: 'var(--border-main)' }}>
      <span style={{ width: '8px' }} />
      <span className="flex-1 text-xs uppercase tracking-widest"
            style={{ color: 'var(--accent)' }}>Skill</span>
      <span className="text-xs uppercase tracking-widest text-center"
            style={{ width: inputW, color: 'var(--accent)' }}>Val</span>
      <span className="text-xs uppercase tracking-widest text-center"
            style={{ width: numW, color: 'var(--text-muted)' }}>½</span>
      <span className="text-xs uppercase tracking-widest text-center"
            style={{ width: numW, color: 'var(--text-muted)' }}>⅕</span>
    </div>
  );
}

export default function SkillList({ skills = [], onChangeSkill, editable = false }) {
  const { sheetSize } = useTheme();
  const skillKey = { sm: 'sm', md: 'base', lg: 'lg' }[sheetSize] || 'sm';
  const { cls, inputW, numW } = SIZE_MAP[skillKey];

  // Group skills by name — entries with subskills cluster into a family
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

  // Split into two halves for the two-column layout
  const half        = Math.ceil(groups.length / 2);
  const leftGroups  = groups.slice(0, half);
  const rightGroups = groups.slice(half);

  const renderGroup = (g) => g.type === 'flat' ? (
    <FlatSkillRow
      key={g.index}
      skill={g.skill}
      onChange={editable ? (updated => onChangeSkill(g.index, updated)) : undefined}
      cls={cls} inputW={inputW} numW={numW}
      isOcc={g.isOcc} editable={editable}
    />
  ) : (
    <SkillGroup
      key={g.parentName}
      parentName={g.parentName}
      entries={g.entries}
      onChangeEntry={editable ? ((idx, updated) => onChangeSkill(idx, updated)) : undefined}
      cls={cls} inputW={inputW} numW={numW}
      editable={editable}
    />
  );

  return (
    <div className="grid grid-cols-2 gap-x-4">
      <div>
        <Header inputW={inputW} numW={numW} />
        {leftGroups.map(renderGroup)}
      </div>
      <div>
        <Header inputW={inputW} numW={numW} />
        {rightGroups.map(renderGroup)}
      </div>
    </div>
  );
}
