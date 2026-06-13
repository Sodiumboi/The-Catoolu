import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { loadWindowState, saveWindowState } from './notes/notesWindowState';
import NotesPane from './notes/NotesPane';

// Attaches mousemove/mouseup on document so drag follows the cursor
// even when pointer leaves the element (Safari-safe).
function attachDrag(e, onMove, onUp) {
  if (e.button !== 0) return;
  e.preventDefault();
  const sx = e.clientX, sy = e.clientY;
  const move = ev => onMove(ev.clientX - sx, ev.clientY - sy);
  const up   = ()  => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup',   up);
    onUp?.();
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup',   up);
}

// ─────────────────────────────────────────────────────────────
export default function NotesWindow({ windowState, onWindowStateChange, contextTagType, contextTag }) {
  const saved = loadWindowState();

  // Full-window position + size (state drives render, ref drives closures)
  const [pos,  setPos]  = useState({ x: saved.x,     y: saved.y      });
  const [size, setSize] = useState({ w: saved.width,  h: saved.height });
  const posRef  = useRef({ x: saved.x,    y: saved.y     });
  const sizeRef = useRef({ w: saved.width, h: saved.height });

  // Bubble position
  const defaultBX = Math.max(20, window.innerWidth  - 150);
  const defaultBY = Math.max(20, window.innerHeight - 60);
  const [bpos, setBpos] = useState({
    x: saved.bubbleX ?? defaultBX,
    y: saved.bubbleY ?? defaultBY,
  });
  const bposRef = useRef(bpos);

  // Animate only during state transitions (not during drag)
  const [animating,    setAnimating]    = useState(false);
  const [openingDir,   setOpeningDir]   = useState(null);  // 'opening' | null
  const [dragRotate,   setDragRotate]   = useState(0);
  const [snapping,     setSnapping]     = useState(false);

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

  // Minimise: place bubble at the window's current top-left so it
  // shrinks in place rather than jumping across the screen.
  const handleMinimise = () => {
    // Place bubble at the window's title-bar position (same top, centred horizontally).
    // This pins the top edge so expand grows downward and minimise collapses upward.
    const nb = {
      x: posRef.current.x + Math.round(sizeRef.current.w / 2) - 64,
      y: posRef.current.y,
    };
    setBpos(nb);
    bposRef.current = nb;
    saveWindowState({ bubbleX: nb.x, bubbleY: nb.y });
    changeState('bubble');
  };

  // ── Drag handlers ─────────────────────────────────────────
  const handleBubbleDown = (e) => {
    const ix = bposRef.current.x, iy = bposRef.current.y;
    let moved = false;
    attachDrag(
      e,
      (dx, dy) => {
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        if (moved) {
          const np = { x: ix + dx, y: iy + dy };
          bposRef.current = np;
          setBpos(np);
        }
      },
      () => {
        if (moved) saveWindowState({ bubbleX: bposRef.current.x, bubbleY: bposRef.current.y });
        else changeState('full');   // click (no drag) → expand
      }
    );
  };

  const handleTitleDown = (e) => {
    if (e.target.closest('[data-nodrag]') || animating) return;
    const ix = posRef.current.x, iy = posRef.current.y;
    let lastDx = 0;
    setSnapping(false);
    attachDrag(
      e,
      (dx, dy) => {
        const velX  = dx - lastDx;
        lastDx = dx;
        posRef.current = { x: ix + dx, y: iy + dy };
        setPos({ ...posRef.current });
        setDragRotate(Math.max(-6, Math.min(6, velX * 0.65)));
      },
      () => {
        setSnapping(true);
        setDragRotate(0);
        saveWindowState({ x: posRef.current.x, y: posRef.current.y });
        setTimeout(() => setSnapping(false), 550);
      }
    );
  };

  const handleResizeDown = (e) => {
    e.stopPropagation();
    if (animating) return;
    const iw = sizeRef.current.w, ih = sizeRef.current.h;
    attachDrag(
      e,
      (dx, dy) => {
        const ns = {
          w: Math.min(800, Math.max(360, iw + dx)),
          h: Math.min(900, Math.max(300, ih + dy)),
        };
        sizeRef.current = ns;
        setSize(ns);
      },
      () => saveWindowState({ width: sizeRef.current.w, height: sizeRef.current.h })
    );
  };

  // ── Derived display values ─────────────────────────────────
  const dispLeft   = isBubble ? bpos.x : pos.x;
  const dispTop    = isBubble ? bpos.y : pos.y;
  const dispW      = isBubble ? 128    : size.w;
  const dispH      = isBubble ? 36     : size.h;
  const dispRadius = isBubble ? '18px' : '10px';
  const dispBg     = isBubble ? 'var(--accent)' : 'var(--bg-card)';
  const dispShadow = isBubble
    ? '0 4px 16px rgba(0,0,0,0.28)'
    : '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)';

  const springEase  = openingDir === 'opening'
    ? 'cubic-bezier(0.34,1.3,0.64,1)'
    : 'cubic-bezier(0.4,0,0.2,1)';
  const snapTx      = snapping ? 'transform 500ms cubic-bezier(0.34,1.56,0.64,1)' : null;

  const morphTransition = animating
    ? [
        `left 320ms ${springEase}`,
        `top 320ms ${springEase}`,
        `width 340ms ${springEase}`,
        `height 340ms ${springEase}`,
        'border-radius 300ms ease',
        'background-color 220ms ease',
        'box-shadow 220ms ease',
        snapTx,
      ].filter(Boolean).join(', ')
    : snapTx || 'none';

  const contentFade = animating ? 'opacity 180ms ease' : 'none';

  return createPortal(
    <div
      style={{
        position:     'fixed',
        left:         dispLeft,
        top:          dispTop,
        width:        dispW,
        height:       dispH,
        borderRadius: dispRadius,
        background:   dispBg,
        boxShadow:    dispShadow,
        border:       isBubble ? 'none' : '1px solid var(--border-main)',
        overflow:     'hidden',
        zIndex:       9999,
        transition:   morphTransition,
        transform:    `rotate(${dragRotate}deg)`,
        userSelect:   'none',
      }}
    >
      {/* ── Bubble layer (visible when minimised) ────────── */}
      <div
        onMouseDown={isBubble ? handleBubbleDown : undefined}
        style={{
          position:      'absolute',
          inset:         0,
          display:       'flex',
          alignItems:    'center',
          gap:           '6px',
          padding:       '0 14px',
          color:         '#fff',
          fontFamily:    'var(--font-sans)',
          fontSize:      '13px',
          fontWeight:    600,
          cursor:        'grab',
          opacity:       isBubble ? 1 : 0,
          transition:    contentFade,
          animation:     openingDir === 'closing' ? 'notes-bounce-pill 320ms ease 240ms' : 'none',
          pointerEvents: isBubble ? 'auto' : 'none',
          boxSizing:     'border-box',
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

      {/* ── Window layer (visible when full) ─────────────── */}
      <div
        className="notes-window"
        style={{
          position:        'absolute',
          inset:           0,
          display:         'flex',
          flexDirection:   'column',
          background:      'var(--bg-card)',
          opacity:         isBubble ? 0 : 1,
          transition:      openingDir === 'opening' ? 'none' : contentFade,
          animation:       openingDir === 'opening'
            ? 'notes-bounce-open 400ms cubic-bezier(0.22,1,0.36,1) both'
            : 'none',
          transformOrigin: '50% 0',
          pointerEvents:   isBubble ? 'none' : 'auto',
        }}
      >
        {/* Title bar — drag handle */}
        <div
          onMouseDown={handleTitleDown}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '7px 8px 7px 12px',
            background:     'var(--bg-input)',
            borderBottom:   '1px solid var(--border-main)',
            cursor:         'move',
            flexShrink:     0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>description</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--text-primary)' }}>Notes</span>
          </div>

          <div style={{ display: 'flex', gap: '2px' }} data-nodrag>
            <button
              onClick={handleMinimise}
              title="Minimise"
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
            <button
              onClick={() => changeState('closed')}
              title="Close"
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
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <NotesPane contextTagType={contextTagType} contextTag={contextTag} />
        </div>

        {/* Resize handle — bottom-right */}
        <div
          onMouseDown={handleResizeDown}
          style={{
            position: 'absolute',
            bottom: 0, right: 0,
            width: 18, height: 18,
            cursor: 'se-resize',
          }}
        />

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
      </div>
    </div>,
    document.body
  );
}
