import { useState, useEffect, useRef } from 'react';
import wojakRight from '../assets/wojak-point_andy_right.png';
import wojakLeft  from '../assets/wojak-point_andy_left.png';

// ── Digit helpers ─────────────────────────────────────────────

function getSides(notation) {
  if (!notation) return null;
  const m = notation.match(/d(\d+)/i);
  return m ? parseInt(m[1]) : null;
}

function digitCount(sides) {
  if (!sides) return 1;
  if (sides === 100) return 2;
  return String(sides).length;
}

function formatDie(value, sides) {
  const count   = digitCount(sides);
  const display = (value === sides && sides === 100) ? 0 : value;
  return String(display).padStart(count, '0').split('');
}

// ── Digit Box ─────────────────────────────────────────────────
function DigitBox({ digit, severity = 'none' }) {
  const isNone = severity === 'none';
  return (
    <div style={{
      width:         '42px',
      minWidth:      '42px',
      height:        '50px',
      borderRadius:  '6px',
      border:        isNone
        ? '2px solid var(--text-muted)'
        : `2px solid var(--roll-${severity}-border)`,
      background:    'var(--bg-input)',
      display:       'flex',
      alignItems:    'center',
      justifyContent:'center',
      fontFamily:    'var(--font-serif)',
      fontSize:      '24px',
      fontWeight:    '700',
      color:         isNone ? 'var(--text-primary)' : `var(--roll-${severity}-text)`,
      boxShadow:     !isNone ? `0 0 2px var(--roll-${severity}-border)` : 'none',
    }}>
      {digit}
    </div>
  );
}

// ── Single die → digit boxes (adv/dis path) ───────────────────
function RollDigits({ value, sides, severity = 'none' }) {
  return (
    <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
      {formatDie(value, sides).map((d, i) => (
        <DigitBox key={i} digit={d} severity={severity} />
      ))}
    </div>
  );
}

// ── Multiple dice → per-die groups with separator bars ────────
function MultiDieDisplay({ rolls, sides, severity = 'none' }) {
  const items = [];
  rolls.forEach((dieValue, dieIndex) => {
    if (dieIndex > 0) {
      items.push(
        <div key={'sep-' + dieIndex} style={{
          width:        '2px',
          height:       '56px',
          background:   'var(--border-main)',
          borderRadius: '2px',
          flexShrink:   0,
        }} />
      );
    }
    items.push(
      <div key={'die-' + dieIndex} style={{ display: 'flex', gap: '2px' }}>
        {formatDie(dieValue, sides).map((digit, digitIndex) => (
          <DigitBox key={digitIndex} digit={digit} severity={severity} />
        ))}
      </div>
    );
  });

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            '6px',
      justifyContent: 'center',
      flexWrap:       'wrap',
    }}>
      {items}
    </div>
  );
}

