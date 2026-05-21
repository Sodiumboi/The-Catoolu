import { useEffect, useRef } from 'react';

export default function MessageList({ messages, currentUserId }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      flex:      1,
      overflowY: 'auto',
      padding:   '16px 20px',
      display:   'flex',
      flexDirection: 'column',
      gap:       '4px',
    }}>
      {messages.map((msg, i) => (
        <MessageItem
          key={msg.id || i}
          msg={msg}
          isOwn={msg.user_id === currentUserId}
        />
      ))}
      {/* Invisible div at the bottom for auto-scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageItem({ msg, isOwn }) {
  if (msg.type === 'system') return <SystemMessage msg={msg} />;
  if (msg.type === 'roll')   return <RollMessage   msg={msg} isOwn={isOwn} />;
  return                            <ChatMessage   msg={msg} isOwn={isOwn} />;
}

// ── System message ─────────────────────────────────────────────
function SystemMessage({ msg }) {
  return (
    <div style={{
      textAlign:  'center',
      padding:    '6px 0',
      fontSize:   '12px',
      color:      'var(--text-faint)',
      fontStyle:  'italic',
    }}>
      — {msg.content} —
    </div>
  );
}

// ── Chat message ───────────────────────────────────────────────
function ChatMessage({ msg, isOwn }) {
  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div style={{
      display:       'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems:    'flex-end',
      gap:           '8px',
      marginBottom:  '4px',
    }}>
      {/* Avatar */}
      {!isOwn && (
        <div style={{
          width:         '28px',
          height:        '28px',
          borderRadius:  '50%',
          background:    'var(--color-primary-light)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          fontSize:      '11px',
          fontWeight:    '600',
          color:         'var(--color-primary-dark)',
          flexShrink:    0,
        }}>
          {(msg.username || '?').slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: '70%' }}>
        {!isOwn && (
          <div style={{
            fontSize:    '11px',
            color:       'var(--accent)',
            marginBottom:'2px',
            fontWeight:  '500',
          }}>
            {msg.username}
          </div>
        )}
        <div style={{
          background:   isOwn ? 'var(--color-primary)' : 'var(--bg-card)',
          color:        isOwn ? '#ffffff'               : 'var(--text-primary)',
          border:       isOwn ? 'none' : '1px solid var(--border-main)',
          borderRadius: isOwn
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px',
          padding:      '8px 12px',
          fontSize:     '14px',
          lineHeight:   '1.5',
          wordBreak:    'break-word',
        }}>
          {msg.content}
        </div>
        <div style={{
          fontSize:  '10px',
          color:     'var(--text-faint)',
          marginTop: '3px',
          textAlign: isOwn ? 'right' : 'left',
        }}>
          {time}
        </div>
      </div>
    </div>
  );
}

// ── Roll message ───────────────────────────────────────────────
function RollMessage({ msg, isOwn }) {
  const raw = typeof msg.content === 'string'
    ? (() => { try { return JSON.parse(msg.content); } catch { return null; } })()
    : msg.content;

  if (!raw) return null;

  const time     = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  });

  // Recompute summary from raw fields — never trust the stored string
  const total    = raw.total;
  const sl       = raw.successLevel;
  const modStr   = raw.modifier > 0 ? '+' + raw.modifier
                 : raw.modifier < 0 ? '' + raw.modifier : '';
  const advLabel = raw.advantage    ? ' (Advantage)'
                 : raw.disadvantage ? ' (Disadvantage)' : '';

  let summary;
  if (sl) {
    summary = sl.emoji + ' ' + total + advLabel + ' — ' + sl.label;
  } else if (raw.rolls && raw.rolls.length > 1) {
    summary = raw.rolls.join(' + ') + modStr + advLabel + ' = ' + total;
  } else {
    summary = '' + total + modStr + advLabel;
  }

  const severity = sl?.severity || 'none';

  const palette = {
    critical: { bg: '#FFF9E6', border: '#F59E0B', text: '#92400E', dark: false },
    extreme:  { bg: '#F3E8FF', border: '#9333EA', text: '#6B21A8', dark: false },
    hard:     { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', dark: false },
    regular:  { bg: 'var(--accent-bg)', border: 'var(--accent)', text: 'var(--color-primary-dark)', dark: false },
    failure:  { bg: 'var(--danger-bg)', border: 'var(--danger)', text: 'var(--danger)', dark: false },
    fumble:   { bg: '#1a0000', border: '#7f0000', text: '#ff6b6b', dark: true },
    none:     { bg: 'var(--bg-section-hd)', border: 'var(--border-main)', text: 'var(--text-primary)', dark: false },
  };

  const c = palette[severity] || palette.none;

  return (
    <div style={{
      display:        'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom:   '8px',
    }}>
      <div style={{
        background:   c.bg,
        border:       '1px solid ' + c.border,
        borderRadius: '10px',
        padding:      '10px 14px',
        maxWidth:     '340px',
        minWidth:     '180px',
      }}>

        {/* Who rolled what */}
        <div style={{
          fontSize:     '11px',
          color:        'var(--text-muted)',
          marginBottom: '6px',
          lineHeight:   '1.5',
        }}>
          🎲 <strong>{msg.username}</strong> rolled{' '}
          <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            {raw.notation?.toUpperCase()}
          </span>
          {raw.skillName  && ' · ' + raw.skillName}
          {raw.skillValue && ' (' + raw.skillValue + ')'}
        </div>

        {/* Main result — big and bold */}
        <div style={{
          fontSize:     '20px',
          fontWeight:   '700',
          color:        c.text,
          fontFamily:   'var(--font-serif)',
          lineHeight:   '1.2',
          marginBottom: sl ? '4px' : '0',
        }}>
          {summary}
        </div>

        {/* Skill thresholds — only for CoC skill rolls */}
        {sl && raw.skillValue && (
          <div style={{
            fontSize:  '11px',
            color:     'var(--text-muted)',
            marginTop: '4px',
            display:   'flex',
            gap:       '10px',
          }}>
            <span>Ext ≤{Math.floor(parseInt(raw.skillValue) / 5)}</span>
            <span>Hard ≤{Math.floor(parseInt(raw.skillValue) / 2)}</span>
            <span>Reg ≤{raw.skillValue}</span>
          </div>
        )}

        {/* Both roll sets for advantage/disadvantage */}
        {raw.advDisRolls && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Rolls: [{raw.advDisRolls[0].join(', ')}] and [{raw.advDisRolls[1].join(', ')}]
            {' → took ' + total}
          </div>
        )}

        {/* Individual dice for multi-die rolls */}
        {!raw.advDisRolls && raw.rolls && raw.rolls.length > 1 && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Dice: [{raw.rolls.join(', ')}]
            {raw.modifier !== 0 && ' ' + modStr}
          </div>
        )}

        <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '6px' }}>
          {time}
        </div>
      </div>
    </div>
  );
}