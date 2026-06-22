import { useState } from 'react';
import { loadWindowState, saveWindowState } from './notesWindowState';
import NoteCard from './NoteCard';

export default function NoteCollection({ notes, loading, contextTagType, contextTag, onSelectNote, onNewNote }) {
  const [search,   setSearch]   = useState('');
  const [viewMode, setViewMode] = useState(() => loadWindowState().viewMode || 'grid');

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const toggleView = (mode) => {
    setViewMode(mode);
    saveWindowState({ viewMode: mode });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
        padding:      '8px 10px',
        borderBottom: '1px solid var(--notes-border)',
        flexShrink:   0,
      }}>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {['grid', 'list'].map(mode => (
            <button
              key={mode}
              onClick={() => toggleView(mode)}
              title={mode === 'grid' ? 'Grid view' : 'List view'}
              style={{
                padding:    '4px 7px',
                borderRadius: '5px',
                border:     'none',
                background:  viewMode === mode ? 'var(--accent-bg)' : 'transparent',
                color:       viewMode === mode ? 'var(--accent)' : 'var(--text-faint)',
                cursor:      'pointer',
                fontSize:    '14px',
                lineHeight:  1,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', display: 'block' }}>
                {mode === 'grid' ? 'grid_view' : 'view_list'}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ flex: 1, position: 'relative' }}>
          <span className="material-symbols-outlined" style={{
            position:   'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)',
            fontSize:   '14px', color: 'var(--text-faint)', pointerEvents: 'none',
          }}>search</span>
          <input
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width:       '100%',
              padding:     '5px 8px 5px 26px',
              borderRadius: '6px',
              border:      '1px solid var(--notes-border)',
              background:  'var(--bg-input)',
              color:       'var(--text-primary)',
              fontFamily:  'var(--font-sans)',
              fontSize:    '12px',
              outline:     'none',
              boxSizing:   'border-box',
            }}
          />
        </div>

        {/* New note */}
        <button
          onClick={onNewNote}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '4px',
            padding:      '5px 10px',
            borderRadius: '6px',
            border:       'none',
            background:   'var(--accent)',
            color:        '#fff',
            fontFamily:   'var(--font-sans)',
            fontSize:     '12px',
            fontWeight:   600,
            cursor:       'pointer',
            whiteSpace:   'nowrap',
            flexShrink:   0,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
          New
        </button>
      </div>

      {/* Notes list/grid */}
      <div style={{
        flex:       1,
        overflowY:  'auto',
        overscrollBehavior: 'contain',
        padding:    '10px',
        display:    viewMode === 'grid' ? 'grid' : 'flex',
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(180px, 1fr))' : undefined,
        flexDirection: viewMode === 'list' ? 'column' : undefined,
        gap:        '8px',
        alignContent: 'start',
      }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px', padding: '24px 0' }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            gridColumn:     '1/-1',
            textAlign:      'center',
            color:          'var(--text-faint)',
            fontSize:       '13px',
            padding:        '32px 0',
            fontFamily:     'var(--font-sans)',
            fontStyle:      'italic',
          }}>
            {search ? 'No notes match your search.' : 'No notes yet — create one above.'}
          </div>
        ) : filtered.map(note => (
          <NoteCard key={note.uuid} note={note} onClick={() => onSelectNote(note.uuid)} />
        ))}
      </div>
    </div>
  );
}
