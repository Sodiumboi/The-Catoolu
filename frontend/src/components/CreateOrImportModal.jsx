import { useState, useEffect } from 'react';

// ── CreateOrImportModal ──────────────────────────────────────────────
// Animated chooser shown from the Investigators dashboard:
//   • Create  → navigate to the creation wizard (/create)
//   • Import  → trigger the existing JSON file picker
// Opens with a fade + rise, closes with a fade + fall, using the app's
// spring curve. Closes on backdrop click or the ✕.

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const EXIT_MS = 200;

function Option({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '14px',
        width: '100%', textAlign: 'left',
        padding: '16px 18px', borderRadius: '12px',
        border: '1px solid var(--border-main)',
        background: 'var(--bg-card)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        transition: 'border-color 0.12s ease, background 0.12s ease, transform 0.12s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.background = 'var(--accent-bg)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-main)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <span className="icon" style={{ fontSize: '28px', color: 'var(--accent)', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <span>
        <span style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </span>
        <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.5 }}>
          {subtitle}
        </span>
      </span>
    </button>
  );
}

export default function CreateOrImportModal({ open, onClose, onCreate, onImport }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- mount/unmount drives the enter/exit animation */
  useEffect(() => {
    if (open) {
      setMounted(true);
      // next frame → trigger the enter transition
      const r = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(r);
    }
    if (mounted) {
      setVisible(false);                         // play exit transition
      const t = setTimeout(() => setMounted(false), EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!mounted) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        opacity: visible ? 1 : 0,
        transition: `opacity ${EXIT_MS}ms ease`,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '460px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-dropdown)',
          padding: '20px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
          transition: `opacity ${EXIT_MS}ms ease, transform 260ms ${SPRING}`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{
            fontFamily: 'var(--font-serif)', fontSize: '19px',
            color: 'var(--text-primary)', margin: 0,
          }}>
            Add an Investigator
          </h3>
          <button
            onClick={onClose}
            title="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', lineHeight: 1 }}
          >
            <span className="icon icon-md">close</span>
          </button>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Option
            icon="person_add"
            title="Create New Investigator"
            subtitle="Start from scratch with the character creation wizard"
            onClick={onCreate}
          />
          <Option
            icon="upload_file"
            title="Import from Dhole's House"
            subtitle="Import an existing character from a JSON file"
            onClick={onImport}
          />
        </div>
      </div>
    </div>
  );
}
