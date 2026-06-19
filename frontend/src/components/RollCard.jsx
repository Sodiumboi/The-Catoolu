import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
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
function RollDigits({ value, sides, severity = 'none', groupHighlight }) {
  const isWinner = groupHighlight === 'winner';
  const isLoser  = groupHighlight === 'loser';
  const borderColor = severity !== 'none'
    ? `var(--roll-${severity}-border)`
    : 'var(--accent)';
  const bgColor = severity !== 'none'
    ? `var(--roll-${severity}-bg)`
    : 'var(--accent-bg)';

  return (
    <div style={{
      display:        'flex',
      gap:            '2px',
      justifyContent: 'center',
      padding:        '4px 5px',
      borderRadius:   '10px',
      border:         isWinner ? `2px solid ${borderColor}` : '2px solid transparent',
      background:     isWinner ? bgColor : 'transparent',
      opacity:        isLoser ? 0.38 : 1,
    }}>
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
  const { memeEnabled } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const delay = useRef(Math.floor(Math.random() * 400) + 300);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), delay.current);
    return () => clearTimeout(timer);
  }, []);

  const raw = typeof msg.content === 'string'
    ? (() => { try { return JSON.parse(msg.content); } catch { return null; } })()
    : msg.content;

  const showMeme = memeEnabled && (
    (raw?.notation?.toLowerCase().includes('d100') &&
      (raw?.total === 1 || raw?.total === 100)) || !!msg._forceMeme
  );

  if (!raw) return null;
  if (!revealed) return <RollCardSkeleton isOwn={isOwn} />;

  const sl        = raw.successLevel;
  const severity  = sl?.severity || 'none';
  const isHit     = ['critical', 'extreme', 'hard', 'regular'].includes(severity);
  const sides     = getSides(raw.notation);

  const showPortrait = msg.portrait || msg.avatar_url;
  const isAdv        = raw.advantage;
  const isDis        = raw.disadvantage;
  const hasAdvDis    = isAdv || isDis;
  const showSum      = raw.rolls && raw.rolls.length > 1 && !hasAdvDis;
  const hasResultLine = sl || raw.isDamage || showSum;

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

  const borderRadius = isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px';

  return (
    <div style={{
      display:        'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom:   '10px',
      paddingLeft:    isOwn ? '80px' : '0',
      paddingRight:   isOwn ? '0' : '80px',
      minWidth:       0,
    }}>
      {/* Card */}
      <div style={{
        display:      'flex',
        borderRadius,
        minWidth:     0,
        maxWidth:     'min(440px, 100%)',
        overflow:     'hidden',
        border:       msg._hidden
          ? `2px dashed var(--roll-${severity}-border)`
          : `1px solid var(--roll-${severity}-border)`,
        // Opaque parchment base under the (sometimes translucent) severity tint
        // so the feed background can't bleed through the card.
        backgroundColor: 'var(--bg-page)',
        backgroundImage: `linear-gradient(var(--roll-${severity}-bg), var(--roll-${severity}-bg))`,
      }}>

        {/* Left colour bar */}
        <div style={{
          width:      '5px',
          flexShrink: 0,
          background: `var(--roll-${severity}-border)`,
        }} />

        {/* Main content */}
        <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>

          {/* Top section: [action pill + skill name] alongside [portrait] */}
          <div style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          10,
            marginBottom: 12,
          }}>
            {/* Left: action pill stacked above skill name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display:      'inline-flex',
                alignItems:   'center',
                background:   severity === 'none'
                  ? 'var(--bg-section-hd)'
                  : `var(--roll-${severity}-border)`,
                color:        severity === 'none' ? 'var(--text-secondary)' : '#ffffff',
                border:       severity === 'none' ? '1px solid var(--border-main)' : 'none',
                borderRadius: '20px',
                padding:      '3px 10px',
                fontSize:     '11px',
                fontWeight:   '700',
                letterSpacing:'0.05em',
                width:        '100%',
                overflow:     'hidden',
                marginBottom: '10px',
              }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: '800', textDecoration: 'underline' }}>
                    {displayName.trim()}
                  </span>
                  {header.slice(displayName.trim().length)}
                </span>
              </div>

              {raw.skillName && (
                <div style={{
                  fontFamily:   'var(--font-serif)',
                  fontSize:     '15px',
                  color:        `var(--roll-${severity}-text)`,
                  fontWeight:   '700',
                  textAlign:    'center',
                  marginBottom: '10px',
                }}>
                  {raw.skillName}
                  {raw.advantage    && ' (Advantage)'}
                  {raw.disadvantage && ' (Disadvantage)'}
                </div>
              )}

              {/* Dice */}
              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '8px',
                flexWrap:       'wrap',
              }}>
            {showMeme && (
              <img src={wojakLeft} alt="" style={{
                height: '60px', width: 'auto',
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
              {hasAdvDis && raw.advDisRolls ? (() => {
                const v0 = raw.advDisRolls[0].reduce((a, b) => a + b, 0) || 100;
                const v1 = raw.advDisRolls[1].reduce((a, b) => a + b, 0) || 100;
                const g0w = isAdv ? v0 <= v1 : v0 >= v1;
                const g1w = isAdv ? v1 <= v0 : v1 >= v0;
                return (
                  <>
                    <RollDigits
                      value={v0 === 100 ? 0 : v0}
                      sides={sides}
                      severity={g0w ? severity : 'none'}
                      groupHighlight={g0w ? 'winner' : 'loser'}
                    />
                    <div style={{
                      width:        '2px',
                      height:       '56px',
                      background:   'var(--border-main)',
                      borderRadius: '2px',
                    }} />
                    <RollDigits
                      value={v1 === 100 ? 0 : v1}
                      sides={sides}
                      severity={g1w ? severity : 'none'}
                      groupHighlight={g1w ? 'winner' : 'loser'}
                    />
                  </>
                );
              })() : (
                <MultiDieDisplay
                  rolls={raw.rolls || [raw.total]}
                  sides={sides}
                  severity={severity}
                />
              )}
            </div>
            {showMeme && (
              <img src={wojakRight} alt="" style={{
                height: '60px', width: 'auto',
                opacity: 0.85, pointerEvents: 'none', flexShrink: 0,
              }} />
            )}
          </div>

            </div>

            {/* Portrait — right, spans the content block height */}
            {showPortrait && (
              <div style={{ flexShrink: 0, width: '56px', height: '64px' }}>
                <img
                  src={msg.portrait
                    ? 'data:image/jpeg;base64,' + msg.portrait
                    : (import.meta.env.VITE_API_URL || '') + msg.avatar_url}
                  alt={msg.username}
                  style={{
                    width:        '100%',
                    height:       '100%',
                    borderRadius: '4px',
                    objectFit:    'cover',
                    border:       '1px solid var(--border-main)',
                    display:      'block',
                  }}
                />
              </div>
            )}
          </div>

          {/* Bottom row: result (left) + time pill (right) */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: hasResultLine ? 'space-between' : 'flex-end',
            gap:            8,
            marginTop:      10,
            fontFamily:     'var(--font-sans)',
          }}>
            {/* Result */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: '12px', minWidth: 0 }}>
              {sl && (
                <>
                  <span style={{ color: `var(--roll-${severity}-text)`, fontWeight: 600 }}>
                    {sl.emoji} {sl.label}
                    {raw.skillValue && (
                      <span style={{ fontWeight: '400', opacity: 0.7, marginLeft: 4 }}>
                        ({raw.total})
                      </span>
                    )}
                  </span>
                  {raw.skillValue && (
                    <>
                      <span style={{ color: 'var(--text-faint)' }}>||</span>
                      <span style={{ color: 'var(--text-faint)' }}>Reg ({raw.skillValue})</span>
                    </>
                  )}
                </>
              )}
              {/* Sum line for multi-die rolls */}
              {showSum && (
                <span style={{ color: 'var(--text-muted)' }}>
                  {raw.rolls.join(' + ')}
                  {raw.modifier !== 0 ? (raw.modifier > 0 ? ' + ' : ' − ') + Math.abs(raw.modifier) : ''}
                  {' = '}
                  <strong style={{ color: `var(--roll-${severity}-text)` }}>{raw.total}</strong>
                </span>
              )}
              {/* Damage total */}
              {raw.isDamage && (
                <span style={{ color: 'var(--roll-none-text)' }}>
                  {raw.weaponName} · {raw.rolls.join(' + ')}
                  {raw.modifier !== 0 ? (raw.modifier > 0 ? ' + ' : ' − ') + Math.abs(raw.modifier) : ''}
                  {' = '}
                  <strong>{raw.total}</strong>
                </span>
              )}
              {!raw.isDamage && raw.skillName?.startsWith('Attack') && sl && (
                <span style={{
                  fontWeight: '700',
                  color:      isHit ? 'var(--roll-regular-text)' : 'var(--roll-failure-text)',
                  marginLeft: 4,
                }}>
                  {isHit ? '· Hit! (' + raw.skillValue + ')' : '· Miss! (' + raw.skillValue + ')'}
                </span>
              )}
            </div>

            {/* Time pill */}
            <div style={{
              background:   severity === 'none'
                ? 'var(--bg-section-hd)'
                : `var(--roll-${severity}-border)`,
              border:       severity === 'none' ? '1px solid var(--border-main)' : 'none',
              borderRadius: '20px',
              padding:      '3px 10px',
              fontSize:     '11px',
              fontWeight:   '700',
              letterSpacing:'0.05em',
              color:        severity === 'none' ? 'var(--text-muted)' : 'rgba(255,255,255,0.85)',
              flexShrink:   0,
              whiteSpace:   'nowrap',
            }}>
              {time}
            </div>
          </div>

          {/* Hidden roll indicator */}
          {msg._hidden && (
            <div style={{
              fontSize:  '10px',
              color:     'var(--text-faint)',
              fontStyle: 'italic',
              marginTop: '8px',
              textAlign: 'center',
            }}>
              <span className="icon icon-sm">lock</span>{' '}Only visible to you
            </div>
          )}
        </div>
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
      paddingRight:   isOwn ? '0' : '80px',
    }}>
      <div style={{
        display:      'flex',
        background:   'var(--bg-card)',
        border:       '1px solid var(--border-main)',
        borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        overflow:     'hidden',
        minWidth:     '200px',
      }}>
        <div style={{ width: '5px', flexShrink: 0, background: 'var(--border-main)' }} />
        <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div className="skeleton-box" style={{ height: '22px', flex: 1, borderRadius: '20px' }} />
            <div className="skeleton-box" style={{ height: '22px', width: '48px', borderRadius: '20px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', padding: '4px 0' }}>
            {[1, 2].map(i => (
              <div key={i} className="skeleton-box" style={{ width: '42px', height: '50px', borderRadius: '6px' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
