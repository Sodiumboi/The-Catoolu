import { useState, useMemo, useRef } from 'react';
import SessionTrackedStat from './SessionTrackedStat';
import SessionSkillRow    from './SessionSkillRow';
import SkillRollPopup     from './SkillRollPopup';
import apiClient          from '../api/client';
import { useTheme }       from '../context/ThemeContext';
import { accentLabel }    from './sheet/tokens';

// ── Stat button ────────────────────────────────────────────────
function StatButton({ label, value, sublabel, advMode, disMode, onRoll, scale = 1 }) {
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
        <span style={accentLabel}>
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
          fontSize: (18 * scale) + 'px', fontWeight: '700',
          fontFamily: 'var(--font-serif)', color: 'var(--text-primary)',
          lineHeight: 1,
        }}>
          {num}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <span style={{ fontSize: (9 * scale) + 'px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
            {half}
          </span>
          <span style={{ fontSize: (9 * scale) + 'px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
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
function Section({ title, children, scale = 1 }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontSize: (9 * scale) + 'px', fontWeight: '600',
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
  const { sheetFontScale } = useTheme();
  const fs = (base) => base * sheetFontScale;
  const [skillSearch, setSkillSearch] = useState('');

  const inv      = charData?.sheet_data?.Investigator;
  const cash     = inv?.Cash || {};
  const details  = inv?.PersonalDetails   || {};
  const chars    = inv?.Characteristics   || {};
  const skills   = useMemo(() => charData?.sheet_data?.Investigator?.Skills?.Skill   || [], [charData]);
  const weapons  = useMemo(() => charData?.sheet_data?.Investigator?.Weapons?.weapon || [], [charData]);
  const portrait = details.Portrait;

  // Hide empty skills and meaningless (None) subskill placeholders
  const filteredSkills = useMemo(() => {
    const isNone = sub => sub?.toLowerCase() === 'none';

    // Pre-scan: per skill name, count None slots and track whether a named subskill exists
    const hasNamed  = {}; // skillName → true when a real subskill is filled in
    const noneCount = {}; // skillName → number of None slots
    for (const s of skills) {
      if (!s.subskill) continue;
      const key = s.name.toLowerCase();
      if (isNone(s.subskill)) {
        noneCount[key] = (noneCount[key] || 0) + 1;
      } else {
        hasNamed[key] = true;
      }
    }

    return skills.filter(s => {
      const val = parseInt(s.value) || 0;
      if (val === 0 && s.name.toLowerCase() !== 'cthulhu mythos') return false;
      // Drop None slots when a named subskill exists OR there are multiple empty slots
      if (isNone(s.subskill)) {
        const key = s.name.toLowerCase();
        if (hasNamed[key] || (noneCount[key] || 0) > 1) return false;
      }
      if (!skillSearch.trim()) return true;
      const display = s.subskill && !isNone(s.subskill)
        ? s.name + ' (' + s.subskill + ')'
        : s.name;
      return display.toLowerCase().includes(skillSearch.toLowerCase());
    });
  }, [skills, skillSearch]);

  // Build skill groups for the two-column layout
  const skillGroups = useMemo(() => {
    const groups = [];
    const seen   = {};
    filteredSkills.forEach((skill, idx) => {
      if (skill.subskill != null) {
        if (!seen[skill.name]) {
          seen[skill.name] = { type: 'group', parentName: skill.name, entries: [] };
          groups.push(seen[skill.name]);
        }
        seen[skill.name].entries.push({ skill, idx });
      } else {
        groups.push({ type: 'flat', skill, idx });
      }
    });
    const half = Math.ceil(groups.length / 2);
    return { left: groups.slice(0, half), right: groups.slice(half) };
  }, [filteredSkills]);

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
      fontFamily: 'var(--font-sans)',
      background: 'var(--bg-page)',
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
        padding:     '10px 12px',
        borderBottom:'1px solid var(--border-main)',
      }}>
        {/* HP / MP / Luck / Sanity — single row */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'flex-start' }}>
          <SessionTrackedStat
            label="HP" statKey="HitPts"
            maxVal={chars.HitPtsMax}   currentVal={chars.HitPts}
            onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
          />
          <div style={{ width: '1px', background: 'var(--border-main)', alignSelf: 'stretch', margin: '4px 0' }} />
          <SessionTrackedStat
            label="MP" statKey="MagicPts"
            maxVal={chars.MagicPtsMax} currentVal={chars.MagicPts}
            onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
          />
          <div style={{ width: '1px', background: 'var(--border-main)', alignSelf: 'stretch', margin: '4px 0' }} />
          <SessionTrackedStat
            label="Luck" statKey="Luck"
            maxVal={chars.LuckMax}     currentVal={chars.Luck}
            onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
            rollable
            advMode={advMode}
            disMode={disMode}
            onRoll={(mode) => onStatRoll(
              'Luck',
              parseInt(chars.Luck) || parseInt(chars.LuckMax) || 0,
              mode
            )}
          />
          <div style={{ width: '1px', background: 'var(--border-main)', alignSelf: 'stretch', margin: '4px 0' }} />
          <SessionTrackedStat
            label="Sanity" statKey="Sanity"
            maxVal={chars.SanityStart} currentVal={chars.Sanity}
            insaneVal={chars.SanityMax}
            onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
            rollable
            advMode={advMode}
            disMode={disMode}
            onRoll={(mode) => onStatRoll('Sanity', parseInt(chars.Sanity) || parseInt(chars.SanityStart) || 0, mode)}
          />
        </div>
      </div>

      {/* ── Characteristics ── */}
      <Section title="Characteristics" scale={sheetFontScale}>
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
              scale={sheetFontScale}
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
        <Section title="Weapons" scale={sheetFontScale}>
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

      {/* ── Financial Status ── */}
      {(cash.spending || cash.cash || cash.assets) && (
        <Section title="Financial Status" scale={sheetFontScale}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Spending Limit', field: 'spending' },
              { label: 'Cash',           field: 'cash'     },
              { label: 'Assets',         field: 'assets'   },
            ].map(({ label, field }) => (
              <MoneyField
                key={field}
                label={label}
                value={cash[field] || ''}
                onSave={(newVal) => {
                  apiClient.put('/characters/' + characterId, {
                    sheet_data: {
                      ...charData.sheet_data,
                      Investigator: {
                        ...charData.sheet_data.Investigator,
                        Cash: {
                          ...charData.sheet_data.Investigator.Cash,
                          [field]: newVal,
                        },
                      },
                    },
                  }).catch(() => {});
                }}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Skills ── */}
      <Section title="Skills" scale={sheetFontScale}>
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

        {/* Grouped two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          {[skillGroups.left, skillGroups.right].map((col, ci) => (
            <div key={ci}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '0 8px 4px', marginBottom: '4px',
                borderBottom: '1px solid var(--border-main)',
              }}>
                <span style={{ width: '8px', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '9px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skill</span>
                <span style={{ minWidth: '28px', textAlign: 'right', fontSize: '9px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reg</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {col.map(g => g.type === 'flat' ? (
                  <SessionSkillRow
                    key={g.idx}
                    skill={g.skill}
                    displayName={g.skill.name}
                    advMode={advMode} disMode={disMode}
                    onRoll={onStatRoll} fontScale={sheetFontScale}
                  />
                ) : (
                  <div key={g.parentName} style={{
                    borderRadius: '6px', overflow: 'hidden',
                    border: '1px solid var(--border-main)',
                  }}>
                    <div style={{ padding: '3px 8px', background: 'var(--bg-section-hd)' }}>
                      <span style={{ fontSize: (11 * sheetFontScale) + 'px', fontWeight: '600', color: 'var(--accent)' }}>
                        {g.parentName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '3px' }}>
                      {g.entries.map(({ skill, idx }) => {
                        const sub = skill.subskill && skill.subskill !== 'None' ? skill.subskill : null;
                        return (
                          <SessionSkillRow
                            key={idx}
                            skill={skill}
                            displayName={sub ?? '—'}
                            rollName={sub ? skill.name + ' (' + sub + ')' : skill.name}
                            advMode={advMode} disMode={disMode}
                            onRoll={onStatRoll} fontScale={sheetFontScale}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

// ── Shared button style helper (mirrors SessionTrackedStat) ───
function btnCss(color) {
  return {
    width: '32px', height: '32px', borderRadius: '8px',
    border: '1px solid var(--border-main)',
    background: 'var(--bg-input)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: color ?? 'inherit', transition: 'all 0.1s ease',
  };
}

// ── Money Field ────────────────────────────────────────────────
const MONEY_POPUP_W = 160;
const stripDollar = v => String(v || '').replace(/^\$+/, '').trim();

function MoneyField({ label, value, onSave }) {
  const [showPopup, setShowPopup] = useState(false);
  const [current,   setCurrent]   = useState(stripDollar(value));
  const [step,      setStep]      = useState('');
  const [btnRect,   setBtnRect]   = useState(null);
  const btnRef = useRef(null);

  const handleOpen = () => {
    setBtnRect(btnRef.current?.getBoundingClientRect() ?? null);
    setStep('');
    setShowPopup(p => !p);
  };

  const handleClose = () => { setShowPopup(false); setStep(''); };

  const applyStep = (sign) => {
    const base = parseFloat(String(current).replace(/[^0-9.-]/g, '')) || 0;
    const s    = parseFloat(step) || 0;
    if (s === 0) return;
    const next = sign === -1 ? Math.max(0, base - s) : base + s;
    const nextStr = String(next);
    setCurrent(nextStr);
    onSave(nextStr);
    setStep('');
  };

  const popupStyle = btnRect ? {
    position:  'fixed',
    top:       btnRect.bottom + 6,
    left:      Math.max(
      MONEY_POPUP_W / 2 + 8,
      Math.min(window.innerWidth - MONEY_POPUP_W / 2 - 8, btnRect.left + btnRect.width / 2)
    ),
    transform: 'translateX(-50%)',
    zIndex:    100,
  } : { display: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <span style={{
        fontSize: '9px', fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        color: 'var(--accent)', fontFamily: 'var(--font-sans)',
      }}>
        {label}
      </span>

      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          minWidth:     '90px',
          padding:      '5px 8px',
          borderRadius: '6px',
          border:       '2px solid var(--border-focus)',
          background:   'var(--bg-input)',
          color:        'var(--text-primary)',
          fontFamily:   'var(--font-sans)',
          fontSize:     '12px',
          textAlign:    'center',
          cursor:       'pointer',
          transition:   'border-color 0.15s ease',
          whiteSpace:   'nowrap',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
      >
        {current ? '$' + current : '—'}
      </button>

      {showPopup && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={handleClose} />
          <div style={{
            ...popupStyle,
            background:    'var(--bg-popup)',
            border:        '1px solid var(--border-focus)',
            borderRadius:  '10px',
            boxShadow:     'var(--shadow-dropdown)',
            padding:       '10px 12px',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '8px',
            minWidth:      MONEY_POPUP_W + 'px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              color: 'var(--accent)', fontFamily: 'var(--font-sans)',
            }}>
              {label}
            </div>

            {/* Current value */}
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: '700',
              color: 'var(--text-primary)',
            }}>
              ${current || '0'}
            </div>

            {/* Step input */}
            <input
              type="number"
              min="0"
              value={step}
              onChange={e => setStep(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') handleClose(); }}
              placeholder="amount"
              autoFocus
              style={{
                width:        '100%',
                padding:      '4px 8px',
                borderRadius: '6px',
                border:       '1px solid var(--border-input)',
                background:   'var(--bg-input)',
                color:        'var(--text-primary)',
                fontFamily:   'var(--font-sans)',
                fontSize:     '13px',
                textAlign:    'center',
                outline:      'none',
                boxSizing:    'border-box',
              }}
            />

            {/* − + */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button onClick={() => applyStep(-1)} style={btnCss('var(--danger)')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                <span className="icon icon-sm">remove</span>
              </button>
              <button onClick={() => applyStep(+1)} style={btnCss('var(--success)')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                <span className="icon icon-sm">add</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}