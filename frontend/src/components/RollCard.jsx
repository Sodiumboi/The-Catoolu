// ── Digit Box ─────────────────────────────────────────────────
function DigitBox({ digit, highlighted }) {
  return (
    <div style={{
      width:        '36px',
      height:       '44px',
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
      fontSize:     '22px',
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
// value: number, sides: number (for padding d100 to 2 digits)
function RollDigits({ value, sides, highlighted = true }) {
  let digits;

  if (sides === 100) {
    // Always 2 digits, 100 → '00'
    const str = value === 100 ? '00' : String(value).padStart(2, '0');
    digits = str.split('');
  } else {
    digits = String(value).split('');
  }

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {digits.map((d, i) => (
        <DigitBox key={i} digit={d} highlighted={highlighted} />
      ))}
    </div>
  );
}

// ── Main RollCard component ────────────────────────────────────
export default function RollCard({ msg }) {
  const raw = typeof msg.content === 'string'
    ? (() => { try { return JSON.parse(msg.content); } catch { return null; } })()
    : msg.content;

  if (!raw) return null;

  const sl       = raw.successLevel;
  const severity = sl?.severity || 'none';
  const sides    = raw.notation?.includes('d100') ? 100 : null;

  // Build the header phrase based on context
  let header;
  if (raw.skillName) {
    const weaponSkills = ['brawl', 'handgun', 'rifle', 'shotgun', 'fighting'];
    const isAttack = weaponSkills.some(w => raw.skillName.toLowerCase().includes(w));
    if (isAttack) {
      header = (msg.username || 'Someone') + ' makes an Attack!';
    } else if (raw.skillName.toLowerCase() === 'sanity') {
      header = (msg.username || 'Someone') + ' makes a Sanity Roll!';
    } else {
      header = (msg.username || 'Someone') + ' makes a ' + raw.skillName + ' Check!';
    }
  } else {
    header = (msg.username || 'Someone') + ' rolls ' + (raw.notation || '').toUpperCase();
  }

  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  // Determine if adv/dis — which set was chosen
  const isAdv = raw.advantage;
  const isDis = raw.disadvantage;
  const hasAdvDis = isAdv || isDis;

  // chosen = the actual result (total before modifier)
  const chosenRaw = raw.total - (raw.modifier || 0);

  return (
    <div style={{
      background:   'var(--roll-' + severity + '-bg)',
      border:       '1px solid var(--roll-' + severity + '-border)',
      borderRadius: '12px',
      padding:      '12px 14px',
      marginBottom: '10px',
      position:     'relative',
    }}>
      {/* Portrait top-right */}
      {msg.portrait && (
        <img
          src={'data:image/jpeg;base64,' + msg.portrait}
          alt={msg.username}
          style={{
            position:     'absolute',
            top:          '12px',
            right:        '12px',
            width:        '48px',
            height:       '48px',
            borderRadius: '8px',
            objectFit:    'cover',
            border:       '1px solid var(--border-main)',
          }}
        />
      )}

      {/* Header */}
      <div style={{
        fontFamily:   'var(--font-sans)',
        fontSize:     '12px',
        color:        'var(--roll-' + severity + '-text)',
        marginBottom: '6px',
        paddingRight: msg.portrait ? '64px' : '0',
        opacity:      0.8,
      }}>
        {header}
      </div>

      {/* Skill/notation label */}
      {raw.skillName && (
        <div style={{
          fontFamily:   'var(--font-serif)',
          fontSize:     '14px',
          color:        'var(--roll-' + severity + '-text)',
          fontWeight:   '600',
          marginBottom: '8px',
        }}>
          {raw.skillName}
          {raw.advantage    && ' (Advantage)'}
          {raw.disadvantage && ' (Disadvantage)'}
        </div>
      )}

      {/* Dice display */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        flexWrap:   'wrap',
        marginBottom:'8px',
      }}>
        {hasAdvDis && raw.advDisRolls ? (
          <>
            {/* First attempt */}
            <RollDigits
              value={raw.advDisRolls[0].reduce((a, b) => a + b, 0)}
              sides={sides}
              highlighted={isAdv
                ? raw.advDisRolls[0][0] <= raw.advDisRolls[1][0]
                : raw.advDisRolls[0][0] >= raw.advDisRolls[1][0]}
            />

            {/* Separator bar */}
            <div style={{
              width:      '2px',
              height:     '44px',
              background: 'var(--border-main)',
              borderRadius:'2px',
            }} />

            {/* Second attempt */}
            <RollDigits
              value={raw.advDisRolls[1].reduce((a, b) => a + b, 0)}
              sides={sides}
              highlighted={isDis
                ? raw.advDisRolls[1][0] >= raw.advDisRolls[0][0]
                : raw.advDisRolls[1][0] <= raw.advDisRolls[0][0]}
            />
          </>
        ) : (
          /* Normal roll — all dice shown */
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {(raw.rolls || [raw.total]).map((die, i) => (
              <RollDigits key={i} value={die} sides={sides} highlighted />
            ))}
          </div>
        )}
      </div>

      {/* Result label */}
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize:   '12px',
        color:      'var(--roll-' + severity + '-text)',
        fontWeight: '600',
      }}>
        {sl ? sl.emoji + ' ' + sl.label : ''}
        {raw.skillValue && (
          <span style={{ fontWeight: '400', opacity: 0.7, marginLeft: '4px' }}>
            ({raw.total})
          </span>
        )}
      </div>

      <div style={{
        fontSize:  '10px',
        color:     'var(--text-faint)',
        marginTop: '4px',
      }}>
        {time}
      </div>
    </div>
  );
}