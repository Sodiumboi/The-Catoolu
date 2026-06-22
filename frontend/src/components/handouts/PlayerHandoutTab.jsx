import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

if (typeof document !== 'undefined' && !document.getElementById('php-styles')) {
  const s = document.createElement('style');
  s.id = 'php-styles';
  s.textContent = `@keyframes php-in { from { opacity: 0 } to { opacity: 1 } }`;
  document.head.appendChild(s);
}

const typeIcon = (type) =>
  type === 'image' ? 'image' : type === 'bundle' ? 'stacks' : 'text_fields';

const labelStyle = {
  fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  fontFamily: 'var(--font-sans)',
};

// ─── Preview portal (hold-to-peek) ──────────────────────────────
function PreviewPortal({ item }) {
  if (!item) return null;
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 400, padding: 24, animation: 'php-in 0.1s ease',
      pointerEvents: 'none',
    }}>
      {item.type === 'image' && item.content ? (
        <img src={item.content} alt={item.title} style={{
          maxWidth: '90vw', maxHeight: '85vh', borderRadius: 10,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }} />
      ) : (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 12, padding: 24,
          maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>
              {typeIcon(item.type)}
            </span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)' }}>
              {item.title}
            </span>
          </div>
          {item.content && (
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)',
              lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto', overscrollBehavior: 'contain',
            }}>
              {item.content}
            </div>
          )}
          {item.type === 'bundle' && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
              {(item.items || []).length} items
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── Sub-item mini card (inside expanded bundles) ────────────────
function SubMiniCard({ item, hold }) {
  return (
    <div {...hold} style={{
      borderRadius: 6, overflow: 'hidden', userSelect: 'none',
      border: '1px solid var(--border-main)', cursor: 'pointer',
    }}>
      <div style={{
        height: 38, overflow: 'hidden',
        background: item.type === 'image' ? 'var(--accent-bg)' : 'var(--bg-section-hd)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.type === 'image' && item.content ? (
          <img src={item.content} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--text-faint)', opacity: 0.6 }}>
            {typeIcon(item.type)}
          </span>
        )}
      </div>
      <div style={{
        padding: '2px 4px', fontSize: 9, fontFamily: 'var(--font-sans)',
        color: 'var(--text-muted)', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        background: 'var(--bg-card)',
      }}>
        {item.title}
      </div>
    </div>
  );
}

// ─── Grid item card ──────────────────────────────────────────────
function GridItemCard({ item, hold }) {
  return (
    <div {...hold} style={{
      borderRadius: 8, overflow: 'hidden', userSelect: 'none', cursor: 'pointer',
      border: '1px solid var(--border-main)', background: 'var(--bg-card)',
    }}>
      <div style={{
        height: 60, position: 'relative', overflow: 'hidden',
        background: item.type === 'image' ? 'var(--accent-bg)' : 'var(--bg-section-hd)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.type === 'image' && item.content ? (
          <img src={item.content} alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--text-faint)', opacity: 0.6 }}>
            {typeIcon(item.type)}
          </span>
        )}
      </div>
      <div style={{ padding: '4px 6px' }}>
        <div style={{
          fontSize: 10, fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item.title}</div>
      </div>
    </div>
  );
}

