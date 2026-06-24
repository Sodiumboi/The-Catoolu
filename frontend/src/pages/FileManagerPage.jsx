import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import HandoutViewer from '../components/handouts/HandoutViewer';

const KIND = {
  avatar:  { label: 'Avatar',         icon: 'person',       color: 'var(--accent)' },
  handout: { label: 'Handout image',  icon: 'image',        color: '#2563eb' },
  bug:     { label: 'Bug screenshot', icon: 'bug_report',   color: '#d97706' },
  chat:    { label: 'Chat image',     icon: 'chat_bubble',  color: '#059669' },
};

const fmtSize = (b) => {
  if (b >= 1024 * 1024) return (Math.round((b / (1024 * 1024)) * 10) / 10) + ' MB';
  if (b >= 1024)        return Math.round(b / 1024) + ' KB';
  return b + ' B';
};
const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return ''; }
};
const mb = (b) => { const m = b / (1024 * 1024); return m >= 10 ? Math.round(m) : Math.round(m * 10) / 10; };

const iconBtn = {
  flexShrink: 0, width: 30, height: 30, borderRadius: 7,
  border: 'none', background: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  textDecoration: 'none',
};
const btn = {
  padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 500,
  fontFamily: 'var(--font-sans)', cursor: 'pointer', whiteSpace: 'nowrap',
};

