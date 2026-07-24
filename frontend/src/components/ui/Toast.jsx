import { useState, useRef } from 'react';

// Per-type visual config. `tintPct` = how much of the accent colour bleeds into
// the frosted surface base (0 = neutral glass, for `info`). `role` drives the
// ARIA live-region urgency: errors/critical announce assertively (`alert`), the
// rest politely (`status`). All accents are theme tokens, so every type recolours
// automatically across the 6 themes.
const TYPE_CONFIG = {
  success:  { accent: 'var(--success)',     tintPct: 8,  role: 'status' },
  info:     { accent: 'var(--border-main)', tintPct: 0,  role: 'status' },
  warning:  { accent: 'var(--warning)',     tintPct: 8,  role: 'status' },
  error:    { accent: 'var(--danger)',      tintPct: 8,  role: 'alert'  },
  critical: { accent: 'var(--danger)',      tintPct: 12, role: 'alert'  },
};

const EXIT_MS = 200;
const EXIT_KEYFRAME = 'toast-out';

export default function Toast({ toast, onDismiss }) {
  const { id, type, title, message, action, details, duration, persistent } = toast;
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  const [exiting, setExiting]         = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paused, setPaused]           = useState(false);
  const dismissedRef                  = useRef(false);

  // Begin the exit animation. Actual removal happens on its animationend (below).
  const beginExit = () => setExiting(true);

  // Fires for BOTH the enter and exit animations on the root (and for any child
  // animation that bubbles) — only the exit keyframe removes the toast. The ref
  // guards against a stray double-fire.
  const handleRootAnimEnd = (e) => {
    if (e.animationName === EXIT_KEYFRAME && !dismissedRef.current) {
      dismissedRef.current = true;
      onDismiss(id);
    }
  };

  // The loading bar finishing = the toast's lifetime is up → start the exit.
  // Because dismissal is driven by this single animation, pausing the bar on
  // hover pauses the whole countdown for free (no separate timer to reconcile).
  const handleBarEnd = () => beginExit();

  const handleAction = () => {
    action?.onClick?.();
    beginExit();
  };

  const hasBar = !persistent && duration != null;

  return (
    <div
      role={cfg.role}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onAnimationEnd={handleRootAnimEnd}
      style={{
        pointerEvents: 'auto',
        width: 360,
        maxWidth: 'calc(100vw - 2rem)',
        // Enter reuses the existing slideInFromRight keyframe; exit swaps to the
        // new toast-out keyframe and holds the off-screen state via `forwards`.
        animation: exiting
          ? `${EXIT_KEYFRAME} ${EXIT_MS}ms ease-in forwards`
          : 'slideInFromRight 240ms ease-out',
      }}>
      {/* Frosted-gem surface: solid token base + diagonal sheen + accent tint +
          coloured drop shadow. Critical adds the pulse-danger breathing ring. */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          // Compact = pill, expanded = rounded box, morphing with the panel.
          // 40 (not 999) is deliberate: at compact heights it still clamps to a
          // full capsule (identical look), but sits close enough to the 20px box
          // radius that the border-radius tween interpolates smoothly — a 999→20
          // tween stays clamped to half-height then snaps at the end.
          borderRadius: detailsOpen ? 20 : 40,
          transition: 'border-radius 200ms ease-in-out',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)',
          border: `1px solid ${cfg.tintPct
            ? `color-mix(in srgb, ${cfg.accent} 35%, var(--border-main))`
            : 'var(--border-main)'}`,
          background: cfg.tintPct
            ? `linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.05) 100%), color-mix(in srgb, ${cfg.accent} ${cfg.tintPct}%, var(--bg-card))`
            : 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.04) 100%), var(--bg-card)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: cfg.tintPct
            ? `inset 0 1px 0 rgba(255,255,255,0.26), 0 4px 16px color-mix(in srgb, ${cfg.accent} 22%, transparent), 0 1px 3px rgba(0,0,0,0.16)`
            : 'inset 0 1px 0 rgba(255,255,255,0.2), var(--shadow-dropdown)',
          // Infinite → its animationend never fires, so it never bubbles to the
          // root removal handler. Breathing ring emphasis for critical only.
          animation: type === 'critical' ? 'pulse-danger 2s ease-in-out infinite' : undefined,
        }}>
        {/* Main row: dot · text · controls — all vertically centred and kept on
            ONE horizontal line so the toast reads as a short, wide capsule
            instead of a tall stack. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px' }}>
          {/* type dot */}
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: type === 'info' ? 'var(--text-muted)' : cfg.accent,
          }} />

          {/* text column: title (what broke) + message (what to do next) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: 'var(--text-primary)' }}>
              {title}
            </div>
            {message && (
              <div style={{ marginTop: 2, fontSize: 12, lineHeight: 1.45, color: 'var(--text-secondary)' }}>
                {message}
              </div>
            )}
          </div>

          {/* right control cluster: action · details toggle · close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {action && (
              <button type="button" className="btn-secondary-sm" onClick={handleAction}>
                {action.label}
              </button>
            )}
            {details && (
              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                aria-expanded={detailsOpen}
                aria-label="Toggle technical details"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 24, height: 24, padding: 0,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}>
                <span className="icon" style={{
                  fontSize: 18,
                  transition: 'transform 200ms ease-in-out',
                  transform: detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  expand_more
                </span>
              </button>
            )}
            <button
              type="button"
              className="btn-icon-ghost btn-icon-xs"
              aria-label="Dismiss notification"
              onClick={beginExit}>
              <span className="icon" style={{ fontSize: 16 }}>close</span>
            </button>
          </div>
        </div>

        {/* Details panel: full-width, expands below the row on demand. The
            0fr→1fr grid trick animates height smoothly without measuring. This is
            the one state that intentionally makes the toast taller. */}
        {details && (
          <div style={{
            display: 'grid',
            gridTemplateRows: detailsOpen ? '1fr' : '0fr',
            transition: 'grid-template-rows 200ms ease-in-out',
            padding: '0 18px',
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                marginBottom: 12,
                background: 'var(--bg-input)',
                border: '0.5px solid var(--border-main)',
                borderRadius: 'var(--radius-squircle-inner)',
                padding: '7px 9px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11, lineHeight: 1.5,
                color: 'var(--text-muted)', wordBreak: 'break-word',
              }}>
                {(details.endpoint || details.status != null) && (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {details.endpoint}
                    {details.status != null && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        {details.endpoint ? '  ·  ' : ''}{details.status}
                      </span>
                    )}
                  </div>
                )}
                {details.raw && <div style={{ marginTop: 3 }}>{details.raw}</div>}
                {details.code && <div style={{ marginTop: 3 }}>Code: {details.code}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Loading bar: shrinks left→right over `duration`, pauses on hover
            (which pauses dismissal too — see handleBarEnd). Hidden when persistent.
            Inset + rounded + lifted so it sits as a tidy progress pill clear of
            the capsule's rounded corners. */}
        {hasBar && (
          <div
            onAnimationEnd={handleBarEnd}
            style={{
              // Inset ≥ the pill radius so the bar stays within the capsule's flat
              // bottom segment — never clipped by the rounded corners.
              position: 'absolute', left: 24, right: 24, bottom: 6, height: 3,
              transformOrigin: 'left center', borderRadius: 999,
              background: type === 'info' ? 'var(--text-muted)' : cfg.accent,
              opacity: 0.55,
              // `linear` is intentional: a countdown bar must deplete at a
              // constant rate to read as elapsed time. Sanctioned exception to
              // the "no linear animation" rule (which targets UI transitions).
              animation: `shrink-width ${duration}ms linear forwards`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        )}
      </div>
    </div>
  );
}
