import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import apiClient from '../../api/client';
import CustomDropdown from '../ui/CustomDropdown';

if (typeof document !== 'undefined' && !document.getElementById('khp-styles')) {
  const s = document.createElement('style');
  s.id = 'khp-styles';
  s.textContent = `@keyframes khp-in { from { opacity: 0 } to { opacity: 1 } }`;
  document.head.appendChild(s);
}

const typeIcon = (type) =>
  type === 'image' ? 'image' : type === 'bundle' ? 'stacks' : 'text_fields';

const labelStyle = {
  fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  fontFamily: 'var(--font-sans)',
};

const shareStyle = {
  fontSize: 10, color: 'var(--accent)', fontWeight: 500,
  padding: '2px 7px', border: '0.5px solid var(--color-primary-mid)',
  borderRadius: 5, background: 'var(--accent-bg)',
  whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)',
  cursor: 'pointer', flexShrink: 0,
};

// ─── Preview portal ─────────────────────────────────────────────
function PreviewPortal({ item }) {
  if (!item) return null;
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 400, padding: 24, animation: 'khp-in 0.1s ease',
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
      border: '1px solid var(--border-main)', cursor: 'default',
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
function GridItemCard({ item, sharing, isShared, onShare, hold }) {
  return (
    <div {...hold} style={{
      borderRadius: 8, overflow: 'hidden', userSelect: 'none',
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
        {isShared && (
          <div style={{
            position: 'absolute', bottom: 3, right: 3,
            background: 'var(--color-primary)', borderRadius: 3,
            padding: '1px 4px', fontSize: 9, color: '#fff',
          }}>shared</div>
        )}
      </div>
      <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{
          flex: 1, fontSize: 10, fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item.title}</div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onShare}
          disabled={sharing}
          style={{ ...shareStyle, padding: '1px 5px', opacity: sharing ? 0.7 : 1 }}
        >
          {sharing ? '…' : 'Share'}
        </button>
      </div>
    </div>
  );
}

// ─── Grid bundle card ────────────────────────────────────────────
function GridBundleCard({ bundle, sharing, isShared, onShare, expanded, hold, makeHold }) {
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
          {isShared && (
            <div style={{
              position: 'absolute', bottom: 3, right: 3,
              background: 'var(--color-primary)', borderRadius: 3,
              padding: '1px 4px', fontSize: 9, color: '#fff',
            }}>shared</div>
          )}
          <span className="material-symbols-outlined" style={{
            position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
            fontSize: 13, color: 'var(--accent)', opacity: 0.8,
          }}>
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
        {/* Footer */}
        <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            flex: 1, fontSize: 10, fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{bundle.title}</div>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onShare}
            disabled={sharing}
            style={{ ...shareStyle, padding: '1px 5px', opacity: sharing ? 0.7 : 1 }}
          >
            {sharing ? '…' : 'Share'}
          </button>
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
function ListItemRow({ item, sharing, isShared, onShare, hold }) {
  return (
    <div {...hold} style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border-main)',
      borderRadius: 8, padding: '7px 10px',
      display: 'flex', alignItems: 'center', gap: 8,
      userSelect: 'none',
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
        <div style={{ fontSize: 10, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 5 }}>
          {item.type}
          {isShared && (
            <span style={{
              background: 'var(--color-primary)', color: '#fff',
              borderRadius: 3, padding: '1px 4px', fontSize: 9,
            }}>shared</span>
          )}
        </div>
      </div>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onShare}
        disabled={sharing}
        style={{ ...shareStyle, cursor: sharing ? 'default' : 'pointer', opacity: sharing ? 0.7 : 1 }}
      >
        {sharing ? '…' : 'Share'}
      </button>
    </div>
  );
}

