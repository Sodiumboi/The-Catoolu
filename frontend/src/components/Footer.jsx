// ── Shared Footer ──────────────────────────────────────────
// Appears at the bottom of every page.
// Version number and build credit.

const VERSION = 'V1.5 · Nyarlathotep - Update F: Candlekeep.';
const CREDIT  = 'Built by Someone at Saltlakes with an unreasonable amount of help from Claude';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-main)',
      marginTop: 'auto',
    }}>
      <div style={{
        padding:        '16px 24px', // ระยะห่างจากขอบจอ 24px ซ้าย-ขวา
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
          <span>{VERSION}</span>
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
          <span style={{ fontStyle: 'italic' }}>
            Ph'nglui mglw'nafh 🐙
          </span>
        </div>

      </div>
    </footer>
  );
}