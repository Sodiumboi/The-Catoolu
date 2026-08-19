import { useRef, useEffect, useState } from 'react';
import Tooltip from './ui/Tooltip';

export default function ChatInput({
  text, setText,
  onSend, onTyping, onStopTyping, onResize,
  disabled, skillContext,
  // attachment props (optional) — attachedFiles is an array (0-5 files)
  attachedFiles = [], onFileSelect, onClearAttachment,
  // pending / upload feedback props (optional)
  isSending = false, uploadError = null, onClearUploadError,
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
    if (uploadError) onClearUploadError?.();

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
    const hasContent = trimmed || attachedFiles.length > 0;
    if (!hasContent || disabled || isSending) return;
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
    const files = Array.from(e.target.files || []);
    files.forEach(f => onFileSelect?.(f));
    e.target.value = '';
  };

  // Both / and ! prefixes, in long (/roll) and short (/r) form
  const isRoll = /^[/!]roll/i.test(text.trim()) || /^[/!]r(\s|$)/i.test(text.trim());
  const canSend = !disabled && !isSending && (!!text.trim() || attachedFiles.length > 0);

  return (
    <div className="pt-2 px-4 pb-3 border-t border-(--border-main) bg-(--bg-nav)">
      {/* Hidden file input */}
      {onFileSelect && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilePick}
        />
      )}

      {/* Skill context badge */}
      {skillContext && (
        <div className="flex items-center gap-1.5 mb-1.5 text-xs text-(--accent)">
          <span>🎯</span>
          <span>{skillContext.name} ({skillContext.value})</span>
          <span className="text-(--text-faint) text-[11px]">
            — success levels will be calculated
          </span>
        </div>
      )}

      {/* Attachment preview — horizontal row of per-file chips */}
      {attachedFiles.length > 0 && (
        <div className="flex gap-2 items-center mb-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {attachedFiles.map((file, index) => (
            <Tooltip key={index} content={file.name}>
            <div
              className="flex gap-1.5 items-center pt-1 pr-2 pb-1 pl-1 rounded-lg bg-(--accent-bg) border-[0.5px] border-(--color-primary-mid) relative shrink-0 max-w-45"
            >
              <div className="w-7 h-7 rounded-[5px] bg-(--bg-card) flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-(--accent) text-base">
                  image
                </span>
              </div>
              <span className="text-[11px] text-(--text-faint) font-sans truncate">
                {file.name}
              </span>
              <Tooltip content="Remove">
              <button
                onClick={() => onClearAttachment?.(index)}
                aria-label="Remove"
                className="w-4 h-4 bg-(--danger) border-none rounded-full text-white text-[10px] flex items-center justify-center cursor-pointer p-0 shrink-0"
              >
                ×
              </button>
              </Tooltip>
            </div>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Upload error banner */}
      {uploadError && (
        <div className="flex items-center gap-2 mb-1.5 py-1.5 px-2.5 rounded-lg bg-(--danger-bg) border border-(--danger) font-sans text-xs text-(--danger)">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          <span className="flex-1 leading-[1.4]">{uploadError}</span>
          <Tooltip content="Dismiss">
          <button
            onClick={() => onClearUploadError?.()}
            aria-label="Dismiss"
            className="btn-icon-ghost btn-icon-danger btn-icon-xs shrink-0"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
          </Tooltip>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2.5 items-center">
        {/* Attach button */}
        {onFileSelect && (
          <Tooltip content="Attach image">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label="Attach image"
            className="btn-icon shrink-0"
          >
            <span className="material-symbols-outlined text-lg">attach_file</span>
          </button>
          </Tooltip>
        )}

        {/* Border color reflects focus state via React state (not imperative swap) — this wrapper div, not the textarea, owns the visible border */}
        <div className={`flex-1 relative rounded-[10px] bg-(--bg-input) overflow-hidden [transition:border-color_0.15s] border ${isRoll ? 'border-(--accent)' : focused ? 'border-(--border-focus)' : 'border-(--border-input)'}`}>
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled || isSending}
            placeholder={disabled
              ? 'Connecting...'
              : isSending
                ? 'Sending…'
                : attachedFiles.length > 0
                  ? 'Add a caption (optional)…'
                  : 'Message or /roll 2d10 + 5 * 6... (or /r, !r)'}
            className={`w-full py-2.5 pr-3.5 border-none bg-transparent text-(--text-primary) font-sans text-sm leading-[1.57] outline-none! box-border resize-none overflow-auto h-auto block ${isRoll ? 'pl-9' : 'pl-3.5'}`}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {isRoll && (
            <span className="absolute left-3 top-3.5 pointer-events-none">
              <span className="icon text-lg">casino</span>
            </span>
          )}
        </div>

        <button
          onClick={e => handleSend(e.shiftKey)}
          disabled={!canSend}
          className="btn-primary shrink-0"
        >
          {isSending ? 'Sending…' : isRoll ? <><span className="icon icon-sm">casino</span>Roll</> : 'Send'}
        </button>
      </div>
    </div>
  );
}
