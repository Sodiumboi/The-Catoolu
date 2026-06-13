function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TAG_COLOURS = {
  character: { bg: 'var(--accent-bg)',    color: 'var(--accent)' },
  session:   { bg: 'rgba(139,90,20,0.10)', color: 'var(--warning)' },
  general:   { bg: 'var(--bg-section-hd)', color: 'var(--text-muted)' },
};

export default function NoteCard({ note, onClick }) {
  const tagStyle = TAG_COLOURS[note.tag_type] || TAG_COLOURS.general;

  return (
    <button
      onClick={() => onClick(note)}
      style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'flex-start',
        gap:           '6px',
        width:         '100%',
        padding:       '10px 12px',
        background:    'var(--notes-bg)',
        border:        '1px solid var(--notes-border)',
        borderRadius:  '8px',
        cursor:        'pointer',
        textAlign:     'left',
        transition:    'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--notes-border)'}
    >
      <span style={{
        fontFamily:   'var(--font-serif)',
        fontSize:     '14px',
        color:        'var(--text-primary)',
        fontWeight:   400,
        lineHeight:   1.3,
        wordBreak:    'break-word',
      }}>
        {note.title || 'Untitled Note'}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
          {timeAgo(note.updated_at)}
        </span>
        {note.tag && (
          <span style={{
            fontSize:     '10px',
            padding:      '2px 7px',
            borderRadius: '20px',
            fontFamily:   'var(--font-sans)',
            fontWeight:   600,
            background:   tagStyle.bg,
            color:        tagStyle.color,
          }}>
            {note.tag}
          </span>
        )}
      </div>
    </button>
  );
}
