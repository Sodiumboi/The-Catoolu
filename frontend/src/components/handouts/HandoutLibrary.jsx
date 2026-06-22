import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import apiClient from '../../api/client';

// Inject keyframe animations once at module load
if (typeof document !== 'undefined' && !document.getElementById('hl-anim-styles')) {
  const s = document.createElement('style');
  s.id = 'hl-anim-styles';
  s.textContent = `
    @keyframes hl-overlay-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes hl-modal-in {
      from { opacity: 0; transform: scale(0.93) translateY(-10px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);     }
    }
    @keyframes hl-form-in {
      from { opacity: 0; transform: translateY(-10px); }
      to   { opacity: 1; transform: translateY(0);     }
    }
  `;
  document.head.appendChild(s);
}

// ─── helpers ──────────────────────────────────────────────────
const typeIcon = (type) =>
  type === 'image' ? 'image' : type === 'bundle' ? 'stacks' : 'text_fields';

// ─── shared styles ────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid var(--border-input)',
  background: 'var(--bg-input)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)', fontSize: 13,
  outline: 'none', boxSizing: 'border-box', display: 'block',
};

const primaryBtn = {
  padding: '6px 16px', borderRadius: 7, border: 'none',
  background: 'var(--color-primary)', color: '#fff',
  fontFamily: 'var(--font-sans)', fontSize: 12,
  fontWeight: 500, cursor: 'pointer',
};

const cancelBtn = {
  padding: '6px 16px', borderRadius: 7,
  border: '1px solid var(--border-main)',
  background: 'transparent', color: 'var(--text-muted)',
  fontFamily: 'var(--font-sans)', fontSize: 12, cursor: 'pointer',
};

const miniBtn = {
  padding: '2px 7px', borderRadius: 5,
  border: '1px solid var(--border-main)',
  background: 'transparent', color: 'var(--text-muted)',
  fontFamily: 'var(--font-sans)', fontSize: 10, cursor: 'pointer',
};

// ─── HandoutEditModal ──────────────────────────────────────────
function HandoutEditModal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
        animation: 'hl-overlay-in 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          animation: 'hl-modal-in 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── DeleteConfirm ─────────────────────────────────────────────
function DeleteConfirm({ handout, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, animation: 'hl-overlay-in 0.15s ease',
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 12,
        border: '1px solid var(--border-main)', padding: '24px',
        maxWidth: 360, width: '90%',
        boxShadow: 'var(--shadow-dropdown)',
        animation: 'hl-modal-in 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
      }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 14,
          color: 'var(--text-primary)', margin: '0 0 8px',
        }}>
          Delete <strong>{handout.title}</strong>? This cannot be undone.
        </p>
        {handout.type === 'bundle' && (
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 12,
            color: 'var(--text-muted)', margin: '0 0 16px',
          }}>
            This will delete the bundle but not its contents.
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: handout.type === 'bundle' ? 0 : 16 }}>
          <button
            onClick={onConfirm}
            style={{
              ...primaryBtn,
              background: 'var(--danger)',
            }}
          >
            Delete
          </button>
          <button onClick={onCancel} style={cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── TextHandoutForm ───────────────────────────────────────────
function TextHandoutForm({ initial, onSave, onCancel, saving }) {
  const [title,   setTitle]   = useState(initial?.title   ?? '');
  const [content, setContent] = useState(initial?.content ?? '');

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 10,
      border: '1px solid var(--border-main)', padding: 16,
      marginBottom: 16, animation: 'hl-form-in 0.2s ease',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {initial ? 'Edit Text Handout' : 'New Text Handout'}
      </div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        style={inputStyle}
        autoFocus
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Handout text…"
        rows={5}
        style={{ ...inputStyle, resize: 'vertical', marginTop: 8 }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          onClick={() => onSave(title.trim() || 'Untitled', content)}
          disabled={saving}
          style={primaryBtn}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} disabled={saving} style={cancelBtn}>Cancel</button>
      </div>
    </div>
  );
}