// ─── Grid bundle card ────────────────────────────────────────────
function GridBundleCard({ bundle, expanded, hold, makeHold }) {
  const items = bundle.items || [];
  return (
    <div style={{ position: 'relative', marginTop: 5, marginBottom: 2 }}>
      <div style={{
        position: 'absolute', top: -4, left: 3, right: 3, height: '100%',
        background: 'var(--accent-bg)', border: '0.5px solid var(--color-primary-mid)',
        borderRadius: 8, zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', top: -2, left: 1.5, right: 1.5, height: '100%',
        background: 'var(--accent-bg)', border: '0.5px solid var(--color-primary-mid)',
        borderRadius: 8, zIndex: 1,
      }} />
      <div {...hold} style={{
        position: 'relative', zIndex: 2, borderRadius: 8, overflow: 'hidden',
        border: `0.5px solid ${expanded ? 'var(--color-primary)' : 'var(--color-primary-mid)'}`,
        background: 'var(--bg-card)', cursor: 'pointer', userSelect: 'none',
        transition: 'border-color 0.1s',
      }}>
        {/* Thumbnail area */}
        <div style={{
          height: 60, background: 'var(--accent-bg)', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          overflow: 'hidden',
        }}>
          {items.length === 0 ? (
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--accent)', opacity: 0.4 }}>stacks</span>
          ) : items.slice(0, 3).map((it, i) => (
            it.type === 'image' && it.content ? (
              <img key={it.uuid} src={it.content} alt="" style={{
                width: i === 0 ? 34 : 22, height: i === 0 ? 34 : 22,
                borderRadius: 4, objectFit: 'cover', opacity: i === 0 ? 1 : 0.7,
                pointerEvents: 'none',
              }} />
            ) : (
              <span key={it.uuid} className="material-symbols-outlined" style={{
                fontSize: i === 0 ? 22 : 16, color: 'var(--accent)', opacity: i === 0 ? 1 : 0.6,
              }}>
                {typeIcon(it.type)}
              </span>
            )
          ))}
          <div style={{
            position: 'absolute', top: 4, left: 4,
            background: 'var(--color-primary)', color: '#fff',
            fontSize: 9, padding: '1px 5px', borderRadius: 10,
          }}>{items.length}</div>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
            fontSize: 13, color: 'var(--accent)', opacity: 0.8,
          }}>
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
        {/* Footer */}
        <div style={{ padding: '4px 6px' }}>
          <div style={{
            fontSize: 10, fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{bundle.title}</div>
        </div>
        {/* Expanded sub-items */}
        {expanded && items.length > 0 && (
          <div
            onPointerDown={e => e.stopPropagation()}
            style={{ padding: '6px 6px 8px', borderTop: '1px solid var(--border-subtle)' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: 4,
            }}>
              {items.map(sub => (
                <SubMiniCard key={sub.uuid} item={sub} hold={makeHold(sub)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── List item row ────────────────────────────────────────────────
function ListItemRow({ item, hold }) {
  return (
    <div {...hold} style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border-main)',
      borderRadius: 8, padding: '7px 10px',
      display: 'flex', alignItems: 'center', gap: 8,
      userSelect: 'none', cursor: 'pointer',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6, flexShrink: 0, overflow: 'hidden',
        background: item.type === 'image' ? 'var(--accent-bg)' : 'var(--bg-section-hd)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: item.type === 'image' ? 'var(--accent)' : 'var(--text-muted)',
      }}>
        {item.type === 'image' && item.content ? (
          <img src={item.content} alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{typeIcon(item.type)}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item.title}</div>
        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
          {item.type}
        </div>
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-faint)', flexShrink: 0 }}>
        visibility
      </span>
    </div>
  );
}

// ─── List bundle row ──────────────────────────────────────────────
function ListBundleRow({ bundle, expanded, hold, makeHold }) {
  const items = bundle.items || [];
  return (
    <div style={{ position: 'relative', marginTop: 5, marginBottom: 2 }}>
      <div style={{
        position: 'absolute', top: -4, left: 3, right: 3, height: '100%',
        background: 'var(--accent-bg)', border: '0.5px solid var(--color-primary-mid)',
        borderRadius: 8, zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', top: -2, left: 1.5, right: 1.5, height: '100%',
        background: 'var(--accent-bg)', border: '0.5px solid var(--color-primary-mid)',
        borderRadius: 8, zIndex: 1,
      }} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Bundle header row */}
        <div {...hold} style={{
          background: 'var(--bg-card)',
          border: `0.5px solid ${expanded ? 'var(--color-primary)' : 'var(--color-primary-mid)'}`,
          borderRadius: expanded && items.length > 0 ? '8px 8px 0 0' : 8,
          padding: '7px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', userSelect: 'none',
          transition: 'border-color 0.1s',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6, flexShrink: 0,
            background: 'var(--accent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>stacks</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{bundle.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-faint)', flexShrink: 0 }}>
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
        {/* Expanded sub-items */}
        {expanded && items.length > 0 && (
          <div
            onPointerDown={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '0.5px solid var(--color-primary)',
              borderTop: '1px solid var(--border-subtle)',
              borderRadius: '0 0 8px 8px',
              padding: '6px 10px 8px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            {items.map(sub => (
              <div
                key={sub.uuid}
                {...makeHold(sub)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 6px', borderRadius: 6,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-page)', userSelect: 'none', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 4, flexShrink: 0, overflow: 'hidden',
                  background: sub.type === 'image' ? 'var(--accent-bg)' : 'var(--bg-section-hd)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sub.type === 'image' && sub.content ? (
                    <img src={sub.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                      {typeIcon(sub.type)}
                    </span>
                  )}
                </div>
                <div style={{
                  flex: 1, fontSize: 11, fontFamily: 'var(--font-sans)',
                  color: 'var(--text-secondary)', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{sub.title}</div>
                <span style={{
                  fontSize: 9, color: 'var(--text-faint)',
                  fontFamily: 'var(--font-sans)', flexShrink: 0,
                }}>{sub.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PlayerHandoutTab ─────────────────────────────────────────────
export default function PlayerHandoutTab({ sharedHandouts, onView }) {
  const [view,     setView]     = useState(
    () => localStorage.getItem('handout-view') === 'grid' ? 'grid' : 'list'
  );
  const [expanded, setExpanded] = useState(new Set());
  const [preview,  setPreview]  = useState(null);
  const holdTimer = useRef(null);

  const changeView = (v) => {
    setView(v);
    localStorage.setItem('handout-view', v);
  };

  // Close preview on pointer release anywhere
  useEffect(() => {
    if (!preview) return;
    const close = () => setPreview(null);
    document.addEventListener('pointerup', close);
    return () => document.removeEventListener('pointerup', close);
  }, [preview]);

  // Hold = peek preview; quick tap = onTap.
  const makeHold = (item, onTap) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      holdTimer.current = setTimeout(() => {
        holdTimer.current = null;
        setPreview(item);
      }, 220);
    },
    onPointerUp: () => {
      if (holdTimer.current !== null) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
        onTap?.();
      }
    },
    onPointerLeave: () => {
      if (holdTimer.current !== null) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    },
  });

  const toggleExpand = (uuid) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(uuid)) next.delete(uuid); else next.add(uuid);
    return next;
  });

  const viewToggleBtn = (active) => ({
    padding: '3px 7px', border: 'none', borderRadius: 5,
    background: active ? 'var(--accent-bg)' : 'transparent',
    color: active ? 'var(--color-primary)' : 'var(--text-faint)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    transition: 'background 0.1s, color 0.1s',
  });

  // Player only ever sees handouts shared to them; dedupe the share
  // history down to unique handouts (latest share wins) to mirror the
  // keeper's library view.
  const uniqueMap = new Map();
  for (const s of sharedHandouts) {
    if (!uniqueMap.has(s.handout.uuid)) uniqueMap.set(s.handout.uuid, s.handout);
  }
  const handouts    = [...uniqueMap.values()];
  const bundles     = handouts.filter(h => h.type === 'bundle');
  const individual  = handouts.filter(h => h.type !== 'bundle');

  // Sub-item taps open the full viewer too
  const makeSubHold = (sub) => makeHold(sub, () => onView(sub));

  if (handouts.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>
          attach_file
        </span>
        <div style={{ fontSize: 12 }}>No handouts yet</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>The Keeper will share clues here</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* View toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ ...labelStyle }}>
          Received ({handouts.length} item{handouts.length !== 1 ? 's' : ''})
        </span>
        <div style={{
          display: 'inline-flex', gap: 2, padding: 2,
          border: '1px solid var(--border-main)', borderRadius: 7,
          background: 'var(--bg-card)',
        }}>
          <button style={viewToggleBtn(view === 'list')} onClick={() => changeView('list')}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>list</span>
          </button>
          <button style={viewToggleBtn(view === 'grid')} onClick={() => changeView('grid')}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>grid_view</span>
          </button>
        </div>
      </div>

      {/* Bundles */}
      {bundles.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 7 }}>Bundles</div>
          {view === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              alignItems: 'start',
              gap: 10,
            }}>
              {bundles.map(b => (
                <GridBundleCard
                  key={b.uuid}
                  bundle={b}
                  expanded={expanded.has(b.uuid)}
                  hold={makeHold(b, () => toggleExpand(b.uuid))}
                  makeHold={makeSubHold}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bundles.map(b => (
                <ListBundleRow
                  key={b.uuid}
                  bundle={b}
                  expanded={expanded.has(b.uuid)}
                  hold={makeHold(b, () => toggleExpand(b.uuid))}
                  makeHold={makeSubHold}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Individual handouts */}
      {individual.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 7 }}>Individual</div>
          {view === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 8,
            }}>
              {individual.map(item => (
                <GridItemCard
                  key={item.uuid}
                  item={item}
                  hold={makeHold(item, () => onView(item))}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {individual.map(item => (
                <ListItemRow
                  key={item.uuid}
                  item={item}
                  hold={makeHold(item, () => onView(item))}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <PreviewPortal item={preview} />
    </div>
  );
}
