import { useState } from 'react';
import HandoutViewer from './HandoutViewer';

const typeIcon = (type) =>
  type === 'image' ? 'image' : type === 'bundle' ? 'stacks' : 'text_fields';

// ─── Inline image preview (Discord-style) ─────────────────────
function ImageShareCard({ handout, onView }) {
  return (
    <div
      onClick={onView}
      style={{
        position: 'relative', maxWidth: 260, cursor: 'pointer',
        borderRadius: 10, overflow: 'hidden',
        border: '0.5px solid #C0DD97',
        background: '#0a0a0a',
      }}
    >
      <img
        src={handout.content}
        alt={handout.title}
        style={{
          display: 'block', width: '100%',
          maxHeight: 200, objectFit: 'contain',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '18px 10px 7px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 11, color: '#fff', fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {handout.title}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', flexShrink: 0, marginLeft: 4 }}>
          open_in_full
        </span>
      </div>
    </div>
  );
}

// ─── Text / misc chip ──────────────────────────────────────────
function IndividualShareCard({ handout, onView }) {
  return (
    <div
      onClick={onView}
      style={{
        border: '0.5px solid #C0DD97', borderLeft: '2.5px solid #3B6D11',
        borderRadius: 8, padding: '6px 10px', background: '#fff',
        display: 'inline-flex', gap: 8, alignItems: 'center',
        maxWidth: 280, cursor: 'pointer',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 5, background: '#EAF3DE',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#3B6D11', flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          {typeIcon(handout.type)}
        </span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 500 }}>
          📎 Handout shared
        </div>
        <div style={{
          fontSize: 12, fontWeight: 500, color: '#1a0f05',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {handout.title}
        </div>
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#888780', flexShrink: 0 }}>
        visibility
      </span>
    </div>
  );
}

// ─── Bundle share card ─────────────────────────────────────────
function BundleShareCard({ handout, onView }) {
  const items   = handout.items || [];
  const preview = items.slice(0, 3);
  const n       = Math.max(preview.length, 1);
  const CARD_W  = 210;
  const CARD_H  = 140;
  const OFFSET  = 7;

  return (
    <div
      onClick={onView}
      style={{ cursor: 'pointer', maxWidth: 260, userSelect: 'none' }}
    >
      {/* Stacked content cards — i=0 is front (bottom-left), i=n-1 is back (top-right) */}
      <div style={{
        position: 'relative',
        width:    CARD_W + (n - 1) * OFFSET,
        height:   CARD_H + (n - 1) * OFFSET,
        marginBottom: 10,
      }}>
        {preview.map((item, i) => (
          <div
            key={item.uuid}
            style={{
              position:     'absolute',
              top:          (n - 1 - i) * OFFSET,
              left:         i * OFFSET,
              width:        CARD_W,
              height:       CARD_H,
              zIndex:       n - i,
              borderRadius: 10,
              overflow:     'hidden',
              border:       '0.5px solid #C0DD97',
              background:   item.type === 'image' ? '#0a0a0a' : '#EAF3DE',
              boxShadow:    '0 2px 6px rgba(0,0,0,0.10)',
            }}
          >
            {item.type === 'image' && item.content ? (
              <img
                src={item.content}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: 10,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 30, color: '#3B6D11' }}>
                  {typeIcon(item.type)}
                </span>
                <span style={{
                  fontSize: 10, color: '#3B6D11', textAlign: 'center',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', maxWidth: '90%',
                }}>
                  {item.title}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer: title + count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 500 }}>📦 Bundle shared</div>
          <div style={{
            fontSize: 13, fontWeight: 500, color: '#1a0f05',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {handout.title}
          </div>
        </div>
        <div style={{
          flexShrink: 0, fontSize: 10, background: '#EAF3DE',
          color: '#27500A', padding: '2px 6px', borderRadius: 4,
        }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

// ─── HandoutShareCard (feed entry) ────────────────────────────
export default function HandoutShareCard({ msg, isOwn, canDelete, onDelete }) {
  const [viewing,  setViewing]  = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handout, username, avatar_url, created_at } = msg;

  if (!handout) return null;

  const time = created_at
    ? new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(msg);
  };

  const initials = (username || '?').slice(0, 2).toUpperCase();

  return (
    <>
      <div
        style={{
          display:       'flex',
          flexDirection: isOwn ? 'row-reverse' : 'row',
          alignItems:    'flex-end',
          gap:           '8px',
          marginBottom:  8,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      >
        {/* Avatar — only for others, matches ChatBubble pattern */}
        {!isOwn && (
          <div style={{
            width:          32, height: 32, borderRadius: '50%',
            overflow:       'hidden', flexShrink: 0,
            background:     'var(--color-primary-light)',
            display:        'flex', alignItems: 'center', justifyContent: 'center',
            border:         '1px solid var(--border-main)',
          }}>
            {avatar_url ? (
              <img
                src={(import.meta.env.VITE_API_URL || '') + avatar_url}
                alt={username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                {initials}
              </span>
            )}
          </div>
        )}

        {/* Outer card box — mirrors chat bubble shape, flipped for own messages */}
        <div style={{
          display:      'inline-block',
          maxWidth:     300,
          background:   'var(--bg-card)',
          border:       '1px solid var(--border-main)',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding:      '8px 10px',
          position:     'relative',
        }}>
          {/* Header: username · time + three-dot */}
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         6,
            marginBottom: 8,
            fontFamily:  'var(--font-sans)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', flex: 1 }}>
              {isOwn
                ? <>You shared a handout{time ? <> · <span style={{ color: 'var(--text-faint)' }}>{time}</span></> : ''}</>
                : <><span style={{ color: 'var(--accent)', fontWeight: 600 }}>{username}</span>{' '}shared a handout{time ? ` · ${time}` : ''}</>
              }
            </span>

            {/* Always in flow when canDelete — visibility toggled so no layout shift on hover */}
            {canDelete && (
              <div style={{ position: 'relative', flexShrink: 0, visibility: (hovered || menuOpen) ? 'visible' : 'hidden' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(m => !m); }}
                  style={{
                    background:     'var(--bg-surface)',
                    border:         '1px solid var(--border-subtle)',
                    borderRadius:   6,
                    cursor:         'pointer',
                    color:          'var(--text-muted)',
                    padding:        '1px 3px',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                  }}
                  title="Message actions"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>more_vert</span>
                </button>

                {menuOpen && (
                  <div style={{
                    position:     'absolute',
                    top:          '100%',
                    left:         0,
                    marginTop:    4,
                    background:   'var(--bg-card)',
                    border:       '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    boxShadow:    'var(--shadow-dropdown)',
                    zIndex:       200,
                    minWidth:     120,
                    overflow:     'hidden',
                  }}>
                    <button
                      onClick={handleDelete}
                      style={{
                        display:    'flex',
                        alignItems: 'center',
                        gap:        6,
                        width:      '100%',
                        padding:    '8px 12px',
                        background: 'none',
                        border:     'none',
                        cursor:     'pointer',
                        color:      '#dc2626',
                        fontSize:   13,
                        fontFamily: 'var(--font-sans)',
                        textAlign:  'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card content */}
          {handout.type === 'bundle' ? (
            <BundleShareCard handout={handout} onView={() => setViewing(true)} />
          ) : handout.type === 'image' ? (
            <ImageShareCard handout={handout} onView={() => setViewing(true)} />
          ) : (
            <IndividualShareCard handout={handout} onView={() => setViewing(true)} />
          )}
        </div>
      </div>
      {viewing && (
        <HandoutViewer handout={handout} onClose={() => setViewing(false)} />
      )}
    </>
  );
}
