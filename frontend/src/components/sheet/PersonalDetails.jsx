import PortraitDisplay from '../PortraitDisplay';
import { inputHoverEnter, inputHoverLeave, inputFocus, inputBlur } from './tokens';

// ── PersonalDetails ──────────────────────────────────────────────────
// Portrait + name / occupation / age / gender / birthplace / residence.
// Pure display:
//   editable → clickable portrait (upload) + text inputs
//   read-only → static portrait + static text fields

const FIELDS = [
  { key: 'Name',       label: 'Name' },
  { key: 'Occupation', label: 'Occupation' },
  { key: 'Age',        label: 'Age' },
  { key: 'Gender',     label: 'Gender' },
  { key: 'Birthplace', label: 'Birthplace' },
  { key: 'Residence',  label: 'Residence' },
];

function DetailField({ label, value, editable, onChange }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-1 text-(--accent)">
        {label}
      </label>
      {editable ? (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded text-sm outline-none! bg-(--bg-input) border-[1.5px] border-(--border-input) text-(--text-primary) [transition:border-color_0.12s_ease,background_0.12s_ease]"
          onMouseEnter={inputHoverEnter}
          onMouseLeave={inputHoverLeave}
          onFocus={inputFocus}
          onBlur={inputBlur}
        />
      ) : (
        <div
          className="w-full px-3 py-2 rounded text-sm bg-(--bg-input) border-[1.5px] border-(--border-input) text-(--text-primary) whitespace-pre-wrap min-h-[calc(1.25rem+16px)]"
        >
          {value || ''}
        </div>
      )}
    </div>
  );
}

export default function PersonalDetails({
  details = {}, portrait, editable = false,
  portraitInputRef, onPortraitUpload, onUpdateDetail,
}) {
  return (
    <div className="flex gap-6">
      <PortraitDisplay
        portrait={portrait}
        readOnly={!editable}
        onUploadClick={editable ? (() => portraitInputRef?.current?.click()) : undefined}
      />
      {editable && (
        <input
          ref={portraitInputRef}
          type="file"
          accept="image/*"
          onChange={onPortraitUpload}
          className="hidden"
        />
      )}
      <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map(({ key, label }) => (
          <DetailField
            key={key} label={label} value={details[key]}
            editable={editable}
            onChange={editable && onUpdateDetail ? (v => onUpdateDetail(key, v)) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
