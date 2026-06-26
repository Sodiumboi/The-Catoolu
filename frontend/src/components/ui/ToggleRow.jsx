// ── Toggle switch row ─────────────────────────────────────────
// Shared labeled on/off switch. Extracted from RoomSidebar so both the
// room settings panel and the NavBar preferences panel use one source.
export default function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            '10px',
      padding:        '8px 0',
      borderBottom:   '1px solid var(--border-main)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize:   '13px',
          fontWeight: '500',
          color:      'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
        }}>
          {label}
        </div>
        <div style={{
          fontSize:   '11px',
          color:      'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.4,
        }}>
          {desc}
        </div>
      </div>

      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        style={{
          flexShrink:   0,
          width:        '38px',
          height:       '22px',
          borderRadius: '999px',
          border:       'none',
          cursor:       'pointer',
          padding:      0,
          position:     'relative',
          background:   checked ? 'var(--accent)' : 'var(--border-input)',
          transition:   'background 0.15s ease',
        }}
      >
        <span style={{
          position:     'absolute',
          top:          '2px',
          left:         checked ? '18px' : '2px',
          width:        '18px',
          height:       '18px',
          borderRadius: '50%',
          background:   '#fff',
          boxShadow:    '0 1px 2px rgba(0,0,0,0.25)',
          transition:   'left 0.15s ease',
        }} />
      </button>
    </div>
  );
}
