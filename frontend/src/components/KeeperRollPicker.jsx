import { useState } from 'react';
import { createPortal } from 'react-dom';

const STAT_KEYS = ['STR', 'CON', 'DEX', 'INT', 'SIZ', 'POW', 'APP', 'EDU', 'Luck', 'Sanity'];

function PickerRow({ label, value, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:        'flex',
        width:          '100%',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        '5px 12px',
        background:     hover ? 'var(--accent-bg)' : 'none',
        border:         'none',
        cursor:         'pointer',
        color:          'var(--text-primary)',
        fontFamily:     'var(--font-sans)',
        fontSize:       '13px',
        textAlign:      'left',
        boxSizing:      'border-box',
      }}
    >
      <span>{label}</span>
      {value != null && (
        <span style={{ color: 'var(--text-muted)', marginLeft: '8px', flexShrink: 0 }}>{value}</span>
      )}
    </button>
  );
}

function SectionHeader({ label }) {
  return (
    <div style={{
      padding:       '6px 12px 3px',
      fontSize:      '10px',
      fontWeight:    '600',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color:         'var(--accent)',
      fontFamily:    'var(--font-sans)',
      borderTop:     '1px solid var(--border-main)',
      marginTop:     '4px',
    }}>
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
        style={{ position: 'fixed', inset: 0, zIndex: 399 }}
      />
      <div style={{
        position:      'fixed',
        top:           top + 'px',
        left:          left + 'px',
        zIndex:        400,
        background:    'var(--bg-popup)',
        border:        '1px solid var(--border-main)',
        borderRadius:  '10px',
        boxShadow:     'var(--shadow-dropdown)',
        width:         '260px',
        maxHeight:     '400px',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}>
        {/* Search */}
        <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid var(--border-main)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skill or stat..."
            autoFocus
            style={{
              width:        '100%',
              boxSizing:    'border-box',
              padding:      '6px 8px',
              border:       '1px solid var(--border-input)',
              borderRadius: '6px',
              fontSize:     '13px',
              background:   'var(--bg-input)',
              color:        'var(--text-primary)',
              fontFamily:   'var(--font-sans)',
              outline:      'none',
            }}
          />
        </div>

        <div style={{ overflowY: 'auto', overscrollBehavior: 'contain', flex: 1, paddingBottom: '4px' }}>
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
            <div style={{
              padding:   '24px',
              textAlign: 'center',
              color:     'var(--text-faint)',
              fontStyle: 'italic',
              fontSize:  '13px',
            }}>
              No results
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
