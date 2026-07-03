// ── StatBox ──────────────────────────────────────────────────────────
// One characteristic as a card: label / large value / half+fifth row.
//   editable → transparent underline input in the value slot
//   compact  → smaller sizing for the keeper read-only panel

export default function StatBox({ label, sublabel, value, editable = false, onChange, compact = false }) {
  const num   = parseInt(value) || 0;
  const half  = Math.floor(num / 2);
  const fifth = Math.floor(num / 5);

  return (
    <div className={`flex flex-col items-center border border-(--border-main) bg-(--bg-input) ${compact ? 'gap-0.75 py-1.5 px-2 rounded-lg min-w-13.5' : 'gap-1 py-2 px-2.5 rounded-[10px] min-w-16'}`}>
      {label && (
        <div className="text-center leading-none">
          <span className={`block font-bold text-(--accent) font-sans uppercase tracking-wider ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {label}
          </span>
          <span className={`block font-sans text-(--text-faint) uppercase tracking-[0.04em] mt-px ${sublabel ? 'visible' : 'invisible'} ${compact ? 'text-[7px]' : 'text-[8px]'}`}>
            {sublabel || 'X'}
          </span>
        </div>
      )}

      {editable ? (
        <input
          type="number" min="1" max="99"
          value={value || ''}
          onChange={e => onChange && onChange(e.target.value)}
          className={`outline-none! font-bold font-serif text-center bg-transparent border-none border-b-2 border-(--border-input) text-(--text-primary) p-0 [-moz-appearance:textfield] ${compact ? 'w-10.5 h-8 text-lg' : 'w-13 h-10 text-[22px]'}`}
          onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
          onBlur={e  => e.target.style.borderBottomColor = 'var(--border-input)'}
        />
      ) : (
        <div className={`font-bold font-serif text-(--text-primary) leading-none ${compact ? 'text-lg pt-1 px-0 pb-0.5' : 'text-[22px] pt-1.5 px-0 pb-1'}`}>
          {num}
        </div>
      )}

      <div className="flex gap-1.5">
        <span className={`text-(--text-faint) font-sans ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {half}
        </span>
        <span className={`text-(--text-faint) font-sans ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {fifth}
        </span>
      </div>
    </div>
  );
}
