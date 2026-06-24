import { useState } from 'react';
import HandoutViewer from './handouts/HandoutViewer';

export default function ChatBubble({ msg, isOwn, canDelete, onDelete }) {
  const [hovered,  setHovered]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);

  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  const displayName = msg.character_name
    ? msg.character_name.split(' ')[0]
    : msg.username;

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(msg);
  };

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems:    'flex-end',
        gap:           '8px',
        marginBottom:  '8px',
        position:      'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
    >
      {/* Portrait / avatar */}
      {!isOwn && (
        <div style={{
          width:         '32px',
          height:        '32px',
          borderRadius:  '50%',
          overflow:      'hidden',
          flexShrink:    0,
          background:    'var(--color-primary-light)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          border:        '1px solid var(--border-main)',
        }}>
          {msg.portrait ? (
            <img
              src={'data:image/jpeg;base64,' + msg.portrait}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : msg.avatar_url ? (
            <img
              src={(import.meta.env.VITE_API_URL || '') + msg.avatar_url}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize:   '11px',
              fontWeight: '600',
              color:      'var(--color-primary-dark)',
            }}>
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      )}

      <div style={{ maxWidth: '65%' }}>
        <div style={{
          background:   isOwn ? 'var(--color-primary)' : 'var(--bg-card)',
          color:        isOwn ? '#ffffff' : 'var(--text-primary)',
          border:       isOwn ? 'none' : '1px solid var(--border-main)',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding:      '8px 12px',
          fontSize:     '14px',
          lineHeight:   '1.5',
          wordBreak:    'break-word',
          whiteSpace:   'pre-wrap',
          fontFamily:   'var(--font-sans)',
        }}>
          {msg.image_urls?.length > 0 && (
            <div style={{
              display:             'grid',
              gridTemplateColumns: msg.image_urls.length === 1 ? '1fr' : 'repeat(2, 1fr)',
              gap:                 4,
              maxWidth:            260,
              marginBottom:        msg.content ? 6 : 0,
            }}>
              {msg.image_urls.map((url, i) => {
                const single = msg.image_urls.length === 1;
                return (
                  <img
                    key={i}
                    src={url}
                    alt={'Shared image ' + (i + 1)}
                    loading="lazy"
                    onClick={() => setViewingImage(url)}
                    style={{
                      width:        '100%',
                      ...(single
                        ? { maxHeight: 280, objectFit: 'contain' }
                        : { aspectRatio: '1 / 1', objectFit: 'cover' }),
                      borderRadius: 6,
                      cursor:       'pointer',
                      display:      'block',
                    }}
                  />
                );
              })}
            </div>
          )}
          {msg.content}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'flex-end',
            gap:            '5px',
            marginTop:      '4px',
          }}>
            {!isOwn && (
              <>
                <span style={{
                  fontSize:   '10px',
                  color:      'var(--accent)',
                  fontWeight: '600',
                }}>
                  {displayName}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>·</span>
              </>
            )}
            <span style={{
              fontSize: '10px',
              color:    isOwn ? 'rgba(255,255,255,0.6)' : 'var(--text-faint)',
            }}>
              {time}
            </span>
          </div>
        </div>
      </div>

      {/* Three-dot action button */}
      {canDelete && (hovered || menuOpen) && (
        <div style={{
          alignSelf:   'flex-end',
          flexShrink:  0,
          position:    'relative',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(m => !m); }}
            style={{
              background:    'var(--bg-card)',
              border:        '1px solid var(--border-subtle)',
              borderRadius:  6,
              cursor:        'pointer',
              color:         'var(--text-muted)',
              padding:       '2px 4px',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
            }}
            title="Message actions"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_vert</span>
          </button>

          {menuOpen && (
            <div style={{
              position:     'absolute',
              bottom:       '100%',
              right:        isOwn ? 0 : 'auto',
              left:         isOwn ? 'auto' : 0,
              marginBottom: 4,
              background: 'var(--bg-card)',
              border:     '1px solid var(--border-subtle)',
              borderRadius: 8,
              boxShadow:  'var(--shadow-dropdown)',
              zIndex:     200,
              minWidth:   120,
              overflow:   'hidden',
            }}>
              <button
                onClick={handleDelete}
                style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         6,
                  width:       '100%',
                  padding:     '8px 12px',
                  background:  'none',
                  border:      'none',
                  cursor:      'pointer',
                  color:       '#dc2626',
                  fontSize:    13,
                  fontFamily:  'var(--font-sans)',
                  textAlign:   'left',
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

      {/* Image lightbox — reuses the handout viewer engine for zoom/pan/download */}
      {viewingImage && (
        <HandoutViewer
          handout={{ type: 'image', content: viewingImage, title: 'Shared image' }}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
}
