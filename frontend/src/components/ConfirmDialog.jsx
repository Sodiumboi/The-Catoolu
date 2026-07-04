import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Shared destructive-action confirmation dialog.
 * Renders into document.body via a portal so it escapes any stacking-context
 * parent. Returns null when `open` is false (no portal overhead when inactive).
 *
 * Props:
 *   open         bool    — whether the dialog is visible
 *   title        string  — heading text (aria-labelledby target)
 *   message      string  — body text (aria-describedby target)
 *   confirmLabel string  — confirm button text (default 'Confirm')
 *   cancelLabel  string  — cancel button text (default 'Cancel')
 *   variant      string  — 'danger' | 'warning' | 'default' (default 'danger')
 *   onConfirm    func     — called when user clicks confirm
 *   onCancel     func     — called on cancel, Escape, or backdrop click
 *   tertiaryLabel    string  — optional third (primary/accent) action button text
 *   onTertiary       func    — called when user clicks the tertiary action
 *   tertiaryDisabled bool    — disables the tertiary button (e.g. while saving)
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  tertiaryLabel,
  onTertiary,
  tertiaryDisabled = false,
}) {
  // Escape key dismisses
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  // Body scroll lock while open (matches LegalModal pattern)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  let confirmBg;
  let confirmColor;
  let confirmBorder = 'none';
  if (variant === 'danger') {
    confirmBg = 'var(--danger)';
    confirmColor = '#fff';
  } else if (variant === 'warning') {
    confirmBg = 'var(--warning)';
    confirmColor = '#fff';
  } else {
    confirmBg = 'var(--bg-card)';
    confirmColor = 'var(--text-primary)';
    confirmBorder = '1px solid var(--border-main)';
  }

  const dialog = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        animation: 'confirm-fade-in 0.15s ease',
      }}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        aria-describedby="cd-message"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 360,
          width: '90%',
          boxShadow: 'var(--shadow-dropdown)',
          zIndex: 1101,
          animation: 'confirm-pop-in 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
      >
        <h2
          id="cd-title"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 16,
            color: 'var(--text-primary)',
            margin: '0 0 8px',
          }}
        >
          {title}
        </h2>
        <p
          id="cd-message"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--text-muted)',
            margin: '0 0 20px',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-main)',
              background: 'var(--bg-input)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: confirmBorder,
              background: confirmBg,
              color: confirmColor,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
          {tertiaryLabel && (
            <button
              type="button"
              onClick={onTertiary}
              disabled={tertiaryDisabled}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: 'none',
                background: tertiaryDisabled ? 'var(--text-muted)' : 'var(--color-primary)',
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 600,
                cursor: tertiaryDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              {tertiaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
