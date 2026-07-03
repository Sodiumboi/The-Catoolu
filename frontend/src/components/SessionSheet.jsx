import { useState, useMemo, useRef } from 'react';
import SessionTrackedStat from './SessionTrackedStat';
import SessionSkillRow    from './SessionSkillRow';
import SkillRollPopup     from './SkillRollPopup';
import apiClient          from '../api/client';
import { accentLabel }    from './sheet/tokens';

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
    <div className="relative flex flex-col items-center">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg border border-(--border-main) bg-(--bg-input) cursor-pointer [transition:all_0.1s] min-w-13"
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'var(--accent-bg)';
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'var(--bg-input)';
          e.currentTarget.style.borderColor = 'var(--border-main)';
        }}
      >
        {/* accentLabel stays as style={accentLabel} — imported plain style object from tokens.js, which stays untouched per the Batch 5b decision */}
        <span style={accentLabel}>
          {label}
        </span>
        {sublabel && (
          <span className="font-bold uppercase tracking-[0.06em] rounded-[3px] py-0 px-0.75 text-(--text-muted) font-sans bg-(--bg-section-hd) text-[calc(8px*var(--sheet-font-scale))]">
            {sublabel}
          </span>
        )}
        <span className="font-bold font-serif text-(--text-primary) leading-none text-[calc(18px*var(--sheet-font-scale))]">
          {num}
        </span>
        <div className="flex gap-1">
          <span className="text-(--text-faint) font-sans text-[calc(9px*var(--sheet-font-scale))]">
            {half}
          </span>
          <span className="text-(--text-faint) font-sans text-[calc(9px*var(--sheet-font-scale))]">
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
    <div className="mb-3">
      <div className="text-[calc(9px*var(--sheet-font-scale))] font-semibold uppercase tracking-[0.08em] text-(--accent) font-sans py-1 px-2 border-b border-(--border-main) mb-1.5">
        {title}
      </div>
      <div className="py-0 px-1">
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
    <div className="font-sans bg-(--bg-page)">

      {/* ── Personal Details ── */}
      <div className="flex gap-2.5 p-3 border-b border-(--border-main) items-start">
        {/* Portrait — read only */}
        <div className="w-14 h-18 rounded-md overflow-hidden shrink-0 bg-(--bg-section-hd) border border-(--border-main)">
          {portrait ? (
            <img
              src={'data:image/jpeg;base64,' + portrait}
              alt={details.Name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-serif text-xl text-(--text-muted)">
              {(details.Name || '?').slice(0, 1)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-serif text-[15px] text-(--text-primary) mb-0.5 truncate">
            {details.Name || 'Investigator'}
          </div>
          <div className="text-[11px] text-(--accent) mb-1">
            {details.Occupation}
          </div>
          <div className="text-[10px] text-(--text-faint)">
            {[details.Age && 'Age ' + details.Age,
              details.Birthplace,
              details.Residence]
              .filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {/* ── Tracked Stats ── */}
      <div className="py-2.5 px-3 border-b border-(--border-main)">
        {/* HP / MP / Luck / Sanity — single row */}
        <div className="flex gap-2 justify-center items-start">
          <SessionTrackedStat
            label="HP" statKey="HitPts"
            maxVal={chars.HitPtsMax}   currentVal={chars.HitPts}
            onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
          />
          <div className="w-px bg-(--border-main) self-stretch my-1" />
          <SessionTrackedStat
            label="MP" statKey="MagicPts"
            maxVal={chars.MagicPtsMax} currentVal={chars.MagicPts}
            onSave={(sk, ov, nv) => onStatBlur(sk, ov, nv, characterId)}
          />
          <div className="w-px bg-(--border-main) self-stretch my-1" />
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
          <div className="w-px bg-(--border-main) self-stretch my-1" />
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
      <Section title="Characteristics">
        <div className="flex gap-1 flex-wrap justify-center">
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
        <div className="flex gap-2 flex-wrap justify-center mt-2 py-1.5 px-0 border-t border-(--border-main)">
          {[
            { label: 'DB',    value: chars.DamageBonus || 'None', color: 'var(--danger)'       },
            { label: 'Build', value: chars.Build,                 color: 'var(--text-primary)'  },
            { label: 'Dodge', value: inv?.Combat?.Dodge?.value,   color: '#60a5fa'              },
            { label: 'Move',  value: chars.Move,                  color: 'var(--text-primary)'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="text-[9px] text-(--text-faint) uppercase mb-0.5">
                {label}
              </div>
              {/* color stays inline — per-stat color varies (danger/primary/hardcoded blue), not a fixed token; same pattern as sheet/DerivedStats.jsx */}
              <div className="font-serif text-sm font-semibold bg-(--bg-input) border border-(--border-main) rounded-md py-0.75 px-2" style={{ color }}>
                {value ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Weapons ── */}
      {weapons.length > 0 && (
        <Section title="Weapons">
          <div className="flex flex-col gap-1">
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
        <Section title="Financial Status">
          <div className="flex gap-2 flex-wrap justify-center">
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
      <Section title="Skills">
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search skills..."
          value={skillSearch}
          onChange={e => setSkillSearch(e.target.value)}
          className="w-full py-1.25 px-2 rounded-md border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-[11px] outline-none! box-border mb-1.5 input-focus-glow focus:border-(--border-focus)"
        />

        {/* Grouped two-column layout */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {[skillGroups.left, skillGroups.right].map((col, ci) => (
            <div key={ci}>
              <div className="flex items-center gap-1 pt-0 px-2 pb-1 mb-1 border-b border-(--border-main)">
                <span className="w-2 shrink-0" />
                <span className="flex-1 text-[9px] text-(--accent) uppercase tracking-[0.06em]">Skill</span>
                <span className="min-w-7 text-right text-[9px] text-(--accent) uppercase tracking-[0.06em]">Reg</span>
              </div>
              <div className="flex flex-col gap-0.75">
                {col.map(g => g.type === 'flat' ? (
                  <SessionSkillRow
                    key={g.idx}
                    skill={g.skill}
                    displayName={g.skill.name}
                    advMode={advMode} disMode={disMode}
                    onRoll={onStatRoll}
                  />
                ) : (
                  <div key={g.parentName} className="rounded-md overflow-hidden border border-(--border-main)">
                    <div className="py-0.75 px-2 bg-(--bg-section-hd)">
                      <span className="text-[calc(11px*var(--sheet-font-scale))] font-semibold text-(--accent)">
                        {g.parentName}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.75 p-0.75">
                      {g.entries.map(({ skill, idx }) => {
                        const sub = skill.subskill && skill.subskill !== 'None' ? skill.subskill : null;
                        return (
                          <SessionSkillRow
                            key={idx}
                            skill={skill}
                            displayName={sub ?? '—'}
                            rollName={sub ? skill.name + ' (' + sub + ')' : skill.name}
                            advMode={advMode} disMode={disMode}
                            onRoll={onStatRoll}
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
          <div className="text-center p-3 text-xs text-(--text-faint) italic">
            No skills found
          </div>
        )}
      </Section>

      {/* Bottom padding */}
      <div className="h-5" />
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
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => { setButtonRect(buttonRef.current?.getBoundingClientRect() ?? null); setShowPopup(true); }}
        className="w-full flex items-center justify-between py-1.5 px-2 rounded-md border border-(--border-main) bg-(--bg-input) cursor-pointer font-sans [transition:all_0.1s] text-left"
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
          <div className="text-xs text-(--text-primary) font-medium">
            {weapon.name}
          </div>
          <div className="text-[10px] text-(--text-muted)">
            {weapon.skillname}
            {weapon.damage && ' · ' + weapon.damage}
            {weapon.range && weapon.range !== 'Touch' && ' · ' + weapon.range}
          </div>
        </div>
        <div className="text-right shrink-0">
          {skillVal ? (
            <span className="text-sm font-bold text-(--accent) font-serif">
              {skillVal}
            </span>
          ) : (
            <span className="text-[11px] text-(--text-faint)">—</span>
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
const btnCssBase = 'w-8 h-8 rounded-lg border border-(--border-main) bg-(--bg-input) cursor-pointer flex items-center justify-center [transition:all_0.1s]';

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
    <div className="flex flex-col items-center gap-1">
      <span className="text-[calc(9px*var(--sheet-font-scale))] font-semibold uppercase tracking-[0.07em] text-(--accent) font-sans">
        {label}
      </span>

      <button
        ref={btnRef}
        onClick={handleOpen}
        className="min-w-22.5 py-1.25 px-2 rounded-md border-2 border-(--border-focus) bg-(--bg-input) text-(--text-primary) font-sans text-xs text-center cursor-pointer [transition:border-color_0.15s] whitespace-nowrap"
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
      >
        {current ? '$' + current : '—'}
      </button>

      {showPopup && (
        <>
          <div className="fixed inset-0 z-90" onClick={handleClose} />
          {/* This whole block stays inline — popupStyle is runtime DOM-measured geometry (btnRect/window.innerWidth), merged into one style object with the rest of the popup's visual properties; not splitting it apart to keep the geometry exception isolated and unambiguous */}
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
            <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-(--accent) font-sans">
              {label}
            </div>

            {/* Current value */}
            <div className="font-serif text-[26px] font-bold text-(--text-primary)">
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
              className="w-full py-1 px-2 rounded-md border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-[13px] text-center outline-none! box-border input-focus-glow focus:border-(--border-focus)"
            />

            {/* − + */}
            <div className="flex gap-1.5 items-center">
              {/* color stays inline — btnCssBase's only data-driven parameter, everything else is static */}
              <button onClick={() => applyStep(-1)} className={btnCssBase} style={{ color: 'var(--danger)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                <span className="icon icon-sm">remove</span>
              </button>
              <button onClick={() => applyStep(+1)} className={btnCssBase} style={{ color: 'var(--success)' }}
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