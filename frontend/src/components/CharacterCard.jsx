export default function CharacterCard({ character, onDelete, onOpen }) {
  const {
    uuid, name, occupation, game_type,
    sanity, hp, updated_at, portrait_data
  } = character;

  const lastUpdated = new Date(updated_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div
      onClick={() => onOpen(uuid)}
      className="border overflow-hidden transition-all duration-300
                 flex cursor-pointer select-none"
      style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border-main)',
        boxShadow:    'var(--shadow-card)',
        borderRadius: 'var(--radius-squircle)',
        minHeight:    '180px',
        maxHeight:    '280px',
        transition:   'box-shadow 0.15s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-dropdown)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >

      {/* ── LEFT: Portrait ── */}
      <div className="flex-shrink-0 relative overflow-hidden" style={{ width: '120px', alignSelf: 'stretch', borderRadius: 'var(--radius-squircle-inner) 0 0 var(--radius-squircle-inner)' }}>
        {portrait_data ? (
          <img
            src={`data:image/jpeg;base64,${portrait_data}`}
            alt={name}
            style={{
              position:   'absolute',
              inset:      0,
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              objectPosition: 'top',
              display:    'block',
            }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{
              background:  'var(--bg-card)',
              borderRight: '1px solid var(--border-main)',
            }}
          >
            <span style={{ fontSize: '2rem', opacity: 0.3 }}>🕵</span>
            <span className="text-xs text-center px-2"
                  style={{ color: 'var(--text-faint, var(--text-faint))' }}>
              No Portrait
            </span>
          </div>
        )}
        {/* Right-edge fade */}
        <div
          className="absolute inset-y-0 right-0 w-6 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, transparent, var(--bg-card, var(--bg-card)))',
          }}
        />
      </div>

      {/* ── RIGHT: Info ── */}
      <div className="flex flex-col flex-1 p-4 min-w-0">

        {/* Name & Occupation */}
        <div className="mb-3 flex-1">
          <h3
            className="text-lg font-bold leading-tight truncate"
            style={{ color: 'var(--text-primary, var(--text-primary))', fontFamily: 'Georgia, serif' }}
          >
            {name}
          </h3>
          <p className="text-sm truncate mt-0.5" style={{ color: 'var(--accent, var(--accent))' }}>
            {occupation || 'Unknown Occupation'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted, var(--text-muted))' }}>
            {game_type}
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex gap-2 mb-3">
          <StatPill label="SAN" value={sanity} color="var(--success)" />
          <StatPill label="HP"  value={hp}     color="#f87171" />
        </div>

        {/* Footer */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            paddingTop:     '10px',
            marginTop:      '8px',
            borderTop:      '1px solid var(--border-main)',
            gap:            '12px',
          }}
        >
          <span style={{
            fontSize:   '12px',
            color:      'var(--text-faint)',
            flexShrink: 0,
          }}>
            {lastUpdated}
          </span>
          <ActionButton
            label="Delete"
            onClick={() => onDelete(uuid, name)}
            color="#E24B4A"
          />
        </div>
      </div>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────

function StatPill({ label, value, color }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
      style={{
        background: `${color}12`,
        border: `1.5px solid ${color}`,
      }}
    >
      <span style={{ color: 'var(--text-muted, var(--text-muted))' }}>{label}</span>
      <span style={{ color, fontWeight: 'bold' }}>{value ?? '?'}</span>
    </div>
  );
}

function ActionButton({ label, onClick, color }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="text-xs font-medium transition-all duration-150"
      style={{
        background:   'transparent',
        color:         color,
        border:        `1px solid ${color}`,
        borderRadius:  '6px',
        padding:       '2px 10px',
        cursor:        'pointer',
        lineHeight:    '1.6',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = color;
        e.currentTarget.style.color      = '#ffffff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color      = color;
      }}
    >
      {label}
    </button>
  );
}