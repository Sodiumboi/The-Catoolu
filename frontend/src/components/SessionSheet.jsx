import { useState, useMemo, useRef } from 'react';
import SessionTrackedStat from './SessionTrackedStat';
import SessionSkillRow    from './SessionSkillRow';
import SkillRollPopup     from './SkillRollPopup';

// ── Stat button ────────────────────────────────────────────────
function StatButton({ label, value, sublabel, advMode, disMode, onRoll }) {
  const [showPopup, setShowPopup] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const buttonRef = useRef(null);
  const num   = parseInt(value) || 0;
  const half  = Math.floor(num / 2);
  const fifth = Math.floor(num / 5);

  function handleClick() {
    setButtonRect(buttonRef.current?.getBoundingClientRect() ?? null);
    setShowPopup(true);
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        ref={buttonRef}
        onClick={handleClick}
        style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            '2px',
          padding:        '6px 8px',
          borderRadius:   '8px',
          border:         '1px solid var(--border-main)',
          background:     'var(--bg-input)',
          cursor:         'pointer',
          transition:     'all 0.1s ease',
          minWidth:       '52px',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'var(--accent-bg)';
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'var(--bg-input)';
          e.currentTarget.style.borderColor = 'var(--border-main)';
        }}
      >
        <span style={{
          fontSize: '9px', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.07em',
          color: 'var(--accent)', fontFamily: 'var(--font-sans)',
        }}>
          {label}
        </span>
        {sublabel && (
          <span style={{
            fontSize: '8px', fontWeight: '700',
            color: 'var(--text-muted)', fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            background: 'var(--bg-section-hd)',
            borderRadius: '3px', padding: '0 3px',
          }}>
            {sublabel}
          </span>
        )}
        <span style={{
          fontSize: '18px', fontWeight: '700',
          fontFamily: 'var(--font-serif)', color: 'var(--text-primary)',
          lineHeight: 1,
        }}>
          {num}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
            {half}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
            {fifth}
          </span>
        </div>
      </button>

      {showPopup && (
        <SkillRollPopup
          label={label}
          value={num}
          defaultMode={advMode ? 'adv' : disMode ? 'dis' : 'normal'}
          buttonRect={buttonRect}
          onRoll={(mode) => { onRoll(label, num, mode); setShowPopup(false); }}
          onClose={() => { setShowPopup(false); setButtonRect(null); }}
        />
      )}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontSize: '9px', fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--accent)', fontFamily: 'var(--font-sans)',
        padding: '4px 8px',
        borderBottom: '1px solid var(--border-main)',
        marginBottom: '6px',
      }}>
        {title}
      </div>
      <div style={{ padding: '0 4px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Main SessionSheet ──────────────────────────────────────────
export default function SessionSheet({
  charData,
  characterId,
  advMode,
  disMode,
  onStatRoll,      // (label, value, mode) => void
  onWeaponAttack,  // (weapon, skills) => void
  onStatBlur,      // (statKey, oldVal, newVal) => void
}) {
  const [skillSearch, setSkillSearch] = useState('');

  const inv      = charData?.sheet_data?.Investigator;
  const details  = inv?.PersonalDetails   || {};
  const chars    = inv?.Characteristics   || {};
  const skills   = useMemo(() => charData?.sheet_data?.Investigator?.Skills?.Skill   || [], [charData]);
  const weapons  = useMemo(() => charData?.sheet_data?.Investigator?.Weapons?.weapon || [], [charData]);
  const portrait = details.Portrait;

  // Group skills alphabetically, hide empty ones
  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      const val = parseInt(s.value) || 0;
      if (val === 0) return false;
      if (!skillSearch.trim()) return true;
      return s.name.toLowerCase().includes(skillSearch.toLowerCase());
    });
  }, [skills, skillSearch]);

  const LEFT_STATS  = [
    { key: 'STR' },
    { key: 'CON' },
    { key: 'DEX' },
    { key: 'INT' },
  ];
  const RIGHT_STATS = [
    { key: 'SIZ' },
    { key: 'POW' },
    { key: 'APP' },
    { key: 'EDU' },
  ];

  return (
    <div style={{
      height:        '100%',
      overflowY:     'auto',
      fontFamily:    'var(--font-sans)',
      background:    'var(--bg-page)',
    }}>

      {/* ── Personal Details ── */}
      <div style={{
        display:     'flex',
        gap:         '10px',
        padding:     '12px',
        borderBottom:'1px solid var(--border-main)',
        alignItems:  'flex-start',
      }}>
        {/* Portrait — read only */}
        <div style={{
          width:        '56px',
          height:       '72px',
          borderRadius: '6px',
          overflow:     'hidden',
          flexShrink:   0,
          background:   'var(--bg-section-hd)',
          border:       '1px solid var(--border-main)',
        }}>
          {portrait ? (
            <img
              src={'data:image/jpeg;base64,' + portrait}
              alt={details.Name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontSize: '20px',
              color: 'var(--text-muted)',
            }}>
              {(details.Name || '?').slice(0, 1)}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: '15px',
            color: 'var(--text-primary)', marginBottom: '2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {details.Name || 'Investigator'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '4px' }}>
            {details.Occupation}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
            {[details.Age && 'Age ' + details.Age,
              details.Birthplace,
              details.Residence]
              .filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {/* ── Tracked Stats ── */}
      <div style={{
        display:     'flex',
        gap:         '8px',
        padding:     '10px 12px',
        borderBottom:'1px solid var(--border-main)',
        flexWrap:    'wrap',
        justifyContent:'center',
      }}>
        <SessionTrackedStat
          label="HP" statKey="HitPts"
          maxVal={chars.HitPtsMax}   currentVal={chars.HitPts}
          onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
        />
        <SessionTrackedStat
          label="MP" statKey="MagicPts"
          maxVal={chars.MagicPtsMax} currentVal={chars.MagicPts}
          onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
        />
        <SessionTrackedStat
          label="Luck" statKey="Luck"
          maxVal={chars.LuckMax}     currentVal={chars.Luck}
          onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
        />
        <SessionTrackedStat
          label="Sanity" statKey="Sanity"
          maxVal={chars.SanityStart} currentVal={chars.Sanity}
          insaneVal={chars.SanityMax}
          onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
        />
      </div>

      {/* ── Characteristics ── */}
      <Section title="Characteristics">
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[...LEFT_STATS, ...RIGHT_STATS].map(({ key, sub }) => (
            <StatButton
              key={key}
              label={key}
              sublabel={sub}
              value={chars[key]}
              advMode={advMode}
              disMode={disMode}
              onRoll={onStatRoll}
            />
          ))}
        </div>

        {/* Derived stats */}
        <div style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap',
          justifyContent: 'center', marginTop: '8px',
          padding: '6px 0',
          borderTop: '1px solid var(--border-main)',
        }}>
          {[
            { label: 'DB',    value: chars.DamageBonus || 'None', color: 'var(--danger)'       },
            { label: 'Build', value: chars.Build,                 color: 'var(--text-primary)'  },
            { label: 'Dodge', value: inv?.Combat?.Dodge?.value,   color: '#60a5fa'              },
            { label: 'Move',  value: chars.Move,                  color: 'var(--text-primary)'  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '9px', color: 'var(--text-faint)',
                textTransform: 'uppercase', marginBottom: '2px',
              }}>
                {label}
              </div>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: '14px',
                fontWeight: '600', color,
                background: 'var(--bg-input)',
                border: '1px solid var(--border-main)',
                borderRadius: '6px', padding: '3px 8px',
              }}>
                {value ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Weapons ── */}
      {weapons.length > 0 && (
        <Section title="Weapons">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {weapons.map((weapon, i) => (
              <WeaponButton
                key={i}
                weapon={weapon}
                skills={skills}
                advMode={advMode}
                disMode={disMode}
                onAttack={onWeaponAttack}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Skills ── */}
      <Section title="Skills">
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search skills..."
          value={skillSearch}
          onChange={e => setSkillSearch(e.target.value)}
          style={{
            width:        '100%',
            padding:      '5px 8px',
            borderRadius: '6px',
            border:       '1px solid var(--border-input)',
            background:   'var(--bg-input)',
            color:        'var(--text-primary)',
            fontFamily:   'var(--font-sans)',
            fontSize:     '11px',
            outline:      'none',
            boxSizing:    'border-box',
            marginBottom: '6px',
          }}
        />

        {/* Column headers */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom:        '1px solid var(--border-main)',
          marginBottom:        '2px',
          paddingBottom:       '4px',
        }}>
          {[0, 1].map(col => (
            <div key={col} style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>Skill</span>
              <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>Reg</span>
            </div>
          ))}
        </div>

        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 '2px',
        }}>
          {filteredSkills.map((skill, i) => (
            <SessionSkillRow
              key={i}
              skill={skill}
              advMode={advMode}
              disMode={disMode}
              onRoll={onStatRoll}
            />
          ))}
        </div>

        {filteredSkills.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '12px',
            fontSize: '12px', color: 'var(--text-faint)',
            fontStyle: 'italic',
          }}>
            No skills found
          </div>
        )}
      </Section>

      {/* Bottom padding */}
      <div style={{ height: '20px' }} />
    </div>
  );
}

