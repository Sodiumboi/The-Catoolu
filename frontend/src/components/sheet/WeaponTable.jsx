import WeaponRow from './WeaponRow';
import { WEAPON_COLS } from './weaponColumns';

// ── WeaponTable ──────────────────────────────────────────────────────
// The weapons section: a header row plus one WeaponRow per weapon. Pure
// display; `editable` forwards to each row (inputs + delete) and adds the
// trailing delete column to the header. Headers share WEAPON_COLS with the
// rows so each title's alignment matches its cells (numeric columns centred,
// text columns left). The OG editor's preset picker and "add weapon"
// controls live in the editor section, not here.

export default function WeaponTable({ weapons = [], onUpdateWeapon, onDeleteWeapon, editable = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-(--border-main)">
            {WEAPON_COLS.map((col, i) => (
              <th key={col.field}
                  className={`py-2 text-xs uppercase tracking-widest text-(--accent) ${i === 0 ? 'pl-2' : ''} ${col.center ? 'text-center' : 'text-left'}`}>{col.label}</th>
            ))}
            {editable && <th className="py-2" />}
          </tr>
        </thead>
        <tbody>
          {weapons.map((weapon, i) => (
            <WeaponRow
              key={i} weapon={weapon} index={i}
              onChange={onUpdateWeapon} onDelete={onDeleteWeapon}
              editable={editable}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
