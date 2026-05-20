import WeaponRow from '../../../../components/WeaponRow';
import { WEAPON_PRESETS, WEAPON_CATEGORIES } from '../../../../utils/weaponPresets';
import { Section } from '../../primitives';

export default function Weapons({
  weapons, skills,
  showPresets, presetSearch, presetCategory,
  onAddWeapon, onUpdateWeapon, onDeleteWeapon,
  onTogglePresets, onPresetSearch, onPresetCategory,
  onAddPreset,
}) {
  return (
    <Section title="Weapons & Combat">
      {/* Weapon table */}
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border-main)' }}>
              {['Weapon','Skill','Reg','Hard','Ext','Damage','Range','Attacks',''].map((h, i) => (
                <th key={i} className="text-left py-2 pl-2 text-xs uppercase tracking-widest"
                    style={{ color: 'var(--accent)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weapons.map((weapon, i) => (
              <WeaponRow key={i} weapon={weapon} index={i}
                onChange={onUpdateWeapon} onDelete={onDeleteWeapon} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={onAddWeapon}
          className="px-4 py-2 rounded text-xs font-medium transition-all"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--border-main)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-bg)'}>
          + Add Blank Weapon
        </button>
        <button onClick={onTogglePresets}
          className="px-4 py-2 rounded text-xs font-medium transition-all"
          style={{
            background: showPresets ? 'var(--accent)' : 'var(--accent-bg)',
            color:      showPresets ? 'var(--bg-page)' : 'var(--accent)',
            border:     '1.5px solid var(--border-input)',
          }}>
          📋 {showPresets ? 'Hide Presets' : 'Add from Preset List'}
        </button>
      </div>

      {/* Preset picker */}
      {showPresets && (
        <div className="mt-4 rounded-lg border overflow-hidden"
             style={{ borderColor: 'var(--border-main)', background: 'var(--bg-input)' }}>
          <div className="p-3 border-b flex gap-2 flex-wrap items-center"
               style={{ borderColor: 'var(--border-main)', background: 'var(--bg-section-hd)' }}>
            <span className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--accent)' }}>Official CoC 7e Weapons</span>
            <input type="text" placeholder="Search..."
              value={presetSearch} onChange={e => onPresetSearch(e.target.value)}
              className="px-2 py-1 rounded text-xs outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', width: '140px' }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-input)'} />
            <select value={presetCategory} onChange={e => onPresetCategory(e.target.value)}
              className="px-2 py-1 rounded text-xs outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
              {WEAPON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0"
                     style={{ background: 'var(--bg-nav)', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                <tr className="border-b" style={{ borderColor: 'var(--border-main)' }}>
                  {['Weapon','Skill','Damage','Range','Ammo',''].map((h, i) => (
                    <th key={i} className="text-left py-2 pl-3" style={{ color: 'var(--accent)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEAPON_PRESETS
                  .filter(w => {
                    const matchCat = presetCategory === 'All' || w.category === presetCategory;
                    const matchQ   = !presetSearch.trim() ||
                      w.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
                      w.skillname.toLowerCase().includes(presetSearch.toLowerCase());
                    return matchCat && matchQ;
                  })
                  .map((preset, i) => (
                    <tr key={i} className="border-b transition-colors"
                        style={{ borderColor: 'var(--border-main)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-1.5 pl-3" style={{ color: 'var(--text-primary)' }}>{preset.name}</td>
                      <td className="py-1.5"       style={{ color: 'var(--text-secondary)' }}>{preset.skillname}</td>
                      <td className="py-1.5"       style={{ color: 'var(--text-muted)' }}>{preset.damage}</td>
                      <td className="py-1.5"       style={{ color: 'var(--text-muted)' }}>{preset.range}</td>
                      <td className="py-1.5"       style={{ color: 'var(--text-muted)' }}>{preset.ammo}</td>
                      <td className="py-1.5 pr-3 text-right">
                        <button
                          onClick={() => onAddPreset(preset, skills)}
                          className="px-2 py-0.5 rounded font-medium transition-all"
                          style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1.5px solid var(--border-input)', fontSize: '10px' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-bg)'}>
                          + Add
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  );
}
