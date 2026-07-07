import { useState } from 'react';
import { createPortal } from 'react-dom';

const STAT_KEYS = ['STR', 'CON', 'DEX', 'INT', 'SIZ', 'POW', 'APP', 'EDU', 'Luck', 'Sanity'];

function PickerRow({ label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full justify-between items-center py-1.25 px-3 border-none cursor-pointer text-(--text-primary) font-sans text-[13px] text-left box-border bg-none hover:bg-(--accent-bg)"
    >
      <span>{label}</span>
      {value != null && (
        <span className="text-(--text-muted) ml-2 shrink-0">{value}</span>
      )}
    </button>
  );
}

function SectionHeader({ label }) {
  return (
    <div className="pt-1.5 px-3 pb-0.75 text-[10px] font-semibold uppercase tracking-[0.07em] text-(--accent) font-sans border-t border-(--border-main) mt-1">
      {label}
    </div>
  );
}

export default function KeeperRollPicker({ charData, anchorRect, onPick, onClose, allMode }) {
  const [search, setSearch] = useState('');

  const inv   = charData?.sheet_data?.Investigator;
  const chars = inv?.Characteristics || {};
  const skills = inv?.Skills?.Skill || [];

  const q = search.trim().toLowerCase();

  const filteredStats = STAT_KEYS.filter(key => {
    const val = parseInt(chars[key]);
    if (!val) return false;
    return !q || key.toLowerCase().includes(q);
  });

  const filteredSkills = skills.filter(s => {
    const val = parseInt(s.value) || 0;
    if (val === 0 && s.name.toLowerCase() !== 'cthulhu mythos') return false;
    if (s.subskill?.toLowerCase() === 'none') return false;
    const display = s.subskill ? s.name + ' (' + s.subskill + ')' : s.name;
    return !q || display.toLowerCase().includes(q);
  });

  // Calculate popup position so it stays on-screen
  const top  = Math.min(anchorRect.bottom + 4, window.innerHeight - 420);
  const left = Math.min(anchorRect.left, window.innerWidth - 272);

  return createPortal(
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-399"
      />
      {/* top/left stay inline — computed from anchorRect + window dimensions to keep the popup on-screen */}
      <div className="fixed z-400 bg-(--bg-popup) border border-(--border-main) rounded-[10px] shadow-(--shadow-dropdown) w-65 max-h-100 flex flex-col overflow-hidden" style={{ top: top + 'px', left: left + 'px' }}>
        {/* Search */}
        <div className="pt-2 px-2 pb-1 border-b border-(--border-main)">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skill or stat..."
            autoFocus
            className="w-full box-border py-1.5 px-2 border border-(--border-input) rounded-md text-[13px] bg-(--bg-input) text-(--text-primary) font-sans outline-none! input-focus-glow focus:border-(--border-focus)"
          />
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1 pb-1">
          {/* Characteristics */}
          {filteredStats.length > 0 && (
            <>
              <SectionHeader label="Characteristics" />
              {filteredStats.map(key => (
                <PickerRow
                  key={key}
                  label={key}
                  value={allMode ? null : parseInt(chars[key]) || null}
                  onClick={() => onPick('stat', key, allMode ? null : parseInt(chars[key]) || null)}
                />
              ))}
            </>
          )}

          {/* Skills */}
          {filteredSkills.length > 0 && (
            <>
              <SectionHeader label="Skills" />
              {filteredSkills.map((s, i) => {
                const display = s.subskill ? s.name + ' (' + s.subskill + ')' : s.name;
                const val     = allMode ? null : parseInt(s.value) || null;
                return (
                  <PickerRow
                    key={i}
                    label={display}
                    value={val}
                    onClick={() => onPick('skill', display, val)}
                  />
                );
              })}
            </>
          )}

          {filteredStats.length === 0 && filteredSkills.length === 0 && (
            <div className="p-6 text-center text-(--text-faint) italic text-[13px]">
              No results
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
