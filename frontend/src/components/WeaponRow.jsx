// Each weapon row is now fully editable and can be deleted

export default function WeaponRow({ weapon, index, onChange, onDelete }) {

  const update = (field, value) => {
    onChange(index, { ...weapon, [field]: value });
  };

  return (
    <tr className="border-b" style={{ borderColor: 'var(--accent)11' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)08'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

      <td className="py-1 pl-2">
        <WeaponCell value={weapon.name}      onChange={v => update('name', v)}      wide />
      </td>
      <td className="py-1">
        <WeaponCell value={weapon.skillname} onChange={v => update('skillname', v)} />
      </td>
      <td className="py-1 text-center">
        <WeaponCell value={weapon.regular}   onChange={v => update('regular', v)}   center color="var(--success)" />
      </td>
      <td className="py-1 text-center">
        <WeaponCell value={weapon.hard}      onChange={v => update('hard', v)}      center color="#60a5fa" />
      </td>
      <td className="py-1 text-center">
        <WeaponCell value={weapon.extreme}   onChange={v => update('extreme', v)}   center color="#c084fc" />
      </td>
      <td className="py-1 text-center">
        <WeaponCell value={weapon.damage}    onChange={v => update('damage', v)}    center color="#f87171" />
      </td>
      <td className="py-1 text-center">
        <WeaponCell value={weapon.range}     onChange={v => update('range', v)}     center />
      </td>
      <td className="py-1 text-center">
        <WeaponCell value={weapon.attacks}   onChange={v => update('attacks', v)}   center />
      </td>

      {/* Delete button */}
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
    </tr>
  );
}

// Compact editable cell used inside WeaponRow
function WeaponCell({ value, onChange, wide, center, color }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="text-xs rounded outline-none px-1.5 py-0.5"
      style={{
        width:      wide ? '120px' : center ? '52px' : '72px',
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