import { useState, useRef } from 'react';
import SkillRollPopup from './SkillRollPopup';

export default function SessionSkillRow({ skill, advMode, disMode, onRoll, fontScale = 1 }) {
  const [showPopup, setShowPopup] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const buttonRef = useRef(null);

  const val = parseInt(skill.value) || 0;

  if (!val || val === 0) return null; // hide empty skills

  const displayName = skill.subskill
    ? skill.name + ' (' + skill.subskill + ')'
    : skill.name;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => { setButtonRect(buttonRef.current?.getBoundingClientRect() ?? null); setShowPopup(true); }}
        style={{
          width:        '100%',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'space-between',
          padding:      '5px 8px',
          borderRadius: '6px',
          border:       '1px solid transparent',
          background:   'transparent',
          cursor:       'pointer',
          fontFamily:   'var(--font-sans)',
          transition:   'all 0.1s ease',
          textAlign:    'left',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background    = 'var(--accent-bg)';
          e.currentTarget.style.borderColor   = 'var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background    = 'transparent';
          e.currentTarget.style.borderColor   = 'transparent';
        }}
      >
        {/* Occupation dot */}
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: skill.occupation === '1' ? 'var(--accent)' : 'transparent',
          border: skill.occupation === '1' ? 'none' : '1px solid var(--border-main)',
          flexShrink: 0, marginRight: '6px',
        }} />

        {/* Skill name */}
        <span style={{
          flex: 1, fontSize: (12 * fontScale) + 'px',
          color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayName}
        </span>

        {/* Value */}
        <span style={{ fontSize: (12 * fontScale) + 'px', fontWeight: '600', color: 'var(--text-primary)', flexShrink: 0 }}>
          {val}
        </span>
      </button>

      {showPopup && (
        <SkillRollPopup
          label={displayName}
          value={val}
          defaultMode={advMode ? 'adv' : disMode ? 'dis' : 'normal'}
          buttonRect={buttonRect}
          onRoll={(mode) => { onRoll(displayName, val, mode); setShowPopup(false); setButtonRect(null); }}
          onClose={() => { setShowPopup(false); setButtonRect(null); }}
        />
      )}
    </div>
  );
}