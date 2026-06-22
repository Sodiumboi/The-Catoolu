import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const typeIcon = (type) =>
  type === 'image' ? 'image' : type === 'bundle' ? 'stacks' : 'text_fields';

const CLICK_ZOOM    = 2.5;
const ZOOM_DURATION = 180; // ms — keep in sync with CSS transition below

export default function HandoutViewer({ handout, onClose }) {
  const [viewStack, setViewStack]       = useState([handout]);
  const [zoomed, setZoomed]             = useState(false);
  const [pan, setPan]                   = useState({ x: 0, y: 0 });
  const [showTransition, setShowTrans]  = useState(false);
  const isDragging   = useRef(false);
  const didDrag      = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const imageAreaRef = useRef(null);
  const imgRef       = useRef(null);
  const panRef       = useRef({ x: 0, y: 0 });
  const zoomedRef    = useRef(false);
  const transTimer   = useRef(null);
  const current = viewStack[viewStack.length - 1];

  const applyPan    = (p) => { panRef.current = p;  setPan(p); };
  const applyZoomed = (z) => { zoomedRef.current = z; setZoomed(z); };

  // Activate the CSS transition for one zoom-animation window, then clear it
  // so panning is always instant.
  const triggerTransition = () => {
    clearTimeout(transTimer.current);
    setShowTrans(true);
    transTimer.current = setTimeout(() => setShowTrans(false), ZOOM_DURATION + 40);
  };

  useEffect(() => () => clearTimeout(transTimer.current), []);

  // Reset state when navigating between bundle items
  useEffect(() => {
    applyZoomed(false);
    applyPan({ x: 0, y: 0 });
  }, [viewStack.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (viewStack.length > 1) setViewStack(prev => prev.slice(0, -1));
        else onClose();
      }
      if (e.key === '0') { triggerTransition(); applyZoomed(false); applyPan({ x: 0, y: 0 }); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [viewStack, onClose]);

  // Clamp so the image can reach its own edge but not go past the viewport edge.
  // Uses actual container + rendered-image dimensions for accuracy.
  const clampPan = (x, y) => {
    if (!imgRef.current || !imageAreaRef.current) return { x, y };
    const iw   = imgRef.current.offsetWidth;
    const ih   = imgRef.current.offsetHeight;
    const aw   = imageAreaRef.current.offsetWidth;
    const ah   = imageAreaRef.current.offsetHeight;
    const maxX = Math.max(0, (iw * CLICK_ZOOM - aw) / 2);
    const maxY = Math.max(0, (ih * CLICK_ZOOM - ah) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  // Global drag tracking so pan continues even when cursor leaves the image area
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
      applyPan(clampPan(dragStart.current.panX + dx, dragStart.current.panY + dy));
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging.current = true;
    didDrag.current    = false;
    dragStart.current  = { x: e.clientX, y: e.clientY, panX: panRef.current.x, panY: panRef.current.y };
  }, []);

  const toggleZoom = (e) => {
    triggerTransition();
    if (zoomedRef.current) {
      applyZoomed(false);
      applyPan({ x: 0, y: 0 });
    } else {
      applyZoomed(true);
      if (e && imageAreaRef.current) {
        // Shift pan so the clicked point stays under the cursor after scaling.
        // Formula: panAfter = cursorOffsetFromCenter * (1 - CLICK_ZOOM)
        const rect = imageAreaRef.current.getBoundingClientRect();
        const cx = e.clientX - (rect.left + rect.width  / 2);
        const cy = e.clientY - (rect.top  + rect.height / 2);
        applyPan(clampPan(cx * (1 - CLICK_ZOOM), cy * (1 - CLICK_ZOOM)));
      }
    }
  };

  const handleDownload = async () => {
    try {
      const res  = await fetch(current.content);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = current.title || 'handout';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(current.content, '_blank');
    }
  };

  // ─── Image lightbox ──────────────────────────────────────────
  if (current.type === 'image') {
    const zoom = zoomed ? CLICK_ZOOM : 1;
    return createPortal(
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          zIndex: 1000, display: 'flex', flexDirection: 'column',
        }}
        onClick={() => { if (!didDrag.current) onClose(); }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', flexShrink: 0,
            background: 'linear-gradient(rgba(0,0,0,0.6), transparent)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {viewStack.length > 1 && (
            <button onClick={() => setViewStack(prev => prev.slice(0, -1))} style={toolbarBtn} title="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
          )}
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>image</span>
          <span style={{
            flex: 1, fontSize: 14, fontWeight: 500, color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-sans)',
          }}>
            {current.title}
          </span>
          <button onClick={handleDownload} style={toolbarBtn} title="Save to device">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
          </button>
          <button onClick={onClose} style={toolbarBtn} title="Close (Esc)">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Image area — click image to toggle zoom, drag when zoomed to pan */}
        <div
          ref={imageAreaRef}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            cursor: zoomed ? 'grab' : 'zoom-in',
          }}
          onMouseDown={handleMouseDown}
        >
          <img
            ref={imgRef}
            src={current.content}
            alt={current.title}
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              if (didDrag.current) return;
              toggleZoom(e);
            }}
            style={{
              maxWidth: '88vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              // Transition only active during zoom click (not during pan drag)
              transition: showTransition ? `transform ${ZOOM_DURATION}ms ease-in-out` : 'none',
              userSelect: 'none',
            }}
          />
        </div>
      </div>,
      document.body
    );
  }

  // ─── Text / bundle modal ─────────────────────────────────────
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 14,
          border: '1px solid var(--border-main)',
          maxWidth: '90vw', maxHeight: '90vh',
          width: 480,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-dropdown)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-main)',
          flexShrink: 0,
        }}>
          {viewStack.length > 1 && (
            <button
              onClick={() => setViewStack(prev => prev.slice(0, -1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, flexShrink: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            </button>
          )}
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent)', flexShrink: 0 }}>
            {typeIcon(current.type)}
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            color: 'var(--text-primary)', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {current.title}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', overscrollBehavior: 'contain', flex: 1 }}>
          {current.type === 'text' && (
            <div style={{
              margin: 16, padding: '16px 20px',
              borderLeft: '3px solid var(--accent)',
              borderRadius: '0 8px 8px 0',
              background: 'var(--bg-section-hd)',
            }}>
              <p style={{
                fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: '1.75',
                color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontStyle: 'italic',
              }}>
                {current.content || '(empty)'}
              </p>
            </div>
          )}

          {current.type === 'bundle' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(current.items || []).length === 0 ? (
                <div style={{
                  fontSize: 13, color: 'var(--text-faint)', fontStyle: 'italic',
                  textAlign: 'center', padding: 24, fontFamily: 'var(--font-sans)',
                }}>
                  Empty bundle
                </div>
              ) : (current.items || []).map(item => (
                <div
                  key={item.uuid}
                  onClick={() => setViewStack(prev => [...prev, item])}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--border-main)',
                    background: 'var(--bg-page)', cursor: 'pointer',
                    transition: 'border-color 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background  = 'var(--accent-bg)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-main)';
                    e.currentTarget.style.background  = 'var(--bg-page)';
                  }}
                >
                  {item.type === 'image' && item.content && (
                    <img src={item.content} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  {item.type !== 'image' && (
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)', flexShrink: 0 }}>
                      {typeIcon(item.type)}
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, fontFamily: 'var(--font-sans)' }}>
                    {item.title}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-faint)' }}>
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Shared button styles ──────────────────────────────────────

const toolbarBtn = {
  background: 'rgba(255,255,255,0.1)',
  border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff',
  padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