// ── Main RollCard component ────────────────────────────────────
export default function RollCard({ msg, isOwn }) {
  const [revealed, setRevealed] = useState(false);
  const delay = useRef(Math.floor(Math.random() * 400) + 300);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), delay.current);
    return () => clearTimeout(timer);
  }, []);

  const raw = typeof msg.content === 'string'
    ? (() => { try { return JSON.parse(msg.content); } catch { return null; } })()
    : msg.content;

  const showMeme  = (raw?.notation?.toLowerCase().includes('d100') &&
    (raw?.total === 1 || raw?.total === 100)) || !!msg._forceMeme;
  const memeTotal = raw?.total;

  if (!raw) return null;
  if (!revealed) return <RollCardSkeleton isOwn={isOwn} />;

  const sl           = raw.successLevel;
  const severity     = sl?.severity || 'none';
  const isHit        = ['critical', 'extreme', 'hard', 'regular'].includes(severity);
  const sides        = getSides(raw.notation);

  const showPortrait = msg.portrait || msg.avatar_url;
  const isAdv        = raw.advantage;
  const isDis        = raw.disadvantage;
  const hasAdvDis    = isAdv || isDis;

  // Full name (up to two words) for header
  const displayName = msg.character_name
    ? msg.character_name.split(' ')[0] + ' ' + (msg.character_name.split(' ')[1] || '')
    : (msg.username || 'Someone');

  let header;
  if (raw.isDamage) {
    header = (displayName || msg.username).trim() + ' deals damage';
  } else if (raw.skillName) {
    const weaponSkills = ['brawl', 'handgun', 'rifle', 'shotgun', 'fighting'];
    const isAttack = weaponSkills.some(w => raw.skillName.toLowerCase().includes(w));
    if (isAttack) {
      header = displayName.trim() + ' makes an Attack!';
    } else if (raw.skillName.toLowerCase() === 'sanity') {
      header = displayName.trim() + ' makes a Sanity Roll!';
    } else {
      header = displayName.trim() + ' makes a ' + raw.skillName + ' Check!';
    }
  } else {
    header = displayName.trim() + ' rolls ' + (raw.notation || '').toUpperCase();
  }

  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{
      display:        'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom:   '10px',
      paddingLeft:    isOwn ? '80px' : '0',
      paddingRight:   isOwn ? '0'    : '80px',
    }}>
      {/* Card */}
      <div style={{
        display:      'flex',
        borderRadius: '12px',
        overflow:     'hidden',
        border:       msg._hidden
          ? '2px dashed var(--roll-' + severity + '-border)'
          : '1px solid var(--roll-' + severity + '-border)',
        background:   'var(--roll-' + severity + '-bg)',
        maxWidth:     '100%',
        minWidth:     '260px',
      }}>

        {/* Left colour bar */}
        <div style={{
          width:      '5px',
          flexShrink: 0,
          background: 'var(--roll-' + severity + '-border)',
        }} />

        {/* Main content */}
        <div style={{ flex: 1, padding: '12px 14px' }}>

          {/* Header pill */}
          <div style={{
            display:      'inline-flex',
            alignItems:   'center',
            background:   severity === 'none'
              ? 'var(--bg-section-hd)'
              : 'var(--roll-' + severity + '-border)',
            color:        severity === 'none' ? 'var(--text-secondary)' : '#ffffff',
            border:       severity === 'none' ? '1px solid var(--border-main)' : 'none',
            borderRadius: '20px',
            padding:      '3px 12px',
            fontSize:     '11px',
            fontWeight:   '700',
            letterSpacing:'0.05em',
            marginBottom: '10px',
            maxWidth:     '100%',
          }}>
            {header}
          </div>

          {/* Skill / notation label */}
          {raw.skillName && (
            <div style={{
              fontFamily:   'var(--font-serif)',
              fontSize:     '16px',
              color:        'var(--roll-' + severity + '-text)',
              fontWeight:   '700',
              marginBottom: '8px',
              textAlign:    'center',
            }}>
              {raw.skillName}
              {raw.advantage    && ' (Advantage)'}
              {raw.disadvantage && ' (Disadvantage)'}
            </div>
          )}

          {/* Dice display */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '10px',
            padding:        '12px 0',
          }}>
            {showMeme && (
              <img src={wojakLeft} alt="" style={{
                height: '80px', width: 'auto',
                opacity: 0.85, pointerEvents: 'none', flexShrink: 0,
              }} />
            )}

            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
              flexWrap:       'wrap',
            }}>
              {hasAdvDis && raw.advDisRolls ? (
                <>
                  <RollDigits
                    value={raw.advDisRolls[0].reduce((a, b) => a + b, 0)}
                    sides={sides}
                    severity={isAdv
                      ? (raw.advDisRolls[0][0] <= raw.advDisRolls[1][0] ? severity : 'none')
                      : (raw.advDisRolls[0][0] >= raw.advDisRolls[1][0] ? severity : 'none')}
                  />
                  <div style={{
                    width:        '2px',
                    height:       '56px',
                    background:   'var(--border-main)',
                    borderRadius: '2px',
                  }} />
                  <RollDigits
                    value={raw.advDisRolls[1].reduce((a, b) => a + b, 0)}
                    sides={sides}
                    severity={isDis
                      ? (raw.advDisRolls[1][0] >= raw.advDisRolls[0][0] ? severity : 'none')
                      : (raw.advDisRolls[1][0] <= raw.advDisRolls[0][0] ? severity : 'none')}
                  />
                </>
              ) : (
                <MultiDieDisplay
                  rolls={raw.rolls || [raw.total]}
                  sides={sides}
                  severity={severity}
                />
              )}
            </div>

            {showMeme && (
              <img src={wojakRight} alt="" style={{
                height: '80px', width: 'auto',
                opacity: 0.85, pointerEvents: 'none', flexShrink: 0,
              }} />
            )}
          </div>

          {/* Sum line for multi-die rolls */}
          {raw.rolls && raw.rolls.length > 1 && !hasAdvDis && (
            <div style={{
              textAlign:  'center',
              fontSize:   '12px',
              color:      'var(--text-muted)',
              marginTop:  '6px',
              fontFamily: 'var(--font-sans)',
            }}>
              {raw.rolls.join(' + ')}
              {raw.modifier !== 0
                ? (raw.modifier > 0 ? ' + ' : ' − ') + Math.abs(raw.modifier)
                : ''}
              {' = '}
              <strong style={{ color: 'var(--roll-' + severity + '-text)' }}>
                {raw.total}
              </strong>
            </div>
          )}

          {/* Damage total */}
          {raw.isDamage && (
            <div style={{
              textAlign:  'center',
              fontSize:   '12px',
              color:      'var(--roll-none-text)',
              marginTop:  '4px',
              fontFamily: 'var(--font-sans)',
            }}>
              {raw.weaponName} · {raw.rolls.join(' + ')}
              {raw.modifier !== 0
                ? (raw.modifier > 0 ? ' + ' : ' − ') + Math.abs(raw.modifier)
                : ''}
              {' = '}
              <strong>{raw.total}</strong>
            </div>
          )}

          {/* Result label */}
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize:   '12px',
            color:      'var(--roll-' + severity + '-text)',
            fontWeight: '600',
            textAlign:  'center',
            marginTop:  '6px',
          }}>
            {sl ? sl.emoji + ' ' + sl.label : ''}
            {raw.skillValue && (
              <span style={{ fontWeight: '400', opacity: 0.7, marginLeft: '4px' }}>
                ({raw.total})
              </span>
            )}
          </div>

          {/* Reg success threshold */}
          {sl && raw.skillValue && (
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize:   '11px',
              color:      'var(--text-faint)',
              textAlign:  'center',
              marginTop:  '2px',
            }}>
              Reg ({raw.skillValue})
            </div>
          )}

          {/* Hit / miss label for weapon attack rolls */}
          {!raw.isDamage && raw.skillName?.startsWith('Attack') && sl && (
            <div style={{
              fontSize:   '12px',
              fontWeight: '700',
              textAlign:  'center',
              color:      isHit ? 'var(--roll-regular-text)' : 'var(--roll-failure-text)',
              marginTop:  '2px',
              fontFamily: 'var(--font-sans)',
            }}>
              {isHit
                ? 'Hit! (' + raw.skillValue + ')'
                : 'Not Hit! (' + raw.skillValue + ')'}
            </div>
          )}

          <div style={{
            fontSize:  '10px',
            color:     'var(--text-faint)',
            marginTop: '4px',
            textAlign: 'center',
          }}>
            {time}
          </div>

          {/* Hidden roll indicator */}
          {msg._hidden && (
            <div style={{
              fontSize:  '10px',
              color:     'var(--text-faint)',
              fontStyle: 'italic',
              marginTop: '4px',
              textAlign: 'center',
            }}>
              <span className="icon icon-sm">lock</span>{' '}Only visible to you
            </div>
          )}
        </div>

        {/* Portrait — right column */}
        {showPortrait && (
          <div style={{
            width:          '80px',
            flexShrink:     0,
            padding:        '12px 12px 12px 0',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <img
              src={msg.portrait
                ? 'data:image/jpeg;base64,' + msg.portrait
                : (import.meta.env.VITE_API_URL || '') + msg.avatar_url}
              alt={msg.username}
              style={{
                width:        '72px',
                height:       '72px',
                borderRadius: '8px',
                objectFit:    'cover',
                border:       '1px solid var(--border-main)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Roll Card Skeleton ─────────────────────────────────────────
function RollCardSkeleton({ isOwn }) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom:   '10px',
      paddingLeft:    isOwn ? '80px' : '0',
      paddingRight:   isOwn ? '0'    : '80px',
    }}>
      <div style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border-main)',
        borderRadius: '12px',
        padding:      '12px 14px',
        minWidth:     '200px',
        display:      'flex',
        flexDirection:'column',
        gap:          '10px',
      }}>
        <div className="skeleton-box" style={{ height: '22px', width: '60%', borderRadius: '20px' }} />
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', padding: '8px 0' }}>
          {[1, 2].map(i => (
            <div key={i} className="skeleton-box" style={{ width: '48px', height: '56px', borderRadius: '6px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
