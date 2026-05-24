import { calcHalf, calcFifth } from '../utils/cocCalculations';
import { useTheme } from '../context/ThemeContext';

const SIZE_MAP = {
  sm:   { cls: 'text-xs',   inputW: '40px', numW: '28px' },
  base: { cls: 'text-sm',   inputW: '44px', numW: '32px' },
  lg:   { cls: 'text-base', inputW: '50px', numW: '36px' },
};

// ── Single flat skill row (no subskill) ────────────────────
function FlatSkillRow({ skill, onChange, cls, inputW, numW, isOcc }) {
  const val = parseInt(skill.value) || 0;
  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded transition-colors"
      style={{ minHeight: '32px' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Occupation dot */}
      <span style={{ width: '8px', flexShrink: 0 }}>
        {isOcc && <span style={{ color: 'var(--accent)', fontSize: '7px' }} title="Occupation">●</span>}
      </span>

      {/* Skill name */}
      <span className={`flex-1 leading-tight ${cls}`}
            style={{ color: isOcc ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {skill.name}
      </span>

      {/* Value input */}
      <input
        type="number" min="0" max="99"
        value={skill.value}
        onChange={e => onChange({ ...skill, value: e.target.value })}
        className={`text-center rounded outline-none ${cls}`}
        style={{
          width: inputW, background: 'var(--bg-input)',
          border: '1px solid var(--border-input)', color: 'var(--text-primary)',
          padding: '1px 0', flexShrink: 0,
        }}
        onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
      />

      {/* Half */}
      <span className={`text-center ${cls}`}
            style={{ width: numW, color: 'var(--text-muted)', flexShrink: 0 }}>
        {calcHalf(val)}
      </span>

      {/* Fifth */}
      <span className={`text-center ${cls}`}
            style={{ width: numW, color: 'var(--text-muted)', flexShrink: 0 }}>
        {calcFifth(val)}
      </span>
    </div>
  );
}

// ── Grouped skill (with subskill children) ─────────────────
// Renders like Dhole's House: parent label + indented children
function GroupedSkillRows({ parentName, entries, onChangeEntry, cls, inputW, numW }) {
  return (
    <div className="rounded mb-1 overflow-hidden border"
         style={{ borderColor: 'var(--border-main)' }}>

      {/* Group header */}
      <div className="px-3 py-1 flex items-center"
           style={{ background: 'var(--bg-section-hd)' }}>
        <span className={`font-semibold ${cls}`}
              style={{ color: 'var(--accent)' }}>
          {parentName}
        </span>
      </div>

      {/* Subskill rows */}
      {entries.map(({ skill, index, isOcc }) => {
        const val = parseInt(skill.value) || 0;
        const FIXED = ['Brawl', 'Handgun', 'Rifle/Shotgun', 'English'];
        const isFixed = FIXED.includes(skill.subskill);
        const subDisplay = skill.subskill && skill.subskill !== 'None'
          ? skill.subskill : '';

        return (
          <div key={index}
               className="flex items-center gap-2 px-3 py-1 border-t transition-colors"
               style={{ borderColor: 'var(--border-main)', minHeight: '34px' }}
               onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

            {/* Occupation dot */}
            <span style={{ width: '8px', flexShrink: 0 }}>
              {isOcc && (
                <span style={{ color: 'var(--accent)', fontSize: '7px' }}
                      title="Occupation">●</span>
              )}
            </span>

            {/* Subskill name — editable if not fixed */}
            {isFixed ? (
              <span className={`flex-1 ${cls}`}
                    style={{ color: isOcc ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {subDisplay}
              </span>
            ) : (
              <input
                type="text"
                value={subDisplay}
                onChange={e => onChangeEntry(index, {
                  ...skill,
                  subskill: e.target.value || 'None'
                })}
                placeholder="Subskill..."
                className={`flex-1 px-1 rounded outline-none italic ${cls}`}
                style={{
                  background:  'var(--bg-input)',
                  border:      '1px solid var(--border-input)',
                  color:       isOcc ? 'var(--text-primary)' : 'var(--text-secondary)',
                  minWidth:    '60px',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
              />
            )}

            {/* Value */}
            <input
              type="number" min="0" max="99"
              value={skill.value}
              onChange={e => onChangeEntry(index, { ...skill, value: e.target.value })}
              className={`text-center rounded outline-none ${cls}`}
              style={{
                width: inputW, background: 'var(--bg-input)',
                border: '1px solid var(--border-input)', color: 'var(--text-primary)',
                padding: '1px 0', flexShrink: 0,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
            />

            {/* Half */}
            <span className={`text-center ${cls}`}
                  style={{ width: numW, color: 'var(--text-muted)', flexShrink: 0 }}>
              {calcHalf(val)}
            </span>

            {/* Fifth */}
            <span className={`text-center ${cls}`}
                  style={{ width: numW, color: 'var(--text-muted)', flexShrink: 0 }}>
              {calcFifth(val)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN EXPORT — renders the full skill list, grouped
// ══════════════════════════════════════════════════════════
export default function SkillGroup({ skills, onChangeSkill }) {
  const { sheetSize } = useTheme();
  const skillKey = { sm: 'sm', md: 'base', lg: 'lg' }[sheetSize] || 'sm';
  const { cls, inputW, numW } = SIZE_MAP[skillKey];

  // Group skills by name — skills with subskills cluster together
  const groups = [];
  const seen   = {};

  skills.forEach((skill, index) => {
    const isOcc = skill.occupation === 'true';

    if (skill.subskill !== undefined && skill.subskill !== null) {
      // Skill has a subskill — add to its group
      if (!seen[skill.name]) {
        seen[skill.name] = { type: 'group', parentName: skill.name, entries: [] };
        groups.push(seen[skill.name]);
      }
      seen[skill.name].entries.push({ skill, index, isOcc });
    } else {
      // Flat skill — no subskill
      groups.push({ type: 'flat', skill, index, isOcc });
    }
  });

  // Column header row
  const Header = () => (
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

  // Split into two halves for the two-column layout
  const half       = Math.ceil(groups.length / 2);
  const leftGroups  = groups.slice(0, half);
  const rightGroups = groups.slice(half);

  const renderGroup = (g) => {
    if (g.type === 'flat') {
      return (
        <FlatSkillRow
          key={g.index}
          skill={g.skill}
          onChange={updated => onChangeSkill(g.index, updated)}
          cls={cls} inputW={inputW} numW={numW}
          isOcc={g.isOcc}
        />
      );
    }
    return (
      <GroupedSkillRows
        key={g.parentName}
        parentName={g.parentName}
        entries={g.entries}
        onChangeEntry={(idx, updated) => onChangeSkill(idx, updated)}
        cls={cls} inputW={inputW} numW={numW}
      />
    );
  };

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