// ── Weapon Button ──────────────────────────────────────────────
function WeaponButton({ weapon, skills, advMode, disMode, onAttack }) {
  const [showPopup, setShowPopup] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const buttonRef = useRef(null);

  const matchedSkill = skills.find(s =>
    s.name.toLowerCase().includes(
      (weapon.skillname || '').toLowerCase().split('(')[0].trim()
    )
  );
  // weapon.regular is the precomputed skill threshold from the sheet (most reliable)
  const skillVal = weapon.regular
    ? parseInt(weapon.regular)
    : matchedSkill ? parseInt(matchedSkill.value) : null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => { setButtonRect(buttonRef.current?.getBoundingClientRect() ?? null); setShowPopup(true); }}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '6px 8px',
          borderRadius:   '6px',
          border:         '1px solid var(--border-main)',
          background:     'var(--bg-input)',
          cursor:         'pointer',
          fontFamily:     'var(--font-sans)',
          transition:     'all 0.1s ease',
          textAlign:      'left',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'var(--accent-bg)';
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'var(--bg-input)';
          e.currentTarget.style.borderColor = 'var(--border-main)';
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>
            {weapon.name}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {weapon.skillname}
            {weapon.damage && ' · ' + weapon.damage}
            {weapon.range && weapon.range !== 'Touch' && ' · ' + weapon.range}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {skillVal ? (
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>
              {skillVal}
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>—</span>
          )}
        </div>
      </button>

      {showPopup && (
        <SkillRollPopup
          label={'Attack — ' + weapon.name}
          value={skillVal || 0}
          defaultMode={advMode ? 'adv' : disMode ? 'dis' : 'normal'}
          buttonRect={buttonRect}
          onRoll={(mode) => {
            onAttack(weapon, matchedSkill, mode);
            setShowPopup(false);
            setButtonRect(null);
          }}
          onClose={() => { setShowPopup(false); setButtonRect(null); }}
        />
      )}
    </div>
  );
}