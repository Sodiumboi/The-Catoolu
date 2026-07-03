import { calcHalf, calcFifth } from '../../utils/cocCalculations';
import Tooltip from '../ui/Tooltip';

// ── SkillRow ─────────────────────────────────────────────────────────
// FlatSkillRow and SubSkillRow both use --sheet-font-scale CSS variable
// for font sizes and column widths — no size props needed.

const FIXED_SUBSKILLS = ['Brawl', 'Handgun', 'Rifle/Shotgun', 'English'];

function ValueCell({ val }) {
  return (
    <span
      className="text-center rounded font-bold py-px px-0 shrink-0 inline-flex items-center justify-center bg-(--bg-input) border border-(--border-input) text-(--text-primary) w-[calc(44px*var(--sheet-font-scale))] text-[calc(11px*var(--sheet-font-scale))]"
    >
      {parseInt(val) || 0}
    </span>
  );
}

export function FlatSkillRow({ skill, onChange, isOcc, editable = false }) {
  const val = parseInt(skill.value) || 0;
  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded transition-colors min-h-8"
      onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Occupation dot */}
      <span className="w-2 shrink-0">
        {isOcc && <Tooltip content="Occupation"><span className="text-(--accent) text-[calc(7px*var(--sheet-font-scale))]">●</span></Tooltip>}
      </span>

      {/* Skill name */}
      <span className={`flex-1 leading-tight text-[calc(11px*var(--sheet-font-scale))] ${isOcc ? 'text-(--text-primary)' : 'text-(--text-secondary)'}`}>
        {skill.name}
      </span>

      {/* Value */}
      {editable ? (
        <input
          type="number" min="0" max="99"
          value={skill.value}
          onChange={e => onChange({ ...skill, value: e.target.value })}
          className="text-center rounded outline-none! py-px px-0 shrink-0 bg-(--bg-input) border border-(--border-input) text-(--text-primary) w-[calc(44px*var(--sheet-font-scale))] text-[calc(11px*var(--sheet-font-scale))]"
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
        />
      ) : (
        <ValueCell val={skill.value} />
      )}

      {/* Half */}
      <span className="text-center shrink-0 text-(--text-muted) w-[calc(32px*var(--sheet-font-scale))] text-[calc(11px*var(--sheet-font-scale))]">
        {calcHalf(val)}
      </span>

      {/* Fifth */}
      <span className="text-center shrink-0 text-(--text-muted) w-[calc(32px*var(--sheet-font-scale))] text-[calc(11px*var(--sheet-font-scale))]">
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
      className="flex items-center gap-2 px-3 py-1 border-t transition-colors border-(--border-main) min-h-8.5"
      onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Occupation dot */}
      <span className="w-2 shrink-0">
        {isOcc && <Tooltip content="Occupation"><span className="text-(--accent) text-[calc(7px*var(--sheet-font-scale))]">●</span></Tooltip>}
      </span>

      {/* Subskill name */}
      {editable && !isFixed ? (
        <input
          type="text"
          value={subDisplay}
          onChange={e => onChangeEntry(index, { ...skill, subskill: e.target.value || 'None' })}
          placeholder="Subskill..."
          className={`flex-1 px-1 rounded outline-none! italic bg-(--bg-input) border border-(--border-input) min-w-15 text-[calc(11px*var(--sheet-font-scale))] ${isOcc ? 'text-(--text-primary)' : 'text-(--text-secondary)'}`}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
        />
      ) : (
        <span className={`flex-1 text-[calc(11px*var(--sheet-font-scale))] ${isOcc ? 'text-(--text-primary)' : 'text-(--text-secondary)'}`}>
          {subDisplay}
        </span>
      )}

      {/* Value */}
      {editable ? (
        <input
          type="number" min="0" max="99"
          value={skill.value}
          onChange={e => onChangeEntry(index, { ...skill, value: e.target.value })}
          className="text-center rounded outline-none! py-px px-0 shrink-0 bg-(--bg-input) border border-(--border-input) text-(--text-primary) w-[calc(44px*var(--sheet-font-scale))] text-[calc(11px*var(--sheet-font-scale))]"
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
        />
      ) : (
        <ValueCell val={skill.value} />
      )}

      {/* Half */}
      <span className="text-center shrink-0 text-(--text-muted) w-[calc(32px*var(--sheet-font-scale))] text-[calc(11px*var(--sheet-font-scale))]">
        {calcHalf(val)}
      </span>

      {/* Fifth */}
      <span className="text-center shrink-0 text-(--text-muted) w-[calc(32px*var(--sheet-font-scale))] text-[calc(11px*var(--sheet-font-scale))]">
        {calcFifth(val)}
      </span>
    </div>
  );
}
