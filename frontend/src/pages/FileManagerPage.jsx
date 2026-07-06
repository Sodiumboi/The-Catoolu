import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import HandoutViewer from '../components/handouts/HandoutViewer';
import ConfirmDialog from '../components/ConfirmDialog';
import useConfirm from '../hooks/useConfirm';
import Tooltip from '../components/ui/Tooltip';
import Checkbox from '../components/ui/Checkbox';

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

export default function FileManagerPage() {
  const [files,     setFiles]     = useState([]);
  const [quota,     setQuota]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const { confirm, dialogProps }  = useConfirm();
  const [busyId,    setBusyId]    = useState(null);
  const [viewing,   setViewing]   = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected,      setSelected]      = useState(new Set());
  const [bulkBusy,      setBulkBusy]      = useState(false);

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
    finally { setBusyId(null); }
  };

  const requestDelete = async (f) => {
    const message = f.kind === 'handout'
      ? 'This file is used as a handout. Deleting it will remove it from the campaign.'
      : `"${f.name}" will be permanently deleted.`;
    const ok = await confirm({
      title: 'Delete file?',
      message,
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    handleDelete(f.id);
  };

  // The active profile picture is protected — it can never be selected or deleted here.
  const isProtected = (f) => f.isCurrentAvatar;
  const selectableFiles = files.filter(f => !isProtected(f));

  const toggleSelection = (id) => {
    if (!selectionMode) return;
    const f = files.find(x => x.id === id);
    if (f && isProtected(f)) return;
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === selectableFiles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableFiles.map(f => f.id)));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    if (bulkBusy || selected.size === 0) return;
    const ok = await confirm({
      title: `Delete ${selected.size} files?`,
      message: `${selected.size} files will be permanently deleted. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: `Delete ${selected.size} files`,
    });
    if (!ok) return;
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

  const totalUsed  = quota?.totalUsed  ?? 0;
  const totalLimit = quota?.totalLimit ?? 200 * 1024 * 1024;
  const pct        = Math.min(100, Math.round((totalUsed / totalLimit) * 100));
  const barColor   = pct >= 90 ? 'var(--danger)' : pct >= 60 ? '#d97706' : 'var(--color-primary)';

  return (
    <div className="min-h-screen bg-(--bg-page) flex flex-col font-sans">
      <NavBar activeTab={null} />

      <main className="animate-fade-rise max-w-205 mx-auto py-8 px-6 flex-1 w-full">
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-[28px] text-(--text-primary) mt-0 mb-1">
              File Storage
            </h1>
            <p className="text-(--text-muted) text-sm mt-0 mb-6">
              Everything you've uploaded — avatars, handout images, and bug screenshots.
            </p>
          </div>
          {!loading && files.length > 0 && (
            selectionMode ? (
              <button
                onClick={exitSelectionMode}
                className="btn-secondary btn-secondary-sm"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setSelectionMode(true)}
                className="btn-secondary btn-secondary-sm"
              >
                Select
              </button>
            )
          )}
        </div>

        {/* Quota summary */}
        <div className="bg-(--bg-card) border border-(--border-main) rounded-xl py-4 px-4.5 mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[13px] text-(--text-secondary)">Storage used</span>
            {/* barColor is computed from live quota percentage thresholds — stays inline */}
            <span className="text-sm font-semibold" style={{ color: barColor }}>
              {mb(totalUsed)} <span className="text-(--text-faint) font-normal">/ {mb(totalLimit)} MB</span>
            </span>
          </div>
          <div className="h-2.5 rounded-[5px] bg-(--border-main) overflow-hidden">
            {/* width/background are live data-driven values (quota %, threshold color) — stay inline */}
            <div className="h-full rounded-[5px] [transition:width_0.4s_ease]" style={{ width: `${pct}%`, background: barColor }} />
          </div>
          <div className="text-[11px] text-(--text-faint) mt-2">
            {mb(Math.max(0, totalLimit - totalUsed))} MB free · {files.length} file{files.length !== 1 ? 's' : ''} · rate cap 50 MB / 5 min
          </div>
        </div>

        {/* Bulk action toolbar */}
        {selectionMode && (
          <div className="bg-(--bg-card) border border-(--border-main) rounded-[10px] py-2.5 px-3.5 mb-4 flex items-center gap-3 flex-wrap">
            <Checkbox
              checked={selected.size === selectableFiles.length && selectableFiles.length > 0}
              indeterminate={selected.size > 0 && selected.size < selectableFiles.length}
              onChange={toggleSelectAll}
              disabled={selectableFiles.length === 0}
              ariaLabel="Select all files"
            />
            <span className="text-[13px] text-(--text-secondary)">
              {selected.size} of {selectableFiles.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy || selected.size === 0}
              className={`btn-danger btn-danger-sm ml-auto ${(bulkBusy || selected.size === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {bulkBusy ? 'Deleting…' : `Delete ${selected.size} file${selected.size !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={exitSelectionMode}
              disabled={bulkBusy}
              className="btn-secondary btn-secondary-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {/* File list */}
        {loading ? (
          <div className="text-(--text-faint) italic text-[13px] py-6">
            Loading files…
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-(--border-main) rounded-xl text-(--text-faint)">
            <span className="material-symbols-outlined text-[40px] block mb-2">
              folder_open
            </span>
            <div className="text-sm">No files uploaded yet</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {files.map(f => {
              const k          = KIND[f.kind] || { label: f.kind, icon: 'draft', color: 'var(--text-muted)' };
              const busy       = busyId === f.id;
              const isSel      = selected.has(f.id);
              const locked     = isProtected(f);
              return (
                <div
                  key={f.id}
                  className={`flex items-center gap-3 bg-(--bg-card) rounded-[10px] py-2.5 px-3 ${isSel ? 'border-2 border-(--accent)' : 'border border-(--border-main)'}`}
                >
                  {/* Selection checkbox — locked for the active profile picture */}
                  {selectionMode && (
                    locked ? (
                      <Tooltip content="Current profile picture — can't be deleted">
                        <span className="material-symbols-outlined text-lg text-(--text-faint) shrink-0 w-4.5 text-center">lock</span>
                      </Tooltip>
                    ) : (
                      <Checkbox
                        checked={isSel}
                        onChange={() => toggleSelection(f.id)}
                        ariaLabel="Select file"
                      />
                    )
                  )}
                  {/* Thumbnail (click to preview, or toggle in selection mode) */}
                  <Tooltip content={selectionMode && !locked ? 'Select' : 'Preview'}>
                  <div
                    onClick={() => (selectionMode && !locked) ? toggleSelection(f.id) : setViewing(f)}
                    className="w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer bg-(--bg-section-hd) flex items-center justify-center"
                  >
                    <img
                      src={f.url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  </Tooltip>

                  {/* Info (click to preview, or toggle in selection mode) — shows the real file name */}
                  <div onClick={() => (selectionMode && !locked) ? toggleSelection(f.id) : setViewing(f)} className="flex-1 min-w-0 cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      {/* k.color is a per-file-kind lookup value driven by f.kind — stays inline */}
                      <span className="material-symbols-outlined text-[15px] shrink-0" style={{ color: k.color }}>{k.icon}</span>
                      <span className="text-[13px] font-medium text-(--text-primary) truncate">
                        {f.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-(--text-faint) mt-0.5">
                      {k.label}{f.campaignName ? ' · ' + f.campaignName : ''} · {fmtSize(f.sizeBytes)} · {fmtDate(f.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <Tooltip content="Open raw file">
                  <a href={f.url} target="_blank" rel="noreferrer" aria-label="Open raw file" className="btn-icon-ghost btn-icon-sm no-underline">
                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                  </a>
                  </Tooltip>
                  {!selectionMode && (
                    locked ? (
                      <Tooltip content="Current profile picture — can't be deleted">
                        <span className="shrink-0 w-7 h-7 flex items-center justify-center text-(--text-faint)">
                          <span className="material-symbols-outlined text-lg">lock</span>
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip content="Delete">
                      <button onClick={() => requestDelete(f)} disabled={busy} aria-label="Delete" className="btn-icon-ghost btn-icon-sm btn-icon-danger">
                        <span className="material-symbols-outlined text-lg">{busy ? 'hourglass_empty' : 'delete'}</span>
                      </button>
                      </Tooltip>
                    )
                  )}
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

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
