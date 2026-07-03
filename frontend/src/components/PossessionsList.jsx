import { useState } from 'react';

// ── Possessions & Equipment list ───────────────────────────────
// Editable gear list. Items are { description: string }. Local state
// mirrors the incoming items so typing stays smooth; every commit pushes
// the full new array up via onChange (parent persists + optimistically
// updates canonical state, which flows back down as new `items`).
export default function PossessionsList({ items, onChange }) {
  // Mirror seeded from props; re-sync when the incoming array identity changes
  // (e.g. parent optimistic update or keeper-side refetch). Uses the React
  // "adjust state during render" pattern: track the last items identity in
  // state and only adopt incoming values when it differs from local rows,
  // so in-progress keystrokes on unrelated re-renders aren't clobbered.
  const [rows, setRows] = useState(() => items.map(it => it?.description ?? ''));
  const [prevItems, setPrevItems] = useState(items);
  if (prevItems !== items) {
    setPrevItems(items);
    const incoming = items.map(it => it?.description ?? '');
    if (incoming.length !== rows.length || incoming.some((v, i) => v !== rows[i])) {
      setRows(incoming);
    }
  }

  const commit = (next) => {
    setRows(next);
    onChange(next.map(description => ({ description })));
  };

  const updateRow = (idx, value) => {
    const next = rows.slice();
    next[idx] = value;
    commit(next);
  };

  const deleteRow = (idx) => {
    commit(rows.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    commit([...rows, '']);
  };

  return (
    <div className="flex flex-col gap-1">
      {rows.map((value, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <input
            type="text"
            value={value}
            placeholder="Item description…"
            onChange={e => updateRow(idx, e.target.value)}
            className="flex-1 min-w-0 py-1.25 px-2 rounded-md border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-[11px] outline-none! box-border input-focus-glow focus:border-(--border-focus)"
          />
          <button
            onClick={() => deleteRow(idx)}
            title="Remove item"
            className="shrink-0 w-7 h-7 rounded-md border border-(--border-main) bg-(--bg-input) text-(--text-muted) cursor-pointer flex items-center justify-center [transition:all_0.1s]"
            onMouseEnter={e => {
              e.currentTarget.style.background  = 'var(--danger-bg)';
              e.currentTarget.style.borderColor = 'var(--danger)';
              e.currentTarget.style.color       = 'var(--danger)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'var(--bg-input)';
              e.currentTarget.style.borderColor = 'var(--border-main)';
              e.currentTarget.style.color       = 'var(--text-muted)';
            }}
          >
            <span className="icon icon-sm">delete</span>
          </button>
        </div>
      ))}

      {rows.length === 0 && (
        <div className="text-[11px] text-(--text-faint) italic py-0.5 px-1">
          No possessions yet.
        </div>
      )}

      <button
        onClick={addRow}
        className="mt-0.5 flex items-center justify-center gap-1 py-1.25 px-2 rounded-md border border-dashed border-(--border-main) bg-(--bg-input) text-(--accent) font-sans text-[11px] font-semibold cursor-pointer [transition:all_0.1s]"
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'var(--accent-bg)';
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'var(--bg-input)';
          e.currentTarget.style.borderColor = 'var(--border-main)';
        }}
      >
        <span className="icon icon-sm">add</span>
        Add item
      </button>
    </div>
  );
}
