import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({
  children,
  content,
  placement = 'auto',
  delay = 400,
  maxWidth = 220,
}) {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState({});
  const triggerRef = useRef(null);
  const timerRef = useRef(null);

  const calculateStyle = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const GAP = 6;

    const positions = {
      top: {
        left: rect.left + rect.width / 2,
        bottom: window.innerHeight - rect.top + GAP,
        transform: 'translateX(-50%)',
      },
      bottom: {
        left: rect.left + rect.width / 2,
        top: rect.bottom + GAP,
        transform: 'translateX(-50%)',
      },
      left: {
        right: window.innerWidth - rect.left + GAP,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      },
      right: {
        left: rect.right + GAP,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      },
    };

    // Auto: prefer top, fall back to bottom
    const resolved = placement === 'auto'
      ? (rect.top > 60 ? 'top' : 'bottom')
      : placement;

    setStyle({
      position: 'fixed',
      zIndex: 1300,
      maxWidth,
      ...positions[resolved],
    });
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
