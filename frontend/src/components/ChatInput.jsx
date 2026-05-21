import { useRef, useEffect } from 'react';

export default function ChatInput({
  text, setText,
  onSend, onTyping, onStopTyping,
  disabled, skillContext,
}) {
  const typingRef    = useRef(null);
  const isTypingRef  = useRef(false);
  const inputRef     = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (e) => {
    setText(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping?.();
    }
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onStopTyping?.();
    }, 1500);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    clearTimeout(typingRef.current);
    isTypingRef.current = false;
    onStopTyping?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isRoll = text.trim().startsWith('/roll');

  return (
    <div style={{
      padding:    '8px 16px 12px',
      borderTop:  '1px solid var(--border-main)',
      background: 'var(--bg-nav)',
    }}>
      {/* Skill context badge — shows when a skill is selected */}
      {skillContext && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          marginBottom: '6px',
          fontSize:     '12px',
          color:        'var(--accent)',
        }}>
          <span>🎯</span>
          <span>{skillContext.name} ({skillContext.value})</span>
          <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}>
            — success levels will be calculated
          </span>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled
              ? 'Connecting...'
              : 'Message or /roll 1d100adv...'}
            style={{
              width:        '100%',
              padding:      '10px 14px',
              paddingLeft:  isRoll ? '36px' : '14px',
              borderRadius: '10px',
              border:       '1px solid ' + (isRoll
                ? 'var(--accent)'
                : 'var(--border-input)'),
              background:   'var(--bg-input)',
              color:        'var(--text-primary)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '14px',
              outline:      'none',
              boxSizing:    'border-box',
              transition:   'border-color 0.15s ease',
            }}
            onFocus={e => {
              if (!isRoll) e.target.style.borderColor = 'var(--border-focus)';
            }}
            onBlur={e => {
              if (!isRoll) e.target.style.borderColor = 'var(--border-input)';
            }}
          />
          {isRoll && (
            <span style={{
              position:  'absolute',
              left:      '12px',
              top:       '50%',
              transform: 'translateY(-50%)',
              fontSize:  '16px',
              pointerEvents: 'none',
            }}>
              🎲
            </span>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          style={{
            padding:      '10px 20px',
            borderRadius: '10px',
            border:       'none',
            background:   disabled || !text.trim()
              ? 'var(--text-faint)'
              : 'var(--color-primary)',
            color:        '#ffffff',
            fontFamily:   'var(--font-sans)',
            fontSize:     '14px',
            fontWeight:   '500',
            cursor:       disabled || !text.trim() ? 'not-allowed' : 'pointer',
            transition:   'background 0.15s ease',
            flexShrink:   0,
          }}
          onMouseEnter={e => {
            if (!disabled && text.trim())
              e.currentTarget.style.background = 'var(--color-primary-dark)';
          }}
          onMouseLeave={e => {
            if (!disabled && text.trim())
              e.currentTarget.style.background = 'var(--color-primary)';
          }}
        >
          {isRoll ? '🎲 Roll' : 'Send'}
        </button>
      </div>
    </div>
  );
}