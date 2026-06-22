// ── Shared Footer ──────────────────────────────────────────
// Appears at the bottom of every page.
// Version number and build credit.

import { Link } from 'react-router-dom';
import { APP_VERSION, APP_CODENAME } from '../config/version';
import useVersionCheck from '../hooks/useVersionCheck';

const VERSION = `V${APP_VERSION} · ${APP_CODENAME}`;
const CREDIT  = 'Built by Someone at Saltlakes with an unreasonable amount of help from Claude';

export default function Footer() {
  const { updateAvailable, latestVersion, releaseUrl } = useVersionCheck();

  return (
    <footer style={{
      borderTop: '1px solid var(--border-main)',
      marginTop: 'auto',
    }}>
      <div style={{
        padding:        '16px 24px',
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
            {VERSION}
            {updateAvailable && releaseUrl && (
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={latestVersion ? `Update available — v${latestVersion}` : 'Update available'}
                style={{
                  color:          'var(--accent)',
                  fontSize:       '11px',
                  textDecoration: 'none',
                  marginLeft:     '8px',
                }}
              >
                · update available{latestVersion ? ` (v${latestVersion})` : ''}
              </a>
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
    </footer>
  );
}