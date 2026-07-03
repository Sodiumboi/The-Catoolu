import Section from '../../../../components/sheet/Section';
import WeaponTable from '../../../../components/sheet/WeaponTable';
import CustomDropdown from '../../../../components/ui/CustomDropdown';
import { WEAPON_PRESETS, WEAPON_CATEGORIES } from '../../../../utils/weaponPresets';

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
      <div className="mb-3">
        <WeaponTable
          weapons={weapons} editable
          onUpdateWeapon={onUpdateWeapon}
          onDeleteWeapon={onDeleteWeapon}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={onAddWeapon}
          className="px-4 py-2 rounded text-xs font-medium transition-all bg-(--accent-bg) text-(--accent) border border-(--border-main)"
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-bg)'}>
          + Add Blank Weapon
        </button>
        <button onClick={onTogglePresets}
          className={`px-4 py-2 rounded text-xs font-medium transition-all border-[1.5px] border-(--border-input) ${showPresets ? 'bg-(--accent) text-(--bg-page)' : 'bg-(--accent-bg) text-(--accent)'}`}>
          <span className="icon icon-sm">content_copy</span>{' '}{showPresets ? 'Hide Presets' : 'Add from Preset List'}
        </button>
      </div>

      {/* Preset picker */}
      {showPresets && (
        <div className="mt-4 rounded-lg border overflow-hidden border-(--border-main) bg-(--bg-input)">
          <div className="p-3 border-b flex gap-2 flex-wrap items-center border-(--border-main) bg-(--bg-section-hd)">
            <span className="text-xs font-bold uppercase tracking-widest text-(--accent)">Official CoC 7e Weapons</span>
            <input type="text" placeholder="Search..."
              value={presetSearch} onChange={e => onPresetSearch(e.target.value)}
              className="px-2 py-1 rounded text-xs outline-none! w-35 bg-(--bg-input) border border-(--border-input) text-(--text-primary)"
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-input)'} />
            <div className="w-37.5 shrink-0">
              <CustomDropdown
                value={presetCategory}
                onChange={onPresetCategory}
                options={WEAPON_CATEGORIES.map(c => ({ value: c, label: c }))}
              />
            </div>
          </div>

          <div className="max-h-70 overflow-y-auto [overscroll-behavior:contain]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-(--bg-nav) shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                <tr className="border-b border-(--border-main)">
                  {['Weapon','Skill','Damage','Range','Ammo',''].map((h, i) => (
                    <th key={i} className="text-left py-2 pl-3 text-(--accent)">{h}</th>
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
                    <tr key={i} className="border-b transition-colors border-(--border-main)"
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-1.5 pl-3 text-(--text-primary)">{preset.name}</td>
                      <td className="py-1.5 text-(--text-secondary)">{preset.skillname}</td>
                      <td className="py-1.5 text-(--text-muted)">{preset.damage}</td>
                      <td className="py-1.5 text-(--text-muted)">{preset.range}</td>
                      <td className="py-1.5 text-(--text-muted)">{preset.ammo}</td>
                      <td className="py-1.5 pr-3 text-right">
                        <button
                          onClick={() => onAddPreset(preset, skills)}
                          className="px-2 py-0.5 rounded font-medium transition-all text-[10px] bg-(--accent-bg) text-(--accent) border-[1.5px] border-(--border-input)"
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
