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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {rows.map((value, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="text"
            value={value}
            placeholder="Item description…"
            onChange={e => updateRow(idx, e.target.value)}
            style={{
              flex:         1,
              minWidth:     0,
              padding:      '5px 8px',
              borderRadius: '6px',
              border:       '1px solid var(--border-input)',
              background:   'var(--bg-input)',
              color:        'var(--text-primary)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '11px',
              outline:      'none',
              boxSizing:    'border-box',
            }}
          />
          <button
            onClick={() => deleteRow(idx)}
            title="Remove item"
            style={{
              flexShrink:   0,
              width:        '28px',
              height:       '28px',
              borderRadius: '6px',
              border:       '1px solid var(--border-main)',
              background:   'var(--bg-input)',
              color:        'var(--text-muted)',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              transition:   'all 0.1s ease',
            }}
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
        <div style={{
          fontSize:  '11px',
          color:     'var(--text-faint)',
          fontStyle: 'italic',
          padding:   '2px 4px',
        }}>
          No possessions yet.
        </div>
      )}

      <button
        onClick={addRow}
        style={{
          marginTop:    '2px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          gap:          '4px',
          padding:      '5px 8px',
          borderRadius: '6px',
          border:       '1px dashed var(--border-main)',
          background:   'var(--bg-input)',
          color:        'var(--accent)',
          fontFamily:   'var(--font-sans)',
          fontSize:     '11px',
          fontWeight:   '600',
          cursor:       'pointer',
          transition:   'all 0.1s ease',
        }}
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
