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
    <footer style={{
      position:   'relative',
      marginTop:  'auto',
    }}>
      {/* Single tall top-fade — no hard line, no stepped scrim.
          One continuous gradient fades from transparent (well above the text)
          down to a soft tint of --bg-page, so the background art dissolves
          seamlessly into the footer. On plain-page routes (no art) the tint is
          the same colour as the page, so it stays invisible. */}
      <div style={{
        position:   'relative',
        background: 'linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--bg-page) 62%, transparent) 100%)',
      }}>
        <div style={{
          padding:        '72px 24px 16px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            '16px',
        }}>

          {/* Left Side: 2 Lines */}
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           '4px',
            fontFamily:    'var(--font-sans)',
            fontSize:      '12px',
            color:         'var(--text-faint)',
          }}>
            <span>
              <Tooltip content="What's new in this version">
              <button
                type="button"
                onClick={() => setShowWhatsNew(true)}
                style={{
                  background:           'none',
                  border:               'none',
                  padding:              0,
                  margin:               0,
                  font:                 'inherit',
                  fontSize:             'inherit',
                  color:                'var(--text-muted)',
                  cursor:               'pointer',
                  textDecoration:       'underline',
                  textDecorationStyle:  'dotted',
                  textUnderlineOffset:  3,
                }}
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
                  style={{
                    color:          'var(--accent)',
                    fontSize:       '11px',
                    textDecoration: 'none',
                    marginLeft:     '8px',
                  }}
                >
                  · update available{latestVersion ? ` (v${latestVersion})` : ''}
                </a>
                </Tooltip>
              )}
            </span>
            <span>{CREDIT}</span>
          </div>

          {/* Right Side: 2 Lines */}
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'flex-end',
            gap:           '4px',
            fontFamily:    'var(--font-sans)',
            fontSize:      '12px',
            color:         'var(--text-faint)',
            textAlign:     'right',
          }}>
            <span>2026 · The Catoolu.</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                to="/about"
                style={{
                  color:          'var(--text-faint)',
                  textDecoration: 'none',
                  fontStyle:      'italic',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; }}
              >
                About & Credits
              </Link>
              <Link
                to="/legal"
                style={{
                  color:          'var(--text-faint)',
                  textDecoration: 'none',
                  fontStyle:      'italic',
                }}
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
