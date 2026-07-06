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
      className="border border-(--border-main) overflow-hidden flex cursor-pointer select-none
                 bg-(--bg-card) shadow-(--shadow-card) rounded-(--radius-squircle)
                 min-h-[180px] max-h-[280px] [transition:box-shadow_0.15s_ease,transform_0.15s_ease]"
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
      <div className="flex-shrink-0 relative overflow-hidden w-[120px] self-stretch rounded-l-(--radius-squircle-inner)">
        {portrait_data ? (
          <img
            src={`data:image/jpeg;base64,${portrait_data}`}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover object-top block"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-(--bg-card) border-r border-(--border-main)">
            <span className="text-[2rem] opacity-30">🕵</span>
            <span className="text-xs text-center px-2 text-[var(--text-faint,_var(--text-faint))]">
              No Portrait
            </span>
          </div>
        )}
        {/* Right-edge fade */}
        <div className="absolute inset-y-0 right-0 w-6 pointer-events-none bg-[linear-gradient(to_right,_transparent,_var(--bg-card,_var(--bg-card)))]" />
      </div>

      {/* ── RIGHT: Info ── */}
      <div className="flex flex-col flex-1 p-4 min-w-0">

        {/* Name & Occupation */}
        <div className="mb-3 flex-1">
          <h3 className="text-lg font-bold leading-tight truncate text-[var(--text-primary,_var(--text-primary))] [font-family:Georgia,_serif]">
            {name}
          </h3>
          <p className="text-sm truncate mt-0.5 text-[var(--accent,_var(--accent))]">
            {occupation || 'Unknown Occupation'}
          </p>
          <p className="text-xs mt-0.5 text-[var(--text-muted,_var(--text-muted))]">
            {game_type}
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex gap-2 mb-3">
          <StatPill label="SAN" value={sanity} color="var(--success)" />
          <StatPill label="HP"  value={hp}     color="#f87171" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-(--border-main) gap-3">
          <span className="text-xs text-(--text-faint) shrink-0">
            {lastUpdated}
          </span>
          <ActionButton
            label="Delete"
            onClick={() => onDelete(uuid, name)}
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
      /* background + border are data-driven (stat color prop) — stay inline */
      style={{
        background: `${color}12`,
        border: `1.5px solid ${color}`,
      }}
    >
      <span className="text-[var(--text-muted,_var(--text-muted))]">{label}</span>
      {/* color is data-driven (stat color prop) — stays inline */}
      <span className="font-bold" style={{ color }}>{value ?? '?'}</span>
    </div>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      className="btn-danger-soft btn-danger-sm"
    >
      <span className="icon icon-sm">delete</span>
    </button>
  );
}