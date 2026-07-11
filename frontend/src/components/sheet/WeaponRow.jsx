// ── WeaponRow ────────────────────────────────────────────────────────
// One weapon as a table row. Pure display with an `editable` slot:
//   editable → each cell is an input, plus a trailing delete button
//   read-only → same-sized static cells, no delete column
//
// Column order/labels/alignment/width come from the shared WEAPON_COLS
// (weaponColumns.js) so header cells line up with body cells.

import { WEAPON_COLS, weaponCellWidth as cellWidth } from './weaponColumns';
import Tooltip from '../ui/Tooltip';

function EditableCell({ value, onChange, wide, center, color }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      // width stays inline — cellWidth() is a runtime function of column props, not static styling
      // color stays inline — per-column color comes from weaponColumns.js data, not a fixed token
      className={`text-xs rounded outline-none! px-1.5 py-0.5 bg-(--bg-input) border-[1px_solid_var(--accent)22] ${center ? 'text-center' : 'text-left'}`}
      style={{ width: cellWidth({ wide, center }), color: color || 'var(--text-primary)' }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e  => e.target.style.borderColor = 'var(--accent-bg)'}
    />
  );
}

function StaticCell({ value, wide, center, color }) {
  return (
    <span
      // width stays inline — cellWidth() is a runtime function of column props, not static styling
      // color stays inline — per-column color comes from weaponColumns.js data, not a fixed token
      className={`text-xs rounded px-1.5 py-0.5 inline-block border-[1px_solid_var(--accent)22] truncate ${center ? 'text-center' : 'text-left'}`}
      style={{ width: cellWidth({ wide, center }), color: color || 'var(--text-primary)' }}
    >
      {value || '—'}
    </span>
  );
}

export default function WeaponRow({ weapon, index, onChange, onDelete, editable = false }) {
  const update = (field, value) => onChange(index, { ...weapon, [field]: value });

  return (
    <tr className="border-b [border-color:var(--accent)11]"
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)08'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

      {WEAPON_COLS.map((col, i) => (
        <td key={col.field}
            className={`py-1 ${i === 0 ? 'pl-2' : ''} ${col.center ? 'text-center' : 'text-left'}`}>
          {editable ? (
            <EditableCell
              value={weapon[col.field]} onChange={v => update(col.field, v)}
              wide={col.wide} center={col.center} color={col.color} />
          ) : (
            <StaticCell
              value={weapon[col.field]}
              wide={col.wide} center={col.center} color={col.color} />
          )}
        </td>
      ))}

      {editable && (
        <td className="py-1 pr-2 text-center">
          <Tooltip content="Delete weapon">
          <button
            onClick={() => onDelete(index)}
            aria-label="Delete weapon"
            className="btn-icon-ghost btn-icon-danger btn-icon-xs">
            <span className="icon icon-sm">close</span>
          </button>
          </Tooltip>
        </td>
      )}
    </tr>
  );
}
