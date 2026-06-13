import { SubSkillRow } from './SkillRow';

// ── SkillGroup ───────────────────────────────────────────────────────
// One skill family: a tinted parent header (e.g. "Art/Craft", "Science")
// with its indented subskill rows beneath. Font sizing via --sheet-font-scale.

export default function SkillGroup({ parentName, entries, onChangeEntry, editable = false }) {
  return (
    <div className="rounded mb-1 overflow-hidden border"
         style={{ borderColor: 'var(--border-main)' }}>

      {/* Group header */}
      <div className="px-3 py-1 flex items-center"
           style={{ background: 'var(--bg-section-hd)' }}>
        <span className="font-semibold"
              style={{ fontSize: 'calc(11px * var(--sheet-font-scale))', color: 'var(--accent)' }}>
          {parentName}
        </span>
      </div>

      {/* Subskill rows */}
      {entries.map(({ skill, index, isOcc }) => (
        <SubSkillRow
          key={index}
          skill={skill} index={index} isOcc={isOcc}
          onChangeEntry={onChangeEntry}
          editable={editable}
        />
      ))}
    </div>
  );
}
