// Single source of truth for the weapon table's columns — order, labels,
// alignment, cell width and accent colour. Shared by WeaponRow (cells) and
// WeaponTable (headers) so titles line up with their cells.

export const WEAPON_COLS = [
  { label: 'Weapon',  field: 'name',      wide: true                            },
  { label: 'Skill',   field: 'skillname'                                        },
  { label: 'Reg',     field: 'regular',   center: true, color: 'var(--success)' },
  { label: 'Hard',    field: 'hard',      center: true, color: '#60a5fa'        },
  { label: 'Ext',     field: 'extreme',   center: true, color: '#c084fc'        },
  { label: 'Damage',  field: 'damage',    center: true, color: '#f87171'        },
  { label: 'Range',   field: 'range',     center: true                          },
  { label: 'Attacks', field: 'attacks',   center: true                          },
];

export const weaponCellWidth = ({ wide, center }) =>
  wide ? '120px' : center ? '52px' : '72px';
