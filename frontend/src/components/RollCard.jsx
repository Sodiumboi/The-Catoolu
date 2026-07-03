import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import wojakRight from '../assets/wojak-point_andy_right.png';
import wojakLeft  from '../assets/wojak-point_andy_left.png';
import Tooltip from './ui/Tooltip';

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
    // border/color/boxShadow stay inline — severity drives a dynamically-named CSS custom property (roll outcome data), not a fixed token
    <div
      className="w-10.5 min-w-10.5 h-12.5 rounded-md bg-(--bg-input) flex items-center justify-center font-serif text-2xl font-bold"
      style={{
        border:    isNone ? '2px solid var(--text-muted)' : `2px solid var(--roll-${severity}-border)`,
        color:     isNone ? 'var(--text-primary)' : `var(--roll-${severity}-text)`,
        boxShadow: !isNone ? `0 0 2px var(--roll-${severity}-border)` : 'none',
      }}
    >
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
    // border/background stay inline — severity-derived color name computed at runtime (roll outcome data)
    <div
      className={`flex gap-0.5 justify-center py-1 px-1.25 rounded-[10px] ${isLoser ? 'opacity-[0.38]' : 'opacity-100'}`}
      style={{
        border:     isWinner ? `2px solid ${borderColor}` : '2px solid transparent',
        background: isWinner ? bgColor : 'transparent',
      }}
    >
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
        <div key={'sep-' + dieIndex} className="w-0.5 h-14 bg-(--border-main) rounded-xs shrink-0" />
      );
    }
    items.push(
      <div key={'die-' + dieIndex} className="flex gap-0.5">
        {formatDie(dieValue, sides).map((digit, digitIndex) => (
          <DigitBox key={digitIndex} digit={digit} severity={severity} />
        ))}
      </div>
    );
  });

  return (
    <div className="flex items-center gap-1.5 justify-center flex-wrap">
      {items}
    </div>
  );
}

