import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * FileDropZone — reusable drag-and-drop wrapper.
 *
 * Shows a dark overlay when files are dragged over it and hands the raw File[]
 * back via `onFiles` — the consumer validates/filters.
 *
 * Two modes:
 *   - default (box): the wrapped element is the drop target; overlay covers the box.
 *   - global: listens at the window level so a drop ANYWHERE on the page works;
 *     overlay darkens and fills the whole viewport (rendered via portal). Use for
 *     "drop anywhere on this page" UX where content may not fill the visible area.
 *
 * Props:
 *   onFiles(files: File[])  — called on drop with the dropped files
 *   overlayLabel            — text shown in the overlay (default: 'Drop files here')
 *   overlayIcon             — Material Symbol name (default: 'upload')
 *   global                  — when true, drop target is the whole window/viewport
 *   disabled                — when true, drag-drop is inert and no overlay shows
 *   style / className       — applied to the wrapper element (box mode only)
 *   children                — wrapped content
 */

// Inject overlay fade-in keyframe once
if (typeof document !== 'undefined' && !document.getElementById('fdz-anim-styles')) {
  const s = document.createElement('style');
  s.id = 'fdz-anim-styles';
  s.textContent = `@keyframes fdz-overlay-in { from { opacity: 0 } to { opacity: 1 } }`;
  document.head.appendChild(s);
}

// Lenient file-drag detection. Safari does not always expose 'Files' in
// dataTransfer.types during dragover, so we also probe items and file UTIs.
const isFileDrag = (e) => {
  const dt = e.dataTransfer;
  if (!dt) return false;
  const types = dt.types ? Array.from(dt.types) : [];
  if (types.includes('Files') || types.includes('public.file-url')) return true;
  if (dt.items && Array.from(dt.items).some(i => i.kind === 'file')) return true;
  return false;
};

// Safari sometimes leaves dataTransfer.files empty on drop but exposes the
// dropped files via dataTransfer.items — pull from whichever has them.
const extractFiles = (dt) => {
  if (!dt) return [];
  if (dt.files && dt.files.length > 0) return Array.from(dt.files);
  if (dt.items && dt.items.length > 0) {
    return Array.from(dt.items)
      .filter(i => i.kind === 'file')
      .map(i => i.getAsFile())
      .filter(Boolean);
  }
  return [];
};

const OverlayContent = ({ overlayIcon, overlayLabel, large }) => (
  <>
    <span className="material-symbols-outlined" style={{ fontSize: large ? 56 : 40, color: '#fff' }}>
      {overlayIcon}
    </span>
    <span style={{
      fontFamily: 'var(--font-sans)', fontSize: large ? 18 : 15,
      fontWeight: 600, color: '#fff',
      textShadow: '0 1px 6px rgba(0,0,0,0.4)',
    }}>
      {overlayLabel}
    </span>
  </>
);

export default function FileDropZone({
  onFiles,
  overlayLabel = 'Drop files here',
  overlayIcon = 'upload',
  global = false,
  disabled = false,
  style,
  className,
  children,
}) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const hideTimer = useRef(null);

  // Keep latest onFiles without re-subscribing window listeners every render
  const onFilesRef = useRef(onFiles);
  useEffect(() => { onFilesRef.current = onFiles; });

  // ── Box-mode (node) handlers — strict, so reuse elsewhere never interferes ──
  const reset = useCallback(() => { depth.current = 0; setDragging(false); }, []);

  const onEnter = useCallback((e) => {
    if (disabled || !isFileDrag(e)) return;
    e.preventDefault();
    depth.current += 1;
    setDragging(true);
  }, [disabled]);

  const onOver = useCallback((e) => {
    if (disabled || !isFileDrag(e)) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'copy'; } catch { /* Safari */ }
  }, [disabled]);

  const onLeave = useCallback((e) => {
    if (disabled || !isFileDrag(e)) return;
    depth.current -= 1;
    if (depth.current <= 0) reset();
  }, [disabled, reset]);

  const onDrop = useCallback((e) => {
    if (disabled || !isFileDrag(e)) return;
    e.preventDefault();
    reset();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) onFilesRef.current?.(files);
  }, [disabled, reset]);

  // ── Global-mode listeners — bound to document (Safari fires drop there, not
  //    reliably on window) and robust across Chrome/Firefox/Safari ──
  useEffect(() => {
    if (!global || disabled) return;

    const showOverlay = () => {
      setDragging(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      // dragover fires continuously while over the page; if it stops (drag left
      // the window or was dropped) this fires and hides the overlay.
      hideTimer.current = setTimeout(() => setDragging(false), 120);
    };

    // Always preventDefault on enter+over so Safari actually fires the drop event.
    const gEnter = (e) => { e.preventDefault(); };
    const gOver = (e) => {
      e.preventDefault();
      if (!isFileDrag(e)) return;
      try { e.dataTransfer.dropEffect = 'copy'; } catch { /* Safari */ }
      showOverlay();
    };
    const gDrop = (e) => {
      e.preventDefault();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setDragging(false);
      const files = extractFiles(e.dataTransfer);
      if (files.length > 0) onFilesRef.current?.(files);
    };

    document.addEventListener('dragenter', gEnter);
    document.addEventListener('dragover', gOver);
    document.addEventListener('drop', gDrop);
    return () => {
      document.removeEventListener('dragenter', gEnter);
      document.removeEventListener('dragover', gOver);
      document.removeEventListener('drop', gDrop);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setDragging(false);
    };
  }, [global, disabled]);

  if (global) {
    return (
      <>
        {children}
        {dragging && createPortal(
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.62)',
              display: 'flex', padding: 18, pointerEvents: 'none',
              animation: 'fdz-overlay-in 0.12s ease',
            }}
          >
            <div style={{
              flex: 1, borderRadius: 16,
              border: '3px dashed rgba(255,255,255,0.45)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14,
            }}>
              <OverlayContent overlayIcon={overlayIcon} overlayLabel={overlayLabel} large />
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <div
      className={className}
      style={{ position: 'relative', ...style }}
      onDragEnter={onEnter}
      onDragOver={onOver}
      onDragLeave={onLeave}
      onDrop={onDrop}
    >
      {children}

      {dragging && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 50, borderRadius: 12,
            background: 'rgba(0,0,0,0.55)',
            border: '2px dashed rgba(255,255,255,0.45)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            pointerEvents: 'none', animation: 'fdz-overlay-in 0.12s ease',
          }}
        >
          <OverlayContent overlayIcon={overlayIcon} overlayLabel={overlayLabel} />
        </div>
      )}
    </div>
  );
}
