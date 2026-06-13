// ── Shared visual language for the sheet module library ──────────────
// Plain style objects + event helpers reused by every sheet/ module, and
// (where the output is pixel-identical) by the in-room SessionSheet.
// No React, no state — pure presentation tokens.

// Small uppercase accent label (stat keys, money labels, field captions)
export const accentLabel = {
  fontSize:      'calc(9px * var(--sheet-font-scale))',
  fontWeight:    '600',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color:         'var(--accent)',
  fontFamily:    'var(--font-sans)',
};

// ── Text-input border interactions ───────────────────────────────────
// Hover lifts the border to the focus colour unless the field is focused;
// focus paints it accent; blur returns it to the resting colour.
// (Matches the handlers used across the OG editor's text inputs.)
export const inputHoverEnter = (e) => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-focus)'; };
export const inputHoverLeave = (e) => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-input)'; };
export const inputFocus      = (e) => { e.target.style.borderColor = 'var(--accent)'; };
export const inputBlur       = (e) => { e.target.style.borderColor = 'var(--border-input)'; };