export default function FileManagerPage() {
  const [files,     setFiles]     = useState([]);
  const [quota,     setQuota]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId,    setBusyId]    = useState(null);
  const [viewing,   setViewing]   = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected,      setSelected]      = useState(new Set());
  const [bulkBusy,      setBulkBusy]      = useState(false);
  const selectAllRef = useRef(null);

  useEffect(() => {
    apiClient.get('/profile/uploads')
      .then(r => { setFiles(r.data.files); setQuota(r.data.quota); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      const r = await apiClient.delete('/profile/uploads/' + id);
      setFiles(prev => prev.filter(f => f.id !== id));
      if (r.data?.quota) setQuota(r.data.quota);
    } catch { /* leave the row; user can retry */ }
    finally { setBusyId(null); setConfirmId(null); }
  };

  const toggleSelection = (id) => {
    if (!selectionMode) return;
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map(f => f.id)));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    if (bulkBusy || selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} file(s)? This cannot be undone.`)) return;
    setBulkBusy(true);
    const ids = [...selected];
    const results = await Promise.allSettled(
      ids.map(id => apiClient.delete('/profile/uploads/' + id))
    );
    const successIds = [];
    let latestQuota = null;
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        successIds.push(ids[i]);
        if (r.value?.data?.quota) latestQuota = r.value.data.quota;
      }
    });
    setFiles(prev => prev.filter(f => !successIds.includes(f.id)));
    if (latestQuota) setQuota(latestQuota);
    setSelected(new Set());
    setSelectionMode(false);
    setBulkBusy(false);
  };

  // Set the select-all checkbox to indeterminate when a partial selection is active
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selected.size > 0 && selected.size < files.length;
    }
  }, [selected, files]);

  const totalUsed  = quota?.totalUsed  ?? 0;
  const totalLimit = quota?.totalLimit ?? 200 * 1024 * 1024;
  const pct        = Math.min(100, Math.round((totalUsed / totalLimit) * 100));
  const barColor   = pct >= 90 ? 'var(--danger)' : pct >= 60 ? '#d97706' : 'var(--color-primary)';

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)',
    }}>
      <NavBar activeTab={null} />

      <main className="animate-fade-rise" style={{
        maxWidth: '820px', margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontSize: '28px',
              color: 'var(--text-primary)', margin: '0 0 4px',
            }}>
              File Storage
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px' }}>
              Everything you've uploaded — avatars, handout images, and bug screenshots.
            </p>
          </div>
          {!loading && files.length > 0 && (
            selectionMode ? (
              <button
                onClick={exitSelectionMode}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: 'pointer',
                  background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--text-muted)',
                }}
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setSelectionMode(true)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: 'pointer',
                  background: 'transparent', color: 'var(--color-primary)',
                  border: '1px solid var(--color-primary)',
                }}
              >
                Select
              </button>
            )
          )}
        </div>

        {/* Quota summary */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-main)',
          borderRadius: 12, padding: '16px 18px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Storage used</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: barColor }}>
              {mb(totalUsed)} <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>/ {mb(totalLimit)} MB</span>
            </span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: 'var(--border-main)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 5, background: barColor, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
            {mb(Math.max(0, totalLimit - totalUsed))} MB free · {files.length} file{files.length !== 1 ? 's' : ''} · rate cap 50 MB / 5 min
          </div>
        </div>

        {/* Bulk action toolbar */}
        {selectionMode && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-main)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={selected.size === files.length && files.length > 0}
              onChange={toggleSelectAll}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {selected.size} of {files.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy || selected.size === 0}
              style={{
                ...btn, background: 'var(--danger)', color: '#fff', border: 'none',
                marginLeft: 'auto',
                opacity: (bulkBusy || selected.size === 0) ? 0.6 : 1,
                cursor: (bulkBusy || selected.size === 0) ? 'default' : 'pointer',
              }}
            >
              {bulkBusy ? 'Deleting…' : `Delete ${selected.size} file${selected.size !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={exitSelectionMode}
              disabled={bulkBusy}
              style={{
                ...btn, background: 'transparent', color: 'var(--text-muted)',
                border: '1px solid var(--border-main)',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* File list */}
        {loading ? (
          <div style={{ color: 'var(--text-faint)', fontStyle: 'italic', fontSize: 13, padding: '24px 0' }}>
            Loading files…
          </div>
        ) : files.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 16px',
            border: '1px dashed var(--border-main)', borderRadius: 12, color: 'var(--text-faint)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>
              folder_open
            </span>
            <div style={{ fontSize: 14 }}>No files uploaded yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {files.map(f => {
              const k          = KIND[f.kind] || { label: f.kind, icon: 'draft', color: 'var(--text-muted)' };
              const confirming = confirmId === f.id;
              const busy       = busyId === f.id;
              const isSel      = selected.has(f.id);
              return (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-card)',
                  border: isSel ? '2px solid var(--accent)' : '1px solid var(--border-main)',
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  {/* Selection checkbox */}
                  {selectionMode && (
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelection(f.id)}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                  )}
                  {/* Thumbnail (click to preview, or toggle in selection mode) */}
                  <div
                    onClick={() => selectionMode ? toggleSelection(f.id) : setViewing(f)}
                    title={selectionMode ? 'Select' : 'Preview'}
                    style={{
                      width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                      background: 'var(--bg-section-hd)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <img
                      src={f.url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>

                  {/* Info (click to preview, or toggle in selection mode) — shows the real file name */}
                  <div onClick={() => selectionMode ? toggleSelection(f.id) : setViewing(f)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: k.color, flexShrink: 0 }}>{k.icon}</span>
                      <span style={{
                        fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {f.name}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                      {k.label}{f.campaignName ? ' · ' + f.campaignName : ''} · {fmtSize(f.sizeBytes)} · {fmtDate(f.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <a href={f.url} target="_blank" rel="noreferrer" style={{ ...iconBtn, color: 'var(--text-muted)' }} title="Open raw file">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
                  </a>
                  {!selectionMode && (confirming ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {f.kind === 'handout' && (
                        <span style={{ fontSize: 10, color: 'var(--danger)', maxWidth: 110, lineHeight: 1.3 }}>
                          Removes it from the campaign
                        </span>
                      )}
                      <button onClick={() => handleDelete(f.id)} disabled={busy}
                        style={{ ...btn, background: 'var(--danger)', color: '#fff', border: 'none' }}>
                        {busy ? '…' : 'Delete'}
                      </button>
                      <button onClick={() => setConfirmId(null)} disabled={busy}
                        style={{ ...btn, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-main)' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(f.id)} title="Delete" style={{ ...iconBtn, color: 'var(--danger)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* Shared in-app preview (same viewer used by handouts) */}
      {viewing && (
        <HandoutViewer
          handout={{ type: 'image', content: viewing.url, title: viewing.name }}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
