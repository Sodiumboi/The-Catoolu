// ── WeaponRow ────────────────────────────────────────────────────────
// One weapon as a table row. Pure display with an `editable` slot:
//   editable → each cell is an input, plus a trailing delete button
//   read-only → same-sized static cells, no delete column
//
// Column order/labels/alignment/width come from the shared WEAPON_COLS
// (weaponColumns.js) so header cells line up with body cells.

import { WEAPON_COLS, weaponCellWidth as cellWidth } from './weaponColumns';

function EditableCell({ value, onChange, wide, center, color }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="text-xs rounded outline-none px-1.5 py-0.5"
      style={{
        width:      cellWidth({ wide, center }),
        background: 'var(--bg-input)',
        border:     '1px solid var(--accent)22',
        color:      color || 'var(--text-primary)',
        textAlign:  center ? 'center' : 'left',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e  => e.target.style.borderColor = 'var(--accent-bg)'}
    />
  );
}

function StaticCell({ value, wide, center, color }) {
  return (
    <span
      className="text-xs rounded px-1.5 py-0.5"
      style={{
        display:    'inline-block',
        width:      cellWidth({ wide, center }),
        border:     '1px solid var(--accent)22',
        color:      color || 'var(--text-primary)',
        textAlign:  center ? 'center' : 'left',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}
    >
      {value || '—'}
    </span>
  );
}

export default function WeaponRow({ weapon, index, onChange, onDelete, editable = false }) {
  const update = (field, value) => onChange(index, { ...weapon, [field]: value });

  return (
    <tr className="border-b" style={{ borderColor: 'var(--accent)11' }}
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
          <button
            onClick={() => onDelete(index)}
            className="text-xs px-1.5 py-0.5 rounded transition-all"
            style={{ color: 'var(--danger)', border: '1px solid var(--danger)33' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger)22'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Delete weapon">
            <span className="icon icon-sm">close</span>
          </button>
        </td>
      )}
    </tr>
  );
}
