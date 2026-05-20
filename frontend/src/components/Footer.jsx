// ── Shared Footer ──────────────────────────────────────────
// Appears at the bottom of every page.
// Version number and build credit.

const VERSION = 'V1.2 · Hypnos';
const CREDIT  = 'Built by Someone at Saltlakes with an unreasonable amount of help from Claude';

export default function Footer() {
  return (
    <footer style={{
      borderTop:  '1px solid var(--border-main)',
      padding:    '16px 24px',
      marginTop:  'auto',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap:   'wrap',
      gap:        '8px',
    }}>
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize:   '12px',
        color:      'var(--text-faint)',
      }}>
        {VERSION} · {CREDIT}
      </span>

      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize:   '12px',
        color:      'var(--text-faint)',
        fontStyle:  'italic',
      }}>
        Ph'nglui mglw'nafh 🐙
      </span>
    </footer>
  );
}