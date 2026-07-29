import { useState, useEffect } from 'react';
import Tooltip from './ui/Tooltip';
import BetaBadge from './ui/BetaBadge';

// ── CreateOrImportModal ──────────────────────────────────────────────
// Animated chooser shown from the Investigators dashboard:
//   • Create  → navigate to the creation wizard (/create)
//   • Import  → trigger the existing JSON file picker
// Opens with a fade + rise, closes with a fade + fall, using the app's
// spring curve. Closes on backdrop click or the ✕.

const EXIT_MS = 200;

function Option({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3.5 w-full text-left py-4 px-[18px] rounded-xl border border-(--border-main) bg-(--bg-card) font-sans cursor-pointer [transition:border-color_0.12s_ease,background_0.12s_ease,transform_0.12s_ease]"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.background = 'var(--accent-bg)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-main)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <span className="icon text-[28px] text-(--accent) leading-none shrink-0">{icon}</span>
      <span>
        <span className="block text-[15px] font-semibold text-(--text-primary)">
          {title}
        </span>
        <span className="block text-[12.5px] text-(--text-muted) mt-[3px] leading-[1.5]">
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
      className={`fixed inset-0 z-[400] flex items-center justify-center p-6 bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px] [transition:opacity_200ms_ease] ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-[460px] bg-(--bg-card) border border-(--border-main) rounded-2xl shadow-(--shadow-dropdown) p-5 [transition:opacity_200ms_ease,transform_260ms_cubic-bezier(0.34,_1.56,_0.64,_1)] ${visible ? 'opacity-100 [transform:translateY(0)_scale(1)]' : 'opacity-0 [transform:translateY(16px)_scale(0.98)]'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-[19px] text-(--text-primary) m-0">
            Add an Investigator
          </h3>
          <Tooltip content="Close">
          <button
            onClick={onClose}
            className="btn-icon-ghost"
          >
            <span className="icon icon-md">close</span>
          </button>
          </Tooltip>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          <Option
            icon="person_add"
            title={<>Create New Investigator<BetaBadge className="ml-[0.4rem]" /></>}
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