// ─── ImageEditForm ─────────────────────────────────────────────
function ImageEditForm({ initial, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(initial?.title ?? '');

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 10,
      border: '1px solid var(--border-main)', padding: 16,
      marginBottom: 16, animation: 'hl-form-in 0.2s ease',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        Rename Image
      </div>
      {initial?.content && (
        <img
          src={initial.content}
          alt={initial.title}
          style={{
            width: '100%', maxHeight: 240, objectFit: 'contain',
            borderRadius: 6, marginBottom: 10, display: 'block',
            background: 'var(--bg-section-hd)',
          }}
        />
      )}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Image name"
        style={inputStyle}
        autoFocus
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          onClick={() => onSave(title.trim() || 'Untitled')}
          disabled={saving}
          style={primaryBtn}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} disabled={saving} style={cancelBtn}>Cancel</button>
      </div>
    </div>
  );
}

// ─── BundleForm ────────────────────────────────────────────────
function BundleForm({ initial, allHandouts, onSave, onCancel, saving }) {
  const [title,    setTitle]    = useState(initial?.title ?? '');
  const [selected, setSelected] = useState(
    initial?.items?.map(i => i.uuid) ?? []
  );
  const [preview,  setPreview]  = useState(null);
  const dragOver   = useRef(null);
  const holdTimer  = useRef(null);

  const available = allHandouts.filter(h => h.uuid !== initial?.uuid);
  const byUuid    = Object.fromEntries(allHandouts.map(h => [h.uuid, h]));

  const toggleItem = (uuid) =>
    setSelected(prev =>
      prev.includes(uuid) ? prev.filter(u => u !== uuid) : [...prev, uuid]
    );

  // Close preview on pointer release anywhere (macOS Quick Look style)
  useEffect(() => {
    if (!preview) return;
    const close = () => setPreview(null);
    document.addEventListener('pointerup', close);
    return () => document.removeEventListener('pointerup', close);
  }, [preview]);

  const handlePointerDown = (e, item) => {
    e.preventDefault();
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setPreview(item);
    }, 220);
  };

  const handlePointerUp = (item) => {
    if (holdTimer.current !== null) {
      // Quick tap — released before hold threshold, toggle selection
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      toggleItem(item.uuid);
    }
    // If in preview mode, document pointerup listener handles closing it
  };

  const handlePointerLeave = () => {
    if (holdTimer.current !== null) {
      // Pointer left before hold threshold — cancel without toggling
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    // Do NOT close preview here — overlay appearing triggers pointerleave on the card
  };

  const handleDragStart = (e, idx) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    dragOver.current = idx;
  };
  const handleDrop = (e, toIdx) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIdx === toIdx) return;
    setSelected(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    dragOver.current = null;
  };

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 10,
      border: '1px solid var(--border-main)', padding: 16,
      marginBottom: 16, animation: 'hl-form-in 0.2s ease',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {initial ? 'Edit Bundle' : 'New Bundle'}
      </div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Bundle title"
        style={inputStyle}
        autoFocus
      />

      <div style={{
        marginTop: 14, marginBottom: 8, fontSize: 11, fontWeight: 600,
        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        Add to bundle
        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 5, fontSize: 10 }}>
          (hold to preview)
        </span>
      </div>

      {available.length === 0 ? (
        <div style={{
          padding: '12px', fontSize: 12, color: 'var(--text-faint)',
          fontStyle: 'italic', textAlign: 'center',
          border: '1px solid var(--border-main)', borderRadius: 8,
        }}>
          No handouts yet
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
          gap: 7, maxHeight: 220, overflowY: 'auto', overscrollBehavior: 'contain',
          padding: 2,
        }}>
          {available.map(h => {
            const isSel = selected.includes(h.uuid);
            return (
              <div
                key={h.uuid}
                onPointerDown={e => handlePointerDown(e, h)}
                onPointerUp={() => handlePointerUp(h)}
                onPointerLeave={handlePointerLeave}
                style={{
                  borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                  border: isSel ? '2px solid var(--color-primary)' : '1px solid var(--border-main)',
                  boxShadow: isSel ? '0 0 0 2px var(--accent-bg)' : 'none',
                  position: 'relative', userSelect: 'none',
                  transition: 'border-color 0.1s, box-shadow 0.1s',
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 58, background: h.type === 'image' ? 'var(--accent-bg)' : 'var(--bg-section-hd)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {h.type === 'image' && h.content ? (
                    <img src={h.content} alt={h.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                  ) : (
                    <span className="material-symbols-outlined" style={{
                      fontSize: 22,
                      color: isSel ? 'var(--color-primary)' : 'var(--text-faint)',
                      opacity: 0.7,
                    }}>
                      {typeIcon(h.type)}
                    </span>
                  )}
                </div>
                {/* Title */}
                <div style={{
                  padding: '3px 5px', fontSize: 10, fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  background: 'var(--bg-card)',
                }}>
                  {h.title}
                </div>
                {/* Selected checkmark */}
                {isSel && (
                  <div style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#fff' }}>check</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <>
          <div style={{
            marginTop: 14, marginBottom: 6, fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            Order ({selected.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {selected.map((uuid, idx) => {
              const h = byUuid[uuid];
              if (!h) return null;
              return (
                <div
                  key={uuid}
                  draggable
                  onDragStart={e => handleDragStart(e, idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 8px', borderRadius: 6,
                    border: '1px solid var(--border-main)',
                    background: 'var(--bg-page)',
                    cursor: 'grab', fontSize: 12,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-faint)', flexShrink: 0 }}>
                    drag_indicator
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--accent)', flexShrink: 0 }}>
                    {typeIcon(h.type)}
                  </span>
                  <span style={{
                    flex: 1, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {h.title}
                  </span>
                  <button
                    onClick={() => toggleItem(uuid)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-faint)', padding: '0 2px',
                      fontSize: 16, lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={() => onSave(title.trim() || 'Untitled', selected)}
          disabled={saving}
          style={primaryBtn}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} disabled={saving} style={cancelBtn}>Cancel</button>
      </div>

      {/* Hold-to-preview overlay */}
      {preview && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 400, padding: 24,
            animation: 'hl-overlay-in 0.1s ease',
            pointerEvents: 'none',
          }}
        >
          {preview.type === 'image' && preview.content ? (
            <img
              src={preview.content}
              alt={preview.title}
              style={{
                maxWidth: '90vw', maxHeight: '85vh',
                borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <div style={{
              background: 'var(--bg-card)', borderRadius: 12, padding: 24,
              maxWidth: 440, width: '100%',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>
                  {typeIcon(preview.type)}
                </span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)' }}>
                  {preview.title}
                </span>
              </div>
              {preview.content && (
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)',
                  lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto', overscrollBehavior: 'contain',
                }}>
                  {preview.content}
                </div>
              )}
              {preview.type === 'bundle' && (
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
                  {(preview.items || []).length} items in bundle
                </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── HandoutCard ───────────────────────────────────────────────
function HandoutCard({ handout, onEdit, onDelete }) {
  const isImage = handout.type === 'image';
  return (
    <div
      onClick={() => onEdit(handout)}
      style={{
        background: 'var(--bg-card)', borderRadius: 10,
        border: '1px solid var(--border-main)', overflow: 'hidden',
        cursor: 'pointer', transition: 'border-color 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}
    >
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isImage ? 'var(--accent-bg)' : 'var(--bg-section-hd)',
        overflow: 'hidden',
      }}>
        {isImage && handout.content ? (
          <img
            src={handout.content}
            alt={handout.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--text-faint)', opacity: 0.5 }}>
            {typeIcon(handout.type)}
          </span>
        )}
      </div>
      <div style={{ padding: '6px 8px' }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>
          {handout.title}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={e => { e.stopPropagation(); onDelete(handout); }}
            style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BundleCard ────────────────────────────────────────────────
function BundleCard({ bundle, onEdit, onDelete }) {
  const items    = bundle.items || [];
  const isNested = items.some(i => i.type === 'bundle');

  return (
    <div style={{ position: 'relative', marginTop: 8, marginBottom: 4 }}>
      {/* Stack layer 2 — furthest back */}
      <div style={{
        position: 'absolute', top: -6, left: 4, right: 4,
        height: '100%', background: 'var(--accent-bg)',
        border: '0.5px solid var(--color-primary-mid)', borderRadius: 10, zIndex: 0,
      }} />
      {/* Stack layer 1 */}
      <div style={{
        position: 'absolute', top: -3, left: 2, right: 2,
        height: '100%', background: 'var(--accent-bg)',
        border: '0.5px solid var(--color-primary-mid)', borderRadius: 10, zIndex: 1,
      }} />
      {/* Main card */}
      <div
        onClick={() => onEdit(bundle)}
        style={{
          position: 'relative', zIndex: 2, background: 'var(--bg-card)',
          border: '0.5px solid var(--color-primary-mid)', borderRadius: 10, overflow: 'hidden',
          cursor: 'pointer', transition: 'border-color 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-primary-mid)'}
      >
        {/* Preview */}
        <div style={{
          height: 64, background: 'var(--accent-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {items.length === 0 ? (
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--accent)', opacity: 0.4 }}>
              stacks
            </span>
          ) : items.slice(0, 3).map((item, i) => (
            <span key={item.uuid} className="material-symbols-outlined" style={{
              fontSize: i === 0 ? 24 : 18,
              color: 'var(--accent)',
              opacity: i === 0 ? 1 : 0.6,
            }}>
              {typeIcon(item.type)}
            </span>
          ))}
        </div>

        {/* Item count badge */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: 'var(--color-primary)', color: 'var(--color-primary-light)',
          fontSize: 10, padding: '1px 5px', borderRadius: 10,
        }}>
          {items.length}
        </div>

        {/* Footer */}
        <div style={{
          padding: '6px 8px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 6,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 500, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {bundle.title}
            </div>
            <div style={{
              fontSize: 9, background: 'var(--accent-bg)', color: 'var(--accent)',
              padding: '1px 5px', borderRadius: 4, marginTop: 2,
              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              bundle · {items.length} item{items.length !== 1 ? 's' : ''}{isNested ? ' · nested' : ''}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(bundle); }}
            style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)', flexShrink: 0 }}
          >
            delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LoadingCard ───────────────────────────────────────────────
function LoadingCard() {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 10,
      border: '1px solid var(--border-main)', overflow: 'hidden',
      opacity: 0.6,
    }}>
      <div style={{
        height: 64,
        background: 'var(--accent-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--accent)', opacity: 0.5 }}>
          upload
        </span>
      </div>
      <div style={{ padding: '6px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>
          Uploading…
        </div>
      </div>
    </div>
  );
}

// ─── Section heading ───────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

// ─── Grid ──────────────────────────────────────────────────────
function Grid({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 10,
      marginBottom: 24,
    }}>
      {children}
    </div>
  );
}

// ─── HandoutLibrary ────────────────────────────────────────────
export default function HandoutLibrary({ campaignUuid }) {
  const [handouts,       setHandouts]      = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [creating,       setCreating]      = useState(null); // 'text' | 'bundle' | null
  const [editing,        setEditing]       = useState(null); // handout object | null
  const [deleting,       setDeleting]      = useState(null); // handout object | null
  const [saving,         setSaving]        = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [stats,          setStats]         = useState({ imageCount: 0 });
  const fileInputRef = useRef(null);

  useEffect(() => { fetchHandouts(); fetchStats(); }, [campaignUuid]);

  const fetchHandouts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/campaigns/${campaignUuid}/handouts`);
      setHandouts(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/campaigns/handouts/stats');
      setStats(res.data);
    } catch { /* silent */ }
  };

  // ── Image upload ──────────────────────────────────────────
  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const tooBig = files.filter(f => f.size > 5 * 1024 * 1024);
    if (tooBig.length > 0) {
      alert(`${tooBig.length} file${tooBig.length > 1 ? 's' : ''} exceed 5 MB and were skipped.`);
    }
    const valid = files.filter(f =>
      f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
    );
    valid.forEach(uploadImage);
  };

  const uploadImage = async (file) => {
    setUploadingCount(n => n + 1);
    try {
      const fd = new FormData();
      fd.append('type', 'image');
      fd.append('title', file.name.replace(/\.[^/.]+$/, ''));
      fd.append('file', file);
      const res = await apiClient.post(
        `/campaigns/${campaignUuid}/handouts`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setHandouts(prev => [...prev, res.data]);
      setStats(s => ({ ...s, imageCount: s.imageCount + 1 }));
    } catch {
      alert(`Failed to upload ${file.name}.`);
    } finally {
      setUploadingCount(n => n - 1);
    }
  };

  // ── Text CRUD ──────────────────────────────────────────────
  const handleSaveText = async (title, content) => {
    setSaving(true);
    try {
      if (editing) {
        const res = await apiClient.put(
          `/campaigns/${campaignUuid}/handouts/${editing.uuid}`,
          { title, content }
        );
        setHandouts(prev => prev.map(h => h.uuid === editing.uuid ? res.data : h));
        setEditing(null);
      } else {
        const res = await apiClient.post(
          `/campaigns/${campaignUuid}/handouts`,
          { type: 'text', title, content }
        );
        setHandouts(prev => [...prev, res.data]);
        setCreating(null);
      }
    } catch {
      alert('Failed to save handout.');
    } finally {
      setSaving(false);
    }
  };

  // ── Image rename ───────────────────────────────────────────
  const handleSaveImageTitle = async (title) => {
    setSaving(true);
    try {
      const res = await apiClient.put(
        `/campaigns/${campaignUuid}/handouts/${editing.uuid}`,
        { title }
      );
      setHandouts(prev => prev.map(h => h.uuid === editing.uuid ? res.data : h));
      setEditing(null);
    } catch {
      alert('Failed to rename image.');
    } finally {
      setSaving(false);
    }
  };

  // ── Bundle CRUD ────────────────────────────────────────────
  const handleSaveBundle = async (title, itemUuids) => {
    setSaving(true);
    try {
      if (editing) {
        const res = await apiClient.put(
          `/campaigns/${campaignUuid}/handouts/${editing.uuid}`,
          { title, items: itemUuids }
        );
        setHandouts(prev => prev.map(h => h.uuid === editing.uuid ? res.data : h));
        setEditing(null);
      } else {
        const res = await apiClient.post(
          `/campaigns/${campaignUuid}/handouts`,
          { type: 'bundle', title, items: itemUuids }
        );
        setHandouts(prev => [...prev, res.data]);
        setCreating(null);
      }
    } catch {
      alert('Failed to save bundle.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await apiClient.delete(`/campaigns/${campaignUuid}/handouts/${deleting.uuid}`);
      setHandouts(prev => prev.filter(h => h.uuid !== deleting.uuid));
    } catch {
      alert('Failed to delete handout.');
    } finally {
      setDeleting(null);
    }
  };

  // ── Edit dispatch ──────────────────────────────────────────
  const handleEdit = (handout) => {
    setCreating(null);
    setEditing(handout);
  };

  const handleCancelEdit = () => setEditing(null);
  const handleCancelCreate = () => setCreating(null);

  const bundles    = handouts.filter(h => h.type === 'bundle');
  const individual = handouts.filter(h => h.type !== 'bundle');

  // ── Toolbar pill button style ──────────────────────────────
  const pillBtn = (active) => ({
    padding: '6px 14px',
    border: 'none',
    borderLeft: '1px solid var(--border-main)',
    background: active ? 'var(--accent-bg)' : 'transparent',
    color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
    transition: 'background 0.12s, color 0.12s',
  });

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
        Loading handouts…
      </div>
    );
  }

  return (
    <div>
      {/* Hidden file input — multiple files allowed */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFilePick}
      />

      {/* Header + toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: 20,
            color: 'var(--text-primary)', margin: 0,
          }}>
            Handout library
          </h2>
          <div style={{
            marginTop: 3, fontSize: 11, color: 'var(--text-faint)',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-sans)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>public</span>
            {stats.imageCount} image{stats.imageCount !== 1 ? 's' : ''} across all campaigns
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'stretch',
          border: '1px solid var(--border-main)', borderRadius: 999,
          background: 'var(--bg-card)', overflow: 'hidden',
        }}>
          <span style={{
            padding: '6px 13px', fontSize: 12, fontWeight: 600,
            color: 'var(--text-muted)', fontFamily: 'var(--font-sans)',
            display: 'inline-flex', alignItems: 'center',
          }}>
            New
          </span>
          <button
            style={pillBtn(creating === 'text' || editing?.type === 'text')}
            onClick={() => { setEditing(null); setCreating(p => p === 'text' ? null : 'text'); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>text_fields</span>
            Text
          </button>
          <button
            style={pillBtn(creating === 'bundle' || editing?.type === 'bundle')}
            onClick={() => { setEditing(null); setCreating(p => p === 'bundle' ? null : 'bundle'); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>stacks</span>
            Bundle
          </button>
          <button
            style={pillBtn(false)}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCount > 0}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload</span>
            {uploadingCount > 0 ? `${uploadingCount} uploading…` : 'Images'}
          </button>
        </div>
      </div>

      {/* Inline create forms */}
      {creating === 'text' && !editing && (
        <TextHandoutForm
          onSave={handleSaveText}
          onCancel={handleCancelCreate}
          saving={saving}
        />
      )}
      {creating === 'bundle' && !editing && (
        <BundleForm
          allHandouts={handouts}
          onSave={handleSaveBundle}
          onCancel={handleCancelCreate}
          saving={saving}
        />
      )}

      {/* Edit forms — individual handouts use a modal overlay, bundles stay inline */}
      {(editing?.type === 'image' || editing?.type === 'text') && (
        <HandoutEditModal onClose={handleCancelEdit}>
          {editing.type === 'image' && (
            <ImageEditForm
              initial={editing}
              onSave={handleSaveImageTitle}
              onCancel={handleCancelEdit}
              saving={saving}
            />
          )}
          {editing.type === 'text' && (
            <TextHandoutForm
              initial={editing}
              onSave={handleSaveText}
              onCancel={handleCancelEdit}
              saving={saving}
            />
          )}
        </HandoutEditModal>
      )}
      {editing?.type === 'bundle' && (
        <BundleForm
          initial={editing}
          allHandouts={handouts}
          onSave={handleSaveBundle}
          onCancel={handleCancelEdit}
          saving={saving}
        />
      )}

      {/* ── Bundles section ── */}
      {(bundles.length > 0 || creating === 'bundle') && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeading>Bundles</SectionHeading>
          <Grid>
            {bundles.map(b => (
              <BundleCard
                key={b.uuid}
                bundle={b}
                onEdit={handleEdit}
                onDelete={setDeleting}
              />
            ))}
          </Grid>
        </div>
      )}

      {/* ── Individual handouts section ── */}
      <div>
        <SectionHeading>Individual handouts</SectionHeading>
        {individual.length === 0 && uploadingCount === 0 ? (
          <div style={{
            padding: '32px 20px', borderRadius: 10,
            border: '1px dashed var(--border-main)',
            textAlign: 'center', fontSize: 13,
            color: 'var(--text-faint)', fontStyle: 'italic',
          }}>
            No handouts yet — use the buttons above to add images or text.
          </div>
        ) : (
          <Grid>
            {individual.map(h => (
              <HandoutCard
                key={h.uuid}
                handout={h}
                onEdit={handleEdit}
                onDelete={setDeleting}
              />
            ))}
            {Array.from({ length: uploadingCount }).map((_, i) => <LoadingCard key={`loading-${i}`} />)}
          </Grid>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleting && (
        <DeleteConfirm
          handout={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
