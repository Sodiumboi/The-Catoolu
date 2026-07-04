import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({
  children,
  content,
  placement = 'auto',
  delay = 300,
  maxWidth = 220,
}) {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState({});
  const triggerRef = useRef(null);
  const timerRef = useRef(null);

  const calculateStyle = useCallback(() => {
    // The wrapper span is display:contents, so it has no layout box and its own
    // getBoundingClientRect() returns all-zeros. Measure the real child element.
    const node = triggerRef.current?.firstElementChild || triggerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const GAP = 6;
    const EDGE = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Auto: prefer top, fall back to bottom
    const resolved = placement === 'auto'
      ? (rect.top > 60 ? 'top' : 'bottom')
      : placement;

    const s = { position: 'fixed', zIndex: 1300, maxWidth };

    if (resolved === 'top' || resolved === 'bottom') {
      if (resolved === 'top') s.bottom = vh - rect.top + GAP;
      else s.top = rect.bottom + GAP;

      // Horizontal: center on the trigger, but anchor to an edge when close to
      // the viewport border so the (position:fixed) box never shrink-to-fits
      // and wraps. Anchoring by `right`/`left` keeps the available width large.
      const cx = rect.left + rect.width / 2;
      if (cx > vw - 120) {
        s.right = Math.max(EDGE, vw - rect.right);
      } else if (cx < 120) {
        s.left = Math.max(EDGE, rect.left);
      } else {
        s.left = cx;
        s.transform = 'translateX(-50%)';
      }
    } else {
      // left / right placement
      if (resolved === 'left') s.right = vw - rect.left + GAP;
      else s.left = rect.right + GAP;
      s.top = Math.min(Math.max(EDGE, rect.top + rect.height / 2), vh - EDGE);
      s.transform = 'translateY(-50%)';
    }

    setStyle(s);
  }, [placement, maxWidth]);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      calculateStyle();
      setVisible(true);
    }, delay);
  }, [calculateStyle, delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: 'contents' }}>
        {children}
      </span>

      {visible && content && createPortal(
        <div style={{
          ...style,
          background: 'var(--bg-nav)',
          color: 'var(--text-primary)',
          border: '0.5px solid var(--border-main)',
          borderRadius: 6,
          padding: '5px 9px',
          fontSize: 12,
          lineHeight: 1.5,
          boxShadow: 'var(--shadow-dropdown)',
          pointerEvents: 'none',
          animation: 'fadeIn 120ms ease-out both',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
