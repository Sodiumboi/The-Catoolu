import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Tooltip from '../ui/Tooltip';

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
        className="fixed inset-0 bg-[rgba(0,0,0,0.72)] z-1000 flex flex-col"
        onClick={() => { if (!didDrag.current) onClose(); }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 py-2.5 px-3.5 shrink-0 bg-[linear-gradient(rgba(0,0,0,0.6),transparent)]"
          onClick={e => e.stopPropagation()}
        >
          {viewStack.length > 1 && (
            <Tooltip content="Back">
            <button onClick={() => setViewStack(prev => prev.slice(0, -1))} aria-label="Back" className={toolbarBtnCss}>
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            </Tooltip>
          )}
          <span className="material-symbols-outlined text-base text-white/60 shrink-0">image</span>
          <span className="flex-1 text-sm font-medium text-white overflow-hidden text-ellipsis whitespace-nowrap font-sans">
            {current.title}
          </span>
          <Tooltip content="Save to device">
          <button onClick={handleDownload} aria-label="Save to device" className={toolbarBtnCss}>
            <span className="material-symbols-outlined text-xl">download</span>
          </button>
          </Tooltip>
          <Tooltip content="Close (Esc)">
          <button onClick={onClose} aria-label="Close" className={toolbarBtnCss}>
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          </Tooltip>
        </div>

        {/* Image area — click image to toggle zoom, drag when zoomed to pan */}
        <div
          ref={imageAreaRef}
          className={`flex-1 flex items-center justify-center overflow-hidden ${zoomed ? 'cursor-grab' : 'cursor-zoom-in'}`}
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
            className="max-w-[88vw] max-h-[80vh] object-contain origin-center select-none"
            style={{
              // pan/zoom transform stays inline — live drag/zoom state; transition duration
              // is JS-interpolated (ZOOM_DURATION), never safe inside a Tailwind arbitrary bracket
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: showTransition ? `transform ${ZOOM_DURATION}ms ease-in-out` : 'none',
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
      className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-1000 p-5"
      onClick={onClose}
    >
      <div
        className="bg-(--bg-card) rounded-[14px] border border-(--border-main) max-w-[90vw] max-h-[90vh] w-120 overflow-hidden flex flex-col shadow-(--shadow-dropdown)"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 py-3 px-4 border-b border-(--border-main) shrink-0">
          {viewStack.length > 1 && (
            <button
              onClick={() => setViewStack(prev => prev.slice(0, -1))}
              aria-label="Back"
              className="btn-icon-ghost btn-icon-sm shrink-0"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
          )}
          <span className="material-symbols-outlined text-base text-(--accent) shrink-0">
            {typeIcon(current.type)}
          </span>
          <span className="font-sans text-sm font-medium text-(--text-primary) flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {current.title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-icon-ghost btn-icon-sm shrink-0"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto overscroll-contain flex-1">
          {current.type === 'text' && (
            <div className="m-4 py-4 px-5 border-l-[3px] border-l-(--accent) rounded-[0_8px_8px_0] bg-(--bg-section-hd)">
              <p className="font-serif text-[15px] leading-[1.75] text-(--text-primary) m-0 whitespace-pre-wrap italic">
                {current.content || '(empty)'}
              </p>
            </div>
          )}

          {current.type === 'bundle' && (
            <div className="p-4 flex flex-col gap-2">
              {(current.items || []).length === 0 ? (
                <div className="text-[13px] text-(--text-faint) italic text-center p-6 font-sans">
                  Empty bundle
                </div>
              ) : (current.items || []).map(item => (
                <div
                  key={item.uuid}
                  onClick={() => setViewStack(prev => [...prev, item])}
                  className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg border border-(--border-main) bg-(--bg-page) cursor-pointer [transition:border-color_0.1s,background_0.1s]"
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
                    <img src={item.content} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                  )}
                  {item.type !== 'image' && (
                    <span className="material-symbols-outlined text-lg text-(--accent) shrink-0">
                      {typeIcon(item.type)}
                    </span>
                  )}
                  <span className="text-[13px] text-(--text-primary) flex-1 font-sans">
                    {item.title}
                  </span>
                  <span className="material-symbols-outlined text-base text-(--text-faint)">
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

// ─── Shared button style helper (toolbar icon buttons — image lightbox) ──
const toolbarBtnCss = 'bg-white/10 border-none rounded-md cursor-pointer text-white py-1 px-1.5 flex items-center justify-center shrink-0';