// ─── List bundle row ──────────────────────────────────────────────
function ListBundleRow({ bundle, sharing, isShared, onShare, expanded, hold, makeHold }) {
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
            <div style={{ fontSize: 10, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
              {isShared && (
                <span style={{
                  background: 'var(--color-primary)', color: '#fff',
                  borderRadius: 3, padding: '1px 4px', fontSize: 9,
                }}>shared</span>
              )}
            </div>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-faint)', flexShrink: 0 }}>
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onShare}
            disabled={sharing}
            style={{ ...shareStyle, cursor: sharing ? 'default' : 'pointer', opacity: sharing ? 0.7 : 1 }}
          >
            {sharing ? '…' : 'Share'}
          </button>
        </div>
        {/* Expanded sub-items */}
        {expanded && items.length > 0 && (
          <div
            onPointerDown={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: `0.5px solid ${expanded ? 'var(--color-primary)' : 'var(--color-primary-mid)'}`,
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
                  background: 'var(--bg-page)', userSelect: 'none',
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

// ─── KeeperHandoutPanel ───────────────────────────────────────────
export default function KeeperHandoutPanel({ campaignUuid }) {
  const navigate = useNavigate();
  const [handouts,    setHandouts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sharing,     setSharing]     = useState(null);
  const [sharedUuids, setSharedUuids] = useState([]);
  const [view,        setView]        = useState(
    () => localStorage.getItem('handout-view') === 'grid' ? 'grid' : 'list'
  ); // 'list' | 'grid'
  const [expanded,    setExpanded]    = useState(new Set());
  const [preview,     setPreview]     = useState(null);
  const [sortBy,      setSortBy]      = useState(
    () => localStorage.getItem('handout-panel-sort') || 'date-desc'
  );
  const holdTimer = useRef(null);

  const applySortFn = (a, b) => {
    switch (sortBy) {
      case 'date-asc':    return a.created_at > b.created_at ? 1 : -1;
      case 'name-asc':    return a.title.localeCompare(b.title);
      case 'name-desc':   return b.title.localeCompare(a.title);
      case 'type-images': return (a.type === 'image' ? -1 : 1) - (b.type === 'image' ? -1 : 1);
      case 'type-text':   return (a.type === 'text' ? -1 : 1) - (b.type === 'text' ? -1 : 1);
      default:            return b.created_at > a.created_at ? 1 : -1; // date-desc
    }
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    localStorage.setItem('handout-panel-sort', val);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [libRes, sharedRes] = await Promise.all([
          apiClient.get(`/campaigns/${campaignUuid}/handouts`),
          apiClient.get(`/campaigns/${campaignUuid}/handouts/shared`),
        ]);
        setHandouts(libRes.data);
        setSharedUuids(sharedRes.data.map(s => s.handout.uuid));
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [campaignUuid]);

  // Close preview on pointer release anywhere
  useEffect(() => {
    if (!preview) return;
    const close = () => setPreview(null);
    document.addEventListener('pointerup', close);
    return () => document.removeEventListener('pointerup', close);
  }, [preview]);

  // Returns hold handlers for an item. onTap fires on quick release.
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

  const changeView = (v) => {
    setView(v);
    localStorage.setItem('handout-view', v);
  };

  const handleShare = async (handoutUuid) => {
    setSharing(handoutUuid);
    try {
      await apiClient.post(`/campaigns/${campaignUuid}/handouts/${handoutUuid}/share`);
      setSharedUuids(prev =>
        prev.includes(handoutUuid) ? prev : [...prev, handoutUuid]
      );
    } catch { /* silent */ }
    finally { setSharing(null); }
  };

  const isShared = (uuid) => sharedUuids.includes(uuid);
  const { bundles, individual } = useMemo(() => {
    const sorted = [...handouts].sort(applySortFn);
    return {
      bundles:    sorted.filter(h => h.type === 'bundle'),
      individual: sorted.filter(h => h.type !== 'bundle'),
    };
  }, [handouts, sortBy]);

  const viewToggleBtn = (active) => ({
    padding: '3px 7px', border: 'none', borderRadius: 5,
    background: active ? 'var(--accent-bg)' : 'transparent',
    color: active ? 'var(--color-primary)' : 'var(--text-faint)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    transition: 'background 0.1s, color 0.1s',
  });

  if (loading) {
    return (
      <div style={{
        padding: 16, color: 'var(--text-faint)',
        fontSize: 12, fontStyle: 'italic', fontFamily: 'var(--font-sans)',
      }}>
        Loading handouts…
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* View toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ ...labelStyle, marginBottom: 0 }}>Handouts</span>
        <div style={{ width: 180, flexShrink: 0 }}>
          <CustomDropdown
            value={sortBy}
            onChange={handleSortChange}
            searchable={false}
            options={[
              { value: 'date-desc', label: 'Date added: newest' },
              { value: 'date-asc', label: 'Date added: oldest' },
              { value: 'name-asc', label: 'Name A–Z' },
              { value: 'name-desc', label: 'Name Z–A' },
              { value: 'type-images', label: 'Type: images first' },
              { value: 'type-text', label: 'Type: text first' },
            ]}
          />
        </div>
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
                  sharing={sharing === b.uuid}
                  isShared={isShared(b.uuid)}
                  onShare={() => handleShare(b.uuid)}
                  expanded={expanded.has(b.uuid)}
                  hold={makeHold(b, () => toggleExpand(b.uuid))}
                  makeHold={makeHold}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bundles.map(b => (
                <ListBundleRow
                  key={b.uuid}
                  bundle={b}
                  sharing={sharing === b.uuid}
                  isShared={isShared(b.uuid)}
                  onShare={() => handleShare(b.uuid)}
                  expanded={expanded.has(b.uuid)}
                  hold={makeHold(b, () => toggleExpand(b.uuid))}
                  makeHold={makeHold}
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
                  sharing={sharing === item.uuid}
                  isShared={isShared(item.uuid)}
                  onShare={() => handleShare(item.uuid)}
                  hold={makeHold(item)}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {individual.map(item => (
                <ListItemRow
                  key={item.uuid}
                  item={item}
                  sharing={sharing === item.uuid}
                  isShared={isShared(item.uuid)}
                  onShare={() => handleShare(item.uuid)}
                  hold={makeHold(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {handouts.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '32px 16px',
          border: '1px dashed var(--border-main)', borderRadius: 8,
          fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic',
          fontFamily: 'var(--font-sans)',
        }}>
          No handouts yet — add them from the manage page
        </div>
      )}

      {/* Manage link */}
      <button
        onClick={() => navigate('/keeper', { state: { openCampaignUuid: campaignUuid, openTab: 'handouts', returnTo: `/campaign/${campaignUuid}` } })}
        style={{
          width: '100%', padding: '8px 12px',
          border: '1px dashed var(--border-main)', borderRadius: 8,
          background: 'transparent', color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)', fontSize: 12,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 5,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-main)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>library_books</span>
        Manage handout library
      </button>

      <PreviewPortal item={preview} />
    </div>
  );
}