// ── Main RollCard component ────────────────────────────────────
export default function RollCard({ msg, isOwn, canDelete, onDelete }) {
  const { memeEnabled } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const delay = useRef(Math.floor(Math.random() * 400) + 300);

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(msg);
  };

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

  return (
    <div
      className={`flex mb-2.5 min-w-0 relative ${isOwn ? 'flex-row-reverse pl-20 pr-0' : 'flex-row pl-0 pr-20'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
    >
      {/* Card + hover-actions wrapper (relative anchor; keeps the card width stable) */}
      <div className="relative min-w-0 max-w-[min(440px,100%)]">
      {/* Card */}
      {/* border/backgroundImage stay inline — severity drives a dynamically-named CSS custom property (roll outcome data), not a fixed token */}
      <div
        className={`flex min-w-0 max-w-full overflow-hidden bg-(--bg-page) ${isOwn ? 'rounded-[16px_16px_4px_16px]' : 'rounded-[16px_16px_16px_4px]'}`}
        style={{
          border: msg._hidden
            ? `2px dashed var(--roll-${severity}-border)`
            : `1px solid var(--roll-${severity}-border)`,
          backgroundImage: `linear-gradient(var(--roll-${severity}-bg), var(--roll-${severity}-bg))`,
        }}
      >

        {/* Left colour bar — background stays inline, severity-derived */}
        <div style={{ background: `var(--roll-${severity}-border)` }} className="w-1.25 shrink-0" />

        {/* Main content */}
        <div className="flex-1 py-3 px-3.5 min-w-0">

          {/* Top section: [action pill + skill name] alongside [portrait] */}
          <div className="flex items-start gap-2.5 mb-3">
            {/* Left: action pill stacked above skill name */}
            <div className="flex-1 min-w-0">
              {/* background/color/border stay inline — severity drives a dynamically-named CSS custom property (roll outcome data) */}
              <div
                className="inline-flex items-center rounded-[20px] py-0.75 px-2.5 text-[11px] font-bold tracking-wider w-full overflow-hidden mb-2.5"
                style={{
                  background: severity === 'none' ? 'var(--bg-section-hd)' : `var(--roll-${severity}-border)`,
                  color:      severity === 'none' ? 'var(--text-secondary)' : '#ffffff',
                  border:     severity === 'none' ? '1px solid var(--border-main)' : 'none',
                }}
              >
                <span className="block truncate">
                  <span className="font-extrabold underline">
                    {displayName.trim()}
                  </span>
                  {header.slice(displayName.trim().length)}
                </span>
              </div>

              {raw.skillName && (
                // color stays inline — severity-derived, roll outcome data
                <div
                  className="font-serif text-[15px] font-bold text-center mb-2.5"
                  style={{ color: `var(--roll-${severity}-text)` }}
                >
                  {raw.skillName}
                  {raw.advantage    && ' (Advantage)'}
                  {raw.disadvantage && ' (Disadvantage)'}
                </div>
              )}

              {/* Dice */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
            {showMeme && (
              <img src={wojakLeft} alt="" className="h-15 w-auto opacity-85 pointer-events-none shrink-0" />
            )}
            <div className="flex items-center justify-center gap-2 flex-wrap">
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
                    <div className="w-0.5 h-14 bg-(--border-main) rounded-xs" />
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
              <img src={wojakRight} alt="" className="h-15 w-auto opacity-85 pointer-events-none shrink-0" />
            )}
          </div>

            </div>

            {/* Portrait — right, spans the content block height */}
            {showPortrait && (
              <div className="shrink-0 w-14 h-16">
                <img
                  src={msg.portrait
                    ? 'data:image/jpeg;base64,' + msg.portrait
                    : (import.meta.env.VITE_API_URL || '') + msg.avatar_url}
                  alt={msg.username}
                  className="w-full h-full rounded-sm object-cover border border-(--border-main) block"
                />
              </div>
            )}
          </div>

          {/* Bottom row: result (left) + time pill (right) */}
          <div className={`flex items-center gap-2 mt-2.5 font-sans ${hasResultLine ? 'justify-between' : 'justify-end'}`}>
            {/* Result */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs min-w-0">
              {sl && (
                <>
                  {/* color stays inline — severity-derived, roll outcome data */}
                  <span className="font-semibold" style={{ color: `var(--roll-${severity}-text)` }}>
                    {sl.emoji} {sl.label}
                    {raw.skillValue && (
                      <span className="font-normal opacity-70 ml-1">
                        ({raw.total})
                      </span>
                    )}
                  </span>
                  {raw.skillValue && (
                    <>
                      <span className="text-(--text-faint)">||</span>
                      <span className="text-(--text-faint)">Reg ({raw.skillValue})</span>
                    </>
                  )}
                </>
              )}
              {/* Sum line for multi-die rolls */}
              {showSum && (
                <span className="text-(--text-muted)">
                  {raw.rolls.join(' + ')}
                  {raw.modifier !== 0 ? (raw.modifier > 0 ? ' + ' : ' − ') + Math.abs(raw.modifier) : ''}
                  {' = '}
                  {/* color stays inline — severity-derived, roll outcome data */}
                  <strong style={{ color: `var(--roll-${severity}-text)` }}>{raw.total}</strong>
                </span>
              )}
              {/* Damage total */}
              {raw.isDamage && (
                <span className="text-(--roll-none-text)">
                  {raw.weaponName} · {raw.rolls.join(' + ')}
                  {raw.modifier !== 0 ? (raw.modifier > 0 ? ' + ' : ' − ') + Math.abs(raw.modifier) : ''}
                  {' = '}
                  <strong>{raw.total}</strong>
                </span>
              )}
              {!raw.isDamage && raw.skillName?.startsWith('Attack') && sl && (
                <span className={`font-bold ml-1 ${isHit ? 'text-(--roll-regular-text)' : 'text-(--roll-failure-text)'}`}>
                  {isHit ? '· Hit! (' + raw.skillValue + ')' : '· Miss! (' + raw.skillValue + ')'}
                </span>
              )}
            </div>

            {/* Time pill — background/border/color stay inline, severity-derived */}
            <div
              className="rounded-[20px] py-0.75 px-2.5 text-[11px] font-bold tracking-wider shrink-0 whitespace-nowrap"
              style={{
                background: severity === 'none' ? 'var(--bg-section-hd)' : `var(--roll-${severity}-border)`,
                border:     severity === 'none' ? '1px solid var(--border-main)' : 'none',
                color:      severity === 'none' ? 'var(--text-muted)' : 'rgba(255,255,255,0.85)',
              }}
            >
              {time}
            </div>
          </div>

          {/* Hidden roll indicator */}
          {msg._hidden && (
            <div className="text-[10px] text-(--text-faint) italic mt-2 text-center">
              <span className="icon icon-sm">lock</span>{' '}Only visible to you
            </div>
          )}
        </div>
      </div>

      {/* Three-dot action button — absolutely placed so it never changes the card width */}
      {canDelete && (hovered || menuOpen) && (
        <div className={`absolute bottom-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'}`}>
          <Tooltip content="Message actions">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(m => !m); }}
            className="bg-(--bg-card) border border-(--border-subtle) rounded-md cursor-pointer text-(--text-muted) py-0.5 px-1 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-base">more_vert</span>
          </button>
          </Tooltip>

          {menuOpen && (
            <div className={`absolute bottom-full mb-1 bg-(--bg-card) border border-(--border-subtle) rounded-lg shadow-(--shadow-dropdown) z-200 min-w-30 overflow-hidden ${isOwn ? 'left-0 right-auto' : 'right-0 left-auto'}`}>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 w-full py-2 px-3 bg-none border-none cursor-pointer text-[#dc2626] text-[13px] font-sans text-left"
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                Delete
              </button>
            </div>
          )}
        </div>
      )}
      </div>{/* /card + hover-actions wrapper */}
    </div>
  );
}

// ── Roll Card Skeleton ─────────────────────────────────────────
function RollCardSkeleton({ isOwn }) {
  return (
    <div className={`flex mb-2.5 ${isOwn ? 'justify-end pl-20 pr-0' : 'justify-start pl-0 pr-20'}`}>
      <div className={`flex bg-(--bg-card) border border-(--border-main) overflow-hidden min-w-50 ${isOwn ? 'rounded-[16px_16px_4px_16px]' : 'rounded-[16px_16px_16px_4px]'}`}>
        <div className="w-1.25 shrink-0 bg-(--border-main)" />
        <div className="flex-1 py-3 px-3.5 flex flex-col gap-3">
          <div className="flex justify-between gap-2.5">
            <div className="skeleton-box h-5.5 flex-1 rounded-[20px]" />
            <div className="skeleton-box h-5.5 w-12 rounded-[20px]" />
          </div>
          <div className="flex gap-1.5 justify-center py-1 px-0">
            {[1, 2].map(i => (
              <div key={i} className="skeleton-box w-10.5 h-12.5 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
