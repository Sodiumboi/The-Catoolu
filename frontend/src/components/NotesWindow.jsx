import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { loadWindowState, saveWindowState } from './notes/notesWindowState';
import NotesPane from './notes/NotesPane';
import Tooltip from './ui/Tooltip';

// ─────────────────────────────────────────────────────────────
export default function NotesWindow({ windowState, onWindowStateChange, contextTagType, contextTag }) {
  const saved = loadWindowState();

  // Full-window position + size (native drag/resize, see handlers below)
  const [pos,  setPos]  = useState({ x: saved.x,     y: saved.y      });
  const [size, setSize] = useState({ w: saved.width,  h: saved.height });

  // Bubble position (native drag). Falls back to bottom-right
  // when no bubbleX/bubbleY has ever been persisted.
  const defaultBX = Math.max(20, window.innerWidth  - 152);
  const defaultBY = Math.max(20, window.innerHeight - 60);
  const [bpos, setBpos] = useState({
    x: saved.bubbleX ?? defaultBX,
    y: saved.bubbleY ?? defaultBY,
  });
  // Animate only during state transitions (not during drag)
  const [animating,  setAnimating]  = useState(false);
  const [openingDir, setOpeningDir] = useState(null);  // 'opening' | 'closing' | null

  // First-time guide
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem('notes-guide-seen'));
  const [dontShow,  setDontShow]  = useState(false);
  const dismissGuide = () => {
    if (dontShow) localStorage.setItem('notes-guide-seen', '1');
    setShowGuide(false);
  };

  // Shimmer sweep — increments each time the bubble becomes visible
  const [shimmerKey, setShimmerKey] = useState(0);
  useEffect(() => {
    if (windowState !== 'bubble') return;
    const t = setTimeout(() => setShimmerKey(k => k + 1), 300);
    return () => clearTimeout(t);
  }, [windowState]);

  if (windowState === 'closed') return null;

  const isBubble = windowState === 'bubble';

  // ── State change with animation ──────────────────────────
  const changeState = (next) => {
    const crossing = (windowState === 'bubble' && next === 'full') ||
                     (windowState === 'full'   && next === 'bubble');
    if (crossing) {
      const dir = next === 'full' ? 'opening' : 'closing';
      setAnimating(true);
      setOpeningDir(dir);
      setTimeout(() => setAnimating(false), 380);
      setTimeout(() => setOpeningDir(null), dir === 'opening' ? 380 : 580);
    }
    onWindowStateChange(next);
  };

  // Minimise: collapse the pill to the centre of the window's title bar, so
  // it appears to shrink toward the middle of the bar (clamped to viewport).
  const handleMinimise = () => {
    const centreX = pos.x + size.w / 2;          // title-bar centre
    const bx = Math.max(0, Math.min(window.innerWidth  - 128, centreX - 64));
    const by = Math.max(0, Math.min(window.innerHeight -  36, pos.y));
    setBpos({ x: bx, y: by });
    saveWindowState({ bubbleX: bx, bubbleY: by });
    changeState('bubble');
  };

  // ── Bubble drag + click-to-open (simple custom handler) ───
  // Lightweight document-level pointer drag: move past a small threshold =
  // drag (persist position); release without movement = click (expand to the
  // full window). Both the pill and the window use native handlers because
  // react-rnd/react-draggable is incompatible with React 19 (findDOMNode).
  const DRAG_THRESHOLD = 3;
  const handleBubbleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = bpos.x;
    const originY = bpos.y;
    let moved = false;

    const clamp = (dx, dy) => ({
      x: Math.max(0, Math.min(window.innerWidth  - 128, originX + dx)),
      y: Math.max(0, Math.min(window.innerHeight -  36, originY + dy)),
    });

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) moved = true;
      if (moved) setBpos(clamp(dx, dy));
    };
    const onUp = (ev) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (moved) {
        const next = clamp(ev.clientX - startX, ev.clientY - startY);
        setBpos(next);
        saveWindowState({ bubbleX: next.x, bubbleY: next.y });
      } else {
        // click (no real movement) → expand the window centred on the pill,
        // so the title bar grows back out from the pill (clamped to viewport).
        const centreX = bpos.x + 64;             // pill centre
        const wx = Math.max(0, Math.min(Math.max(0, window.innerWidth  - size.w), centreX - size.w / 2));
        const wy = Math.max(0, Math.min(Math.max(0, window.innerHeight - size.h), bpos.y));
        setPos({ x: wx, y: wy });
        saveWindowState({ x: wx, y: wy });
        changeState('full');
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Opacity-only fade during morph (never animate left/top/width/height —
  // that would make the native drag/resize below lag).
  const contentFade = animating ? 'opacity 180ms ease' : 'none';

  // ── Full-window drag (native) ────────────────────────────
  // react-rnd's drag engine (react-draggable) relies on ReactDOM.findDOMNode,
  // which React 19 removed — so react-rnd drag/resize silently fails here.
  // We drive position/size natively with document-level pointer handlers,
  // clamped to the viewport. Buttons opt out via [data-nodrag].
  const handleWindowMouseDown = (e) => {
    if (e.target.closest('[data-nodrag]')) return;   // don't drag from buttons
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const originX = pos.x, originY = pos.y;
    const maxX = Math.max(0, window.innerWidth  - size.w);
    const maxY = Math.max(0, window.innerHeight - size.h);
    const at = (ev) => ({
      x: Math.max(0, Math.min(maxX, originX + ev.clientX - startX)),
      y: Math.max(0, Math.min(maxY, originY + ev.clientY - startY)),
    });
    const onMove = (ev) => setPos(at(ev));
    const onUp = (ev) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const next = at(ev);
      setPos(next);
      saveWindowState({ x: next.x, y: next.y });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ── Full-window resize from the bottom-right grip (native) ─
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const originW = size.w, originH = size.h;
    const at = (ev) => ({
      w: Math.max(360, Math.min(800, originW + ev.clientX - startX)),
      h: Math.max(300, Math.min(900, originH + ev.clientY - startY)),
    });
    const onMove = (ev) => setSize(at(ev));
    const onUp = (ev) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const next = at(ev);
      setSize(next);
      saveWindowState({ width: next.w, height: next.h });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return createPortal(
    <>
      {/* ── Bubble pill (visible when minimised) — fixed div, custom drag ── */}
      {isBubble && (
        <div
          onMouseDown={handleBubbleMouseDown}
          style={{
            position:      'fixed',
            left:          bpos.x,
            top:           bpos.y,
            width:         128,
            height:        36,
            zIndex:        9999,
            display:       'flex',
            alignItems:    'center',
            gap:           '6px',
            padding:       '0 14px',
            color:         '#fff',
            background:    'var(--accent)',
            borderRadius:  '18px',
            boxShadow:     '0 4px 16px rgba(0,0,0,0.28)',
            fontFamily:    'var(--font-sans)',
            fontSize:      '13px',
            fontWeight:    600,
            cursor:        'grab',
            overflow:      'hidden',
            animation:     openingDir === 'closing' ? 'notes-bounce-pill 360ms cubic-bezier(0.34,1.3,0.64,1)' : 'none',
            boxSizing:     'border-box',
            userSelect:    'none',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15, flexShrink: 0 }}>description</span>
          Notes

          {/* Shimmer sweep */}
          <div
            key={shimmerKey}
            style={{
              position:   'absolute',
              top: 0, bottom: 0, left: 0,
              width:      '55%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)',
              transform:  'translateX(-100%)',
              animation:  shimmerKey > 0 ? 'note-shimmer 0.65s ease forwards' : 'none',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* ── Full window (visible when full) — native fixed div ─────── */}
      {!isBubble && (
        <div
          className="notes-window"
          style={{
            position:        'fixed',
            left:            pos.x,
            top:             pos.y,
            width:           size.w,
            height:          size.h,
            zIndex:          9999,
            display:         'flex',
            flexDirection:   'column',
            background:      'var(--bg-card)',
            borderRadius:    '10px',
            border:          '1px solid var(--border-main)',
            boxShadow:       '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
            // overflow:clip (not hidden) — still clips children to the rounded
            // corners, but is NOT a scroll container. With the inner wrappers also
            // clipped, the editor Body (overflow-y:auto) is the ONLY scrollable
            // ancestor, so a focus/selection scroll can never move the title bar
            // or toolbar out of view — it can only scroll the note body.
            overflow:        'clip',
            transition:      openingDir === 'opening' ? 'none' : contentFade,
            animation:       openingDir === 'opening'
              ? 'notes-bounce-open 400ms cubic-bezier(0.22,1,0.36,1) both'
              : 'none',
            transformOrigin: '50% 0',
          }}
        >
            {/* Title bar — drag handle */}
            <div
              className="notes-drag-handle"
              onMouseDown={handleWindowMouseDown}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '7px 8px 7px 12px',
                background:     'var(--bg-input)',
                borderBottom:   '1px solid var(--border-main)',
                cursor:         'move',
                flexShrink:     0,
                userSelect:     'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>description</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--text-primary)' }}>Notes</span>
              </div>

              <div style={{ display: 'flex', gap: '2px' }} data-nodrag>
                <Tooltip content="Minimise">
                <button
                  onClick={handleMinimise}
                  style={{
                    background: 'transparent', border: 'none',
                    color:      'var(--text-faint)', cursor: 'pointer',
                    padding:    '1px 8px', borderRadius: '4px',
                    fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, lineHeight: 1.2,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                >
                  &#8212;
                </button>
                </Tooltip>
                <Tooltip content="Close">
                <button
                  onClick={() => changeState('closed')}
                  style={{
                    background: 'transparent', border: 'none',
                    color:      'var(--text-faint)', cursor: 'pointer',
                    padding:    '2px 5px', borderRadius: '4px', lineHeight: 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', display: 'block' }}>close</span>
                </button>
                </Tooltip>
              </div>
            </div>

            {/* Content — overflow:clip (not hidden) so a focus/selection scroll
                inside the editor can't scroll this wrapper and drag the toolbar
                up under the title bar. Not a scroll container; the editor Body
                below owns its own overflow-y:auto. */}
            <div style={{ flex: 1, overflow: 'clip' }}>
              <NotesPane contextTagType={contextTagType} contextTag={contextTag} />
            </div>

            {/* First-time guide overlay */}
            {showGuide && (
              <div style={{
                position:      'absolute', inset: 0,
                background:    'rgba(0,0,0,0.45)',
                zIndex:        20,
                display:       'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius:  '10px',
              }}>
                <div style={{
                  background:   'var(--bg-popup)',
                  border:       '1px solid var(--border-main)',
                  borderRadius: '12px',
                  padding:      '20px 22px',
                  maxWidth:     '260px',
                  boxShadow:    'var(--shadow-dropdown)',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-serif)', fontSize: '16px',
                    color: 'var(--text-primary)', marginBottom: '12px',
                  }}>
                    Notes
                  </div>

                  <ul style={{
                    margin: '0 0 16px', padding: '0 0 0 16px',
                    fontFamily: 'var(--font-sans)', fontSize: '12px',
                    color: 'var(--text-secondary)', lineHeight: 1.8,
                  }}>
                    <li>Notes are <strong>private</strong> — only you can see them</li>
                    <li>Drag the title bar to reposition</li>
                    <li>Click <strong>—</strong> to collapse to a floating pill</li>
                    <li>Tag notes to a character or session</li>
                  </ul>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    marginBottom: '14px', cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={dontShow}
                      onChange={e => setDontShow(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      Don't show again
                    </span>
                  </label>

                  <button
                    onClick={dismissGuide}
                    style={{
                      width: '100%', padding: '8px',
                      borderRadius: '8px', border: 'none',
                      background: 'var(--accent)', color: '#fff',
                      fontFamily: 'var(--font-sans)', fontSize: '13px',
                      fontWeight: '600', cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Got it!
                  </button>
                </div>
              </div>
            )}

            {/* Resize grip — bottom-right hit area; the rounded-triangle
                indicator is inset a few px away from the very corner. */}
            <Tooltip content="Resize">
            <div
              onMouseDown={handleResizeMouseDown}
              style={{
                position:       'absolute',
                right:          0,
                bottom:         0,
                width:          22,
                height:         22,
                cursor:         'nwse-resize',
                zIndex:         10,
                display:        'flex',
                alignItems:     'flex-end',
                justifyContent: 'flex-end',
                padding:        5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ display: 'block', pointerEvents: 'none' }}>
                {/* Only the bottom-right point is rounded (r=5), concentric with
                    the window's 10px corner radius at this ~5px inset. The two
                    45° tips stay as soft points. */}
                <path
                  d="M11 1 L11 6 A5 5 0 0 1 6 11 L1 11 Z"
                  fill="var(--text-faint)"
                  stroke="var(--text-faint)"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            </Tooltip>
        </div>
      )}
    </>,
    document.body
  );
}
