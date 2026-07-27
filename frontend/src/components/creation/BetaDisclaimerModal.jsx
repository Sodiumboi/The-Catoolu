import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Seconds the acknowledgment button stays locked so people actually read the notice.
const COUNTDOWN_SECONDS = 5;

// Informational beta disclaimer shown on every entry to the character creation wizard.
// Purely presentational, single acknowledgment action — no persistence, so it re-shows
// on every mount of CharacterCreationPage by design. Replicates ConfirmDialog's structural
// conventions (portal into document.body, fixed backdrop z-1100 / dialog z-1101,
// confirm-fade-in + confirm-pop-in animations, Escape + backdrop dismiss, body-scroll-lock)
// but is an acknowledge-and-close notice, not a yes/no prompt.
//
// Props:
//   onDismiss  () => void   — called on the button, Escape, or backdrop click
const CHECKLIST = [
  'Derived stats (HP, MP, Sanity, Luck, Move Rate, Damage Bonus/Build) match what you’d expect from your final characteristics.',
  'The occupation skill points you spent add up to the total shown.',
  'Any “pick a specialty” choice shows a real skill name — not a placeholder or the word “any”.',
  'Combat skills (Fighting, Firearms) show sensible starting percentages, not obviously wrong ones.',
  'Your finished character’s skill list has no duplicate rows for the same skill.',
];

export default function BetaDisclaimerModal({ onDismiss }) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const locked = secondsLeft > 0;

  // Countdown: tick down once per second, stop (and clear) at 0 — never negative.
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // Escape key dismisses — blocked while the countdown is still running.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !locked) onDismiss?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onDismiss, locked]);

  // Body scroll lock while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const dialog = (
    <div
      onClick={locked ? undefined : onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        animation: 'confirm-fade-in 0.15s ease',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="beta-disclaimer-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 460,
          width: '92%',
          maxHeight: '86vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          boxShadow: 'var(--shadow-dropdown)',
          zIndex: 1101,
          animation: 'confirm-pop-in 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
      >
        <h2
          id="beta-disclaimer-title"
          className="font-serif text-(--text-primary) text-[1.05rem] mb-3"
        >
          Character Creation Engine — Beta
        </h2>

        <p className="font-sans text-[0.85rem] leading-relaxed text-(--text-secondary) mb-3">
          This character creation engine is still in beta. The character sheet it produces
          may not always build or display correctly.
        </p>
        <p className="font-sans text-[0.85rem] leading-relaxed text-(--text-secondary) mb-4">
          Before treating your finished investigator as final, cross-check them against{' '}
          <a
            href="https://dholeshouse.org"
            target="_blank"
            rel="noreferrer"
            className="text-(--accent) underline"
          >
            Dhole&apos;s House
          </a>{' '}
          for the same occupation and stats.
        </p>

        <p className="font-sans text-[0.72rem] uppercase tracking-[0.05em] text-(--text-muted) mb-2">
          Worth double-checking
        </p>
        <ul className="flex flex-col gap-2 mb-6">
          {CHECKLIST.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="icon icon-sm text-(--accent) shrink-0 mt-[0.1rem]">check_small</span>
              <span className="font-sans text-[0.82rem] leading-snug text-(--text-primary)">
                {item}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            disabled={locked}
            className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {locked ? `I Understand, Continue (${secondsLeft})` : 'I Understand, Continue'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
