// ── Shared Footer ──────────────────────────────────────────
// Appears at the bottom of every page.
// Version number and build credit.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_VERSION, APP_CODENAME } from '../config/version';
import useVersionCheck from '../hooks/useVersionCheck';
import WhatsNewModal from './WhatsNewModal';
import Tooltip from './ui/Tooltip';

const VERSION = `V${APP_VERSION} · ${APP_CODENAME}`;
const CREDIT  = 'Built by Someone at Saltlakes with an unreasonable amount of help from Claude';

export default function Footer() {
  const { updateAvailable, latestVersion, releaseUrl } = useVersionCheck();
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  return (
    <footer className="relative mt-auto">
      {/* Single tall top-fade — no hard line, no stepped scrim.
          One continuous gradient fades from transparent (well above the text)
          down to a soft tint of --bg-page, so the background art dissolves
          seamlessly into the footer. On plain-page routes (no art) the tint is
          the same colour as the page, so it stays invisible. */}
      <div className="relative bg-[linear-gradient(to_bottom,transparent_0%,color-mix(in_srgb,var(--bg-page)_62%,transparent)_100%)]">
        <div className="pt-[72px] px-6 pb-4 flex items-center justify-between flex-wrap gap-4">

          {/* Left Side: 2 Lines */}
          <div className="flex flex-col gap-1 font-sans text-xs text-(--text-faint)">
            <span>
              <Tooltip content="What's new in this version">
              <button
                type="button"
                onClick={() => setShowWhatsNew(true)}
                className="bg-transparent border-none p-0 m-0 [font:inherit] [font-size:inherit] text-(--text-muted) cursor-pointer underline decoration-dotted underline-offset-[3px]"
              >
                {VERSION}
              </button>
              </Tooltip>
              {updateAvailable && releaseUrl && (
                <Tooltip content={latestVersion ? `Update available — v${latestVersion}` : 'Update available'}>
                <a
                  href={releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--accent) text-[11px] no-underline ml-2"
                >
                  · update available{latestVersion ? ` (v${latestVersion})` : ''}
                </a>
                </Tooltip>
              )}
            </span>
            <span>{CREDIT}</span>
          </div>

          {/* Right Side: 2 Lines */}
          <div className="flex flex-col items-end gap-1 font-sans text-xs text-(--text-faint) text-right">
            <span>2026 · The Catoolu.</span>
            <div className="flex gap-3">
              <Link
                to="/about"
                className="text-(--text-faint) no-underline italic"
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; }}
              >
                About & Credits
              </Link>
              <Link
                to="/legal"
                className="text-(--text-faint) no-underline italic"
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; }}
              >
                Legal
              </Link>
            </div>
          </div>

        </div>
      </div>

      {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
    </footer>
  );
}
