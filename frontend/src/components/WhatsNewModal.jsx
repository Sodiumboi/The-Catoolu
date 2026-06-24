import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WHATS_NEW } from '../config/whatsNew';

export default function WhatsNewModal({ onClose }) {
  // Escape key dismisses
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Body scroll lock while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    // Backdrop + flex-centering wrapper — handles centering so the modal
    // can use confirm-pop-in (scale + translateY) without fighting a
    // transform-based top/left centering offset.
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 1100,
        animation: 'confirm-fade-in 0.15s ease-in-out',
      }}
    >
      {/* Modal box — stopPropagation prevents backdrop-click from firing */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 90vw)',
          maxHeight: '80vh',
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border-main)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          zIndex: 1101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'confirm-pop-in 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
      >
        {/* Sticky header — just "What's New" + close; version meta lives in each block */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '0.5px solid var(--border-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            color: 'var(--text-primary)',
          }}>
            What&apos;s New
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: 'var(--text-muted)',
              lineHeight: 1,
              padding: '4px 6px',
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content — full changelog, newest first */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '0 20px',
        }}>
          {WHATS_NEW.map((entry, idx) => (
            <div
              key={entry.version}
              style={{
                paddingTop: 20,
                paddingBottom: 20,
                borderTop: idx === 0 ? 'none' : '0.5px solid var(--border-main)',
              }}
            >
              {/* Per-version header */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 16,
              }}>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  color: 'var(--text-primary)',
                }}>
                  v{entry.version}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'var(--accent-bg)',
                  padding: '1px 7px',
                  borderRadius: 4,
                  letterSpacing: '0.03em',
                }}>
                  {entry.codename}
                </span>
                <span style={{
                  fontSize: 11,
                  color: 'var(--text-faint)',
                  marginLeft: 'auto',
                }}>
                  {entry.date}
                </span>
              </div>

              {/* Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {entry.sections.map((section, si) => (
                  <div key={si}>
                    {/* Section label */}
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 8,
                    }}>
                      {section.heading}
                    </div>

                    {/* Feature items — card rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {section.items.map((item, ii) => (
                        <div
                          key={ii}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            background: 'var(--bg-input)',
                            border: '0.5px solid var(--border-main)',
                            borderRadius: 'var(--radius-card)',
                            padding: '8px 10px',
                            borderLeft: '2px solid var(--accent)',
                          }}
                        >
                          <span
                            className="icon icon-sm"
                            style={{
                              color: 'var(--accent)',
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            check_small
                          </span>
                          <span style={{
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            lineHeight: 1.5,
                          }}>
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '0.5px solid var(--border-main)',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-card)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
