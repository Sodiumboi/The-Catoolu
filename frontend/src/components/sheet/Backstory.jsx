// ── Backstory ────────────────────────────────────────────────────────
// The 8 official 7e backstory & psychology fields. Pure display:
//   editable → a textarea per field
//   read-only → a same-styled static block per field (all 8 shown)

const FIELDS = [
  { key: 'description', label: 'Description' },
  { key: 'traits',      label: 'Traits' },
  { key: 'ideology',    label: 'Ideology & Beliefs' },
  { key: 'people',      label: 'Significant People' },
  { key: 'phobias',     label: 'Phobias & Manias' },
  { key: 'locations',   label: 'Meaningful Locations' },
  { key: 'possessions', label: 'Treasured Possessions' },
  { key: 'tomes',       label: 'Tomes & Artefacts' },
];

function Field({ label, value, editable, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-widest mb-1"
             style={{ color: 'var(--accent)' }}>
        {label}
      </label>
      {editable ? (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded text-sm outline-none resize-y"
          style={{
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border-input)',
            color: 'var(--text-primary)',
            lineHeight: '1.6',
            transition: 'border-color 0.12s ease',
          }}
          onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-focus)'; }}
          onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-input)'; }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
        />
      ) : (
        <div
          className="w-full px-3 py-2 rounded text-sm"
          style={{
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border-input)',
            color: 'var(--text-primary)',
            lineHeight: '1.6',
            minHeight: 'calc(1.6em * 3 + 16px)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {value || ''}
        </div>
      )}
    </div>
  );
}

export default function Backstory({ back = {}, editable = false, onUpdateBack }) {
  return (
    <>
      {FIELDS.map(({ key, label }) => (
        <Field
          key={key} label={label} value={back[key]}
          editable={editable}
          onChange={editable && onUpdateBack ? (v => onUpdateBack(key, v)) : undefined}
        />
      ))}
    </>
  );
}
