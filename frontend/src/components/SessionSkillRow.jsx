import { useState, useRef } from 'react';
import SkillRollPopup from './SkillRollPopup';

export default function SessionSkillRow({
  skill,
  displayName,
  rollName,
  advMode, disMode, onRoll,
  fontScale = 1,
}) {
  const [showPopup,  setShowPopup]  = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const buttonRef = useRef(null);

  const val  = parseInt(skill.value) || 0;
  const isCthulhuMythos = skill.name?.toLowerCase() === 'cthulhu mythos';
  const isOcc = skill.occupation === '1' || skill.occupation === 'true';

  if (val === 0 && !isCthulhuMythos) return null;

  const label = rollName || displayName || skill.name;
  const fs = base => (base * fontScale) + 'px';

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => {
          setButtonRect(buttonRef.current?.getBoundingClientRect() ?? null);
          setShowPopup(true);
        }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: '4px', padding: '4px 8px', minHeight: '30px',
          borderRadius: '4px', border: '1px solid var(--border-main)',
          background: 'var(--bg-input)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', textAlign: 'left',
          transition: 'border-color 0.1s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; }}
      >
        {/* Occupation dot */}
        <span style={{ width: '8px', flexShrink: 0, textAlign: 'center' }}>
          {isOcc && <span style={{ color: 'var(--accent)', fontSize: '7px' }}>●</span>}
        </span>

        {/* Skill name */}
        <span style={{
          flex: 1, fontSize: fs(11),
          color: isOcc ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayName ?? skill.name}
        </span>

        {/* Val */}
        <span style={{
          flexShrink: 0, fontSize: fs(12), fontWeight: '600',
          color: 'var(--text-primary)', minWidth: '28px', textAlign: 'right',
        }}>
          {val || '—'}
        </span>
      </button>

      {showPopup && (
        <SkillRollPopup
          label={label}
          value={val}
          defaultMode={advMode ? 'adv' : disMode ? 'dis' : 'normal'}
          buttonRect={buttonRect}
          onRoll={mode => { onRoll(label, val, mode); setShowPopup(false); setButtonRect(null); }}
          onClose={() => { setShowPopup(false); setButtonRect(null); }}
        />
      )}
    </div>
  );
}