import { useRef, useEffect, useState } from 'react';

export default function ChatInput({
  text, setText,
  onSend, onTyping, onStopTyping, onResize,
  disabled, skillContext,
  // attachment props (optional)
  attachedFile, onFileSelect, onClearAttachment,
}) {
  const typingRef    = useRef(null);
  const isTypingRef  = useRef(false);
  const inputRef     = useRef(null);
  const fileInputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const LINE_HEIGHT = 22;  // px — matches fontSize:14px + lineHeight:1.57 (~22px)
  const MAX_ROWS    = 6;
  const MAX_H       = MAX_ROWS * LINE_HEIGHT;

  const autoGrow = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, MAX_H) + 'px';
    onResize?.();
  };

  useEffect(() => {
    inputRef.current?.focus();
    if (inputRef.current) inputRef.current.style.height = 'auto';
  }, []);

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

    autoGrow();
  };

  const handleSend = (shiftKey = false) => {
    const trimmed    = text.trim();
    const hasContent = trimmed || attachedFile;
    if (!hasContent || disabled) return;
    onSend(trimmed, shiftKey);
    setText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    onResize?.();
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

  // Paste image from clipboard
  const handlePaste = (e) => {
    if (!onFileSelect) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) onFileSelect(file);
        break;
      }
    }
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    onFileSelect?.(file);
  };

  const isRoll = text.trim().startsWith('/roll') || text.trim().startsWith('/r ') || text.trim() === '/r';
  const canSend = !disabled && (!!text.trim() || !!attachedFile);

  return (
    <div style={{
      padding:    '8px 16px 12px',
      borderTop:  '1px solid var(--border-main)',
      background: 'var(--bg-nav)',
    }}>
      {/* Hidden file input */}
      {onFileSelect && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFilePick}
        />
      )}

      {/* Skill context badge */}
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

      {/* Attachment preview */}
      {attachedFile && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          marginBottom: 6,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 6,
            background: 'var(--accent-bg)',
            border: '0.5px solid var(--color-primary-mid)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', position: 'relative', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>
              image
            </span>
            <button
              onClick={onClearAttachment}
              style={{
                position: 'absolute', top: -5, right: -5,
                width: 15, height: 15,
                background: 'var(--danger)', border: 'none', borderRadius: '50%',
                color: '#fff', fontSize: 9, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              ×
            </button>
          </div>
          <span style={{
            fontSize: 11, color: 'var(--text-faint)',
            fontFamily: 'var(--font-sans)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {attachedFile.name} · will send with message
          </span>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Attach button */}
        {onFileSelect && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach image"
            style={{
              width: 36, height: 36, border: '1px solid var(--border-input)',
              borderRadius: 8, background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted)', flexShrink: 0,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              if (!disabled) {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-input)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
          </button>
        )}

        <div style={{
          flex:         1,
          position:     'relative',
          borderRadius: '10px',
          border:       '1px solid ' + (isRoll
            ? 'var(--accent)'
            : focused ? 'var(--border-focus)' : 'var(--border-input)'),
          background:   'var(--bg-input)',
          overflow:     'hidden',
          transition:   'border-color 0.15s ease',
        }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder={disabled
              ? 'Connecting...'
              : attachedFile
                ? 'Add a caption (optional)…'
                : 'Message or /roll 1d100adv... (or /r)'}
            style={{
              width:         '100%',
              padding:       '10px 14px',
              paddingLeft:   isRoll ? '36px' : '14px',
              border:        'none',
              background:    'transparent',
              color:         'var(--text-primary)',
              fontFamily:    'var(--font-sans)',
              fontSize:      '14px',
              lineHeight:    '1.57',
              outline:       'none',
              boxSizing:     'border-box',
              resize:        'none',
              overflow:      'auto',
              height:        'auto',
              display:       'block',
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {isRoll && (
            <span style={{
              position:  'absolute',
              left:      '12px',
              top:       '14px',
              pointerEvents: 'none',
            }}>
              <span className="icon" style={{ fontSize: '18px' }}>casino</span>
            </span>
          )}
        </div>

        <button
          onClick={e => handleSend(e.shiftKey)}
          disabled={!canSend}
          style={{
            padding:      '10px 20px',
            borderRadius: '10px',
            border:       'none',
            background:   !canSend
              ? 'var(--text-faint)'
              : 'var(--color-primary)',
            color:        '#ffffff',
            fontFamily:   'var(--font-sans)',
            fontSize:     '14px',
            fontWeight:   '500',
            cursor:       !canSend ? 'not-allowed' : 'pointer',
            transition:   'background 0.15s ease',
            flexShrink:   0,
          }}
          onMouseEnter={e => {
            if (canSend) e.currentTarget.style.background = 'var(--color-primary-dark)';
          }}
          onMouseLeave={e => {
            if (canSend) e.currentTarget.style.background = 'var(--color-primary)';
          }}
        >
          {isRoll ? <><span className="icon icon-sm">casino</span>{' '}Roll</> : 'Send'}
        </button>
      </div>
    </div>
  );
}
