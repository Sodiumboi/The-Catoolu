import wojak from '../assets/wojak-pointing.png';

// ── Digit Box ─────────────────────────────────────────────────
function DigitBox({ digit, highlighted }) {
  return (
    <div style={{
      width:        '48px',
      minWidth:     '48px',
      height:       '56px',
      borderRadius: '6px',
      border:       highlighted
        ? '2px solid var(--color-primary)'
        : '1.5px solid var(--border-main)',
      background:   highlighted
        ? 'var(--accent-bg)'
        : 'var(--bg-input)',
      display:      'flex',
      alignItems:   'center',
      justifyContent:'center',
      fontFamily:   'var(--font-serif)',
      fontSize:     '28px',
      fontWeight:   '700',
      color:        highlighted
        ? 'var(--color-primary)'
        : 'var(--text-primary)',
      boxShadow:    highlighted
        ? '0 0 0 2px var(--color-primary-light)'
        : 'none',
    }}>
      {digit}
    </div>
  );
}

// ── Render a roll value as digit boxes ────────────────────────
function RollDigits({ value, sides, highlighted = true }) {
  let digits;

  if (sides === 100) {
    const str = value === 100 ? '00' : String(value).padStart(2, '0');
    digits = str.split('');
  } else {
    digits = String(value).split('');
  }

  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <DigitBox key={i} digit={d} highlighted={highlighted} />
      ))}
    </div>
  );
}

// ── Main RollCard component ────────────────────────────────────
export default function RollCard({ msg, isOwn }) {
  const raw = typeof msg.content === 'string'
    ? (() => { try { return JSON.parse(msg.content); } catch { return null; } })()
    : msg.content;

  if (!raw) return null;

  const sl          = raw.successLevel;
  const severity    = sl?.severity || 'none';
  const sides       = raw.notation?.includes('d100') ? 100 : null;
  const showPortrait = msg.portrait || msg.avatar_url;

  // Full name (up to two words) for the header; first name elsewhere
  const displayName = msg.character_name
    ? msg.character_name.split(' ')[0] + ' ' + (msg.character_name.split(' ')[1] || '')
    : (msg.username || 'Someone');

  // Build the header phrase based on context
  let header;
  if (raw.skillName) {
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

  const isAdv     = raw.advantage;
  const isDis     = raw.disadvantage;
  const hasAdvDis = isAdv || isDis;

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
        minWidth:     '200px',
      }}>

        {/* Left colour bar */}
        <div style={{
          width:      '5px',
          flexShrink: 0,
          background: 'var(--roll-' + severity + '-border)',
        }} />

        {/* Main content */}
        <div style={{ flex: 1, padding: '12px 14px' }}>

          {/* Header */}
          <div style={{
            fontFamily:    'var(--font-sans)',
            fontSize:      '13px',
            fontWeight:    '700',
            color:         'var(--roll-' + severity + '-text)',
            marginBottom:  '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}>
            {header}
          </div>

          {/* Skill/notation label */}
          {raw.skillName && (
            <div style={{
              fontFamily:   'var(--font-serif)',
              fontSize:     '16px',
              color:        'var(--roll-' + severity + '-text)',
              fontWeight:   '700',
              marginBottom: '8px',
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
            gap:            '8px',
            flexWrap:       'wrap',
            padding:        '12px 0',
          }}>
            {hasAdvDis && raw.advDisRolls ? (
              <>
                <RollDigits
                  value={raw.advDisRolls[0].reduce((a, b) => a + b, 0)}
                  sides={sides}
                  highlighted={isAdv
                    ? raw.advDisRolls[0][0] <= raw.advDisRolls[1][0]
                    : raw.advDisRolls[0][0] >= raw.advDisRolls[1][0]}
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
                  highlighted={isDis
                    ? raw.advDisRolls[1][0] >= raw.advDisRolls[0][0]
                    : raw.advDisRolls[1][0] <= raw.advDisRolls[0][0]}
                />
              </>
            ) : (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(raw.rolls || [raw.total]).map((die, i) => (
                  <RollDigits key={i} value={die} sides={sides} highlighted />
                ))}
              </div>
            )}
          </div>

          {/* Wojak — only for Nat 1 (Critical) or 100 (Fumble) */}
          {(raw.total === 1 || raw.total === 100) && (
            <div style={{
              display:        'flex',
              justifyContent: 'center',
              margin:         '8px 0',
            }}>
              <img
                src={wojak}
                alt={raw.total === 1 ? 'Nat One!' : 'Fumble!'}
                style={{ width: '120px', height: 'auto', objectFit: 'contain', opacity: 0.9 }}
              />
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

          <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px' }}>
            {time}
          </div>

          {/* Hidden roll indicator */}
          {msg._hidden && (
            <div style={{
              fontSize:  '10px',
              color:     'var(--text-faint)',
              fontStyle: 'italic',
              marginTop: '4px',
            }}>
              🔒 Only visible to you
            </div>
          )}
        </div>

        {/* Portrait — right column, never overlaps content */}
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
