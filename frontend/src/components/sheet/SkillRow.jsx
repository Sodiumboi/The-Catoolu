import { calcHalf, calcFifth } from '../../utils/cocCalculations';

// ── SkillRow ─────────────────────────────────────────────────────────
// FlatSkillRow and SubSkillRow both use --sheet-font-scale CSS variable
// for font sizes and column widths — no size props needed.

const FIXED_SUBSKILLS = ['Brawl', 'Handgun', 'Rifle/Shotgun', 'English'];

const FS  = 'calc(11px * var(--sheet-font-scale))';
const VAL_W = 'calc(44px * var(--sheet-font-scale))';
const NUM_W = 'calc(32px * var(--sheet-font-scale))';

function ValueCell({ val }) {
  return (
    <span
      className="text-center rounded font-bold"
      style={{
        width: VAL_W, background: 'var(--bg-input)',
        border: '1px solid var(--border-input)', color: 'var(--text-primary)',
        padding: '1px 0', flexShrink: 0, fontSize: FS,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {parseInt(val) || 0}
    </span>
  );
}

export function FlatSkillRow({ skill, onChange, isOcc, editable = false }) {
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
        {isOcc && <span style={{ color: 'var(--accent)', fontSize: 'calc(7px * var(--sheet-font-scale))' }} title="Occupation">●</span>}
      </span>

      {/* Skill name */}
      <span className="flex-1 leading-tight"
            style={{ fontSize: FS, color: isOcc ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {skill.name}
      </span>

      {/* Value */}
      {editable ? (
        <input
          type="number" min="0" max="99"
          value={skill.value}
          onChange={e => onChange({ ...skill, value: e.target.value })}
          className="text-center rounded outline-none"
          style={{
            width: VAL_W, fontSize: FS,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)', color: 'var(--text-primary)',
            padding: '1px 0', flexShrink: 0,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
        />
      ) : (
        <ValueCell val={skill.value} />
      )}

      {/* Half */}
      <span className="text-center"
            style={{ width: NUM_W, fontSize: FS, color: 'var(--text-muted)', flexShrink: 0 }}>
        {calcHalf(val)}
      </span>

      {/* Fifth */}
      <span className="text-center"
            style={{ width: NUM_W, fontSize: FS, color: 'var(--text-muted)', flexShrink: 0 }}>
        {calcFifth(val)}
      </span>
    </div>
  );
}

export function SubSkillRow({ skill, index, isOcc, onChangeEntry, editable = false }) {
  const val = parseInt(skill.value) || 0;
  const isFixed = FIXED_SUBSKILLS.includes(skill.subskill);
  const subDisplay = skill.subskill && skill.subskill !== 'None' ? skill.subskill : '';

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 border-t transition-colors"
      style={{ borderColor: 'var(--border-main)', minHeight: '34px' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Occupation dot */}
      <span style={{ width: '8px', flexShrink: 0 }}>
        {isOcc && <span style={{ color: 'var(--accent)', fontSize: 'calc(7px * var(--sheet-font-scale))' }} title="Occupation">●</span>}
      </span>

      {/* Subskill name */}
      {editable && !isFixed ? (
        <input
          type="text"
          value={subDisplay}
          onChange={e => onChangeEntry(index, { ...skill, subskill: e.target.value || 'None' })}
          placeholder="Subskill..."
          className="flex-1 px-1 rounded outline-none italic"
          style={{
            fontSize: FS,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            color: isOcc ? 'var(--text-primary)' : 'var(--text-secondary)',
            minWidth: '60px',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
        />
      ) : (
        <span className="flex-1"
              style={{ fontSize: FS, color: isOcc ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {subDisplay}
        </span>
      )}

      {/* Value */}
      {editable ? (
        <input
          type="number" min="0" max="99"
          value={skill.value}
          onChange={e => onChangeEntry(index, { ...skill, value: e.target.value })}
          className="text-center rounded outline-none"
          style={{
            width: VAL_W, fontSize: FS,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)', color: 'var(--text-primary)',
            padding: '1px 0', flexShrink: 0,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
        />
      ) : (
        <ValueCell val={skill.value} />
      )}

      {/* Half */}
      <span className="text-center"
            style={{ width: NUM_W, fontSize: FS, color: 'var(--text-muted)', flexShrink: 0 }}>
        {calcHalf(val)}
      </span>

      {/* Fifth */}
      <span className="text-center"
            style={{ width: NUM_W, fontSize: FS, color: 'var(--text-muted)', flexShrink: 0 }}>
        {calcFifth(val)}
      </span>
    </div>
  );
}
