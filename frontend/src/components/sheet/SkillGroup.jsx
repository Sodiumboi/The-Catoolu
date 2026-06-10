import { SubSkillRow } from './SkillRow';

// ── SkillGroup ───────────────────────────────────────────────────────
// One skill family: a tinted parent header (e.g. "Art/Craft", "Science")
// with its indented subskill rows beneath. Pure display; the `editable`
// flag is forwarded to each SubSkillRow.

export default function SkillGroup({
  parentName, entries, onChangeEntry, cls, inputW, numW, editable = false,
}) {
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
      {entries.map(({ skill, index, isOcc }) => (
        <SubSkillRow
          key={index}
          skill={skill} index={index} isOcc={isOcc}
          onChangeEntry={onChangeEntry}
          cls={cls} inputW={inputW} numW={numW}
          editable={editable}
        />
      ))}
    </div>
  );
}
