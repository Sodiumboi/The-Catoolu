import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import HandoutViewer from '../components/handouts/HandoutViewer';
import ConfirmDialog from '../components/ConfirmDialog';
import useConfirm from '../hooks/useConfirm';
import Tooltip from '../components/ui/Tooltip';
import Checkbox from '../components/ui/Checkbox';
import CustomDropdown from '../components/ui/CustomDropdown';

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc',  label: 'Oldest first' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc',  label: 'Smallest first' },
  { value: 'name-asc',  label: 'Name A–Z' },
  { value: 'kind',      label: 'Type' },
];

// Per-kind category colours, driving the type pill in both views. These are
// deliberately fixed hexes, not theme tokens: a type code has to mean the same
// thing in all 6 themes, and the avatar used to ride on var(--accent), which
// collides with the Bug amber on the gold-accented themes. Each value clears
// 4.5:1 against white so the pill's white label stays legible.
const KIND = {
  avatar:  { badge: 'Avatar',  icon: 'person',      color: '#7c3aed' },
  handout: { badge: 'Handout', icon: 'image',       color: '#2563eb' },
  bug:     { badge: 'Bug',     icon: 'bug_report',  color: '#c2410c' },
  chat:    { badge: 'Chat',    icon: 'chat_bubble', color: '#047857' },
};
const KIND_FALLBACK = { icon: 'draft', color: '#525252' };

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
  const toast = useToast();
  const [busyId,    setBusyId]    = useState(null);
  const [viewing,   setViewing]   = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected,      setSelected]      = useState(new Set());
  const [bulkBusy,      setBulkBusy]      = useState(false);
  const [viewMode,      setViewMode]      = useState(
    () => localStorage.getItem('fm_view_mode') === 'list' ? 'list' : 'grid'
  );
  const [sortBy,        setSortBy]        = useState(
    () => localStorage.getItem('fm_sort') || 'date-desc'
  );

  const changeView = (v) => {
    setViewMode(v);
    localStorage.setItem('fm_view_mode', v);
  };

  const changeSort = (v) => {
    setSortBy(v);
    localStorage.setItem('fm_sort', v);
  };

  // Sorted copy for rendering — `files` itself stays in server order (newest
  // first) so the delete handlers keep filtering against the untouched list.
  const sortedFiles = useMemo(() => {
    const comparators = {
      'date-asc':  (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      'size-desc': (a, b) => b.sizeBytes - a.sizeBytes,
      'size-asc':  (a, b) => a.sizeBytes - b.sizeBytes,
      'name-asc':  (a, b) => a.name.localeCompare(b.name),
      'kind':      (a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name),
    };
    const cmp = comparators[sortBy] || ((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return [...files].sort(cmp);
  }, [files, sortBy]);

  useEffect(() => {
    apiClient.get('/profile/uploads')
      .then(r => { setFiles(r.data.files); setQuota(r.data.quota); })
      .catch((err) => toast.error("Couldn't load files", 'Refresh to try again.', {
        details: { endpoint: 'GET /profile/uploads', status: err.response?.status, raw: err.response?.data?.error || err.message },
      }))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      const r = await apiClient.delete('/profile/uploads/' + id);
      setFiles(prev => prev.filter(f => f.id !== id));
      if (r.data?.quota) setQuota(r.data.quota);
    } catch (err) {
      toast.error("Couldn't delete file", 'The file was not deleted. Try again.', {
        details: { endpoint: 'DELETE /profile/uploads', status: err.response?.status, raw: err.response?.data?.error || err.message },
      });
    } finally { setBusyId(null); }
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
        {/* Compact single-line header: title · inline quota bar · select + view toggle */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <h1 className="font-serif text-[28px] text-(--text-primary) m-0 shrink-0">
            File Storage
          </h1>

          <Tooltip content={`${mb(Math.max(0, totalLimit - totalUsed))} MB free · ${files.length} file${files.length !== 1 ? 's' : ''} · rate cap 50 MB / 5 min`}>
            <div className="flex-1 min-w-30">
              <div className="text-[11px] text-(--text-muted) mb-1">
                {mb(totalUsed)} / {mb(totalLimit)} MB used
              </div>
              <div className="h-[3px] rounded-full bg-(--border-main) overflow-hidden">
                {/* width/background are live data-driven values (quota %, threshold color) — stay inline */}
                <div className="h-full rounded-full [transition:width_0.4s_ease]" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          </Tooltip>

          <div className="flex items-center gap-2 shrink-0">
            {!loading && files.length > 0 && (
              <button
                onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
                className={`btn-secondary btn-secondary-sm ${selectionMode ? 'bg-(--accent-bg) border-(--accent) text-(--color-primary)' : ''}`}
              >
                <span className="icon icon-sm">check_box</span>
                Select
              </button>
            )}
            {!loading && files.length > 0 && (
              <div className="w-38">
                <CustomDropdown
                  value={sortBy}
                  onChange={changeSort}
                  options={SORT_OPTIONS}
                  searchable={false}
                />
              </div>
            )}
            <div className="view-toggle">
              <Tooltip content="Grid view">
                <button
                  onClick={() => changeView('grid')}
                  aria-label="Grid view"
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                >
                  <span className="icon icon-sm">grid_view</span>
                </button>
              </Tooltip>
              <Tooltip content="List view">
                <button
                  onClick={() => changeView('list')}
                  aria-label="List view"
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <span className="icon icon-sm">list</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Selection bar — only in selection mode */}
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
              {selected.size} selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy || selected.size === 0}
              className="btn-danger btn-danger-sm ml-auto"
            >
              {bulkBusy ? 'Deleting…' : `Delete ${selected.size} file${selected.size !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={exitSelectionMode}
              disabled={bulkBusy}
              className="btn-ghost text-[13px]!"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Files */}
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
        ) : viewMode === 'grid' ? (
          /* ── Grid: rectangular landscape tiles ───────────────────────── */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2">
            {sortedFiles.map(f => {
              const k      = KIND[f.kind] || { ...KIND_FALLBACK, badge: f.kind };
              const busy   = busyId === f.id;
              const isSel  = selected.has(f.id);
              const locked = isProtected(f);
              return (
                <div
                  key={f.id}
                  onClick={() => (selectionMode && !locked) ? toggleSelection(f.id) : setViewing(f)}
                  className={`fm-tile group relative flex items-center h-15 rounded-[9px] border-[0.5px] bg-(--bg-card) cursor-pointer [transition:border-color_0.12s_ease-in-out,box-shadow_0.12s_ease-in-out] ${
                    isSel
                      ? 'border-(--color-primary) shadow-[0_0_0_1.5px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]'
                      : 'border-(--border-main) hover:border-(--border-input) hover:shadow-(--shadow-card)'
                  }`}
                >
                  {/* Thumbnail — the icon sits underneath and shows through if the image fails */}
                  <div className="relative w-15 h-15 shrink-0 rounded-l-[8.5px] overflow-hidden bg-(--bg-section-hd) flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px] text-(--text-muted)">{k.icon}</span>
                    <img
                      src={f.url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />

                    {locked && (
                      <Tooltip content="Current profile picture — can't be deleted">
                        <span className="absolute right-0.5 top-0.5 w-3.5 h-3.5 rounded-sm bg-black/55 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px]! text-white">lock</span>
                        </span>
                      </Tooltip>
                    )}

                    {selectionMode && (
                      <span className="absolute left-0.5 top-0.5 rounded-[5px] p-px [background:color-mix(in_srgb,var(--bg-card)_85%,transparent)]">
                        <Checkbox
                          checked={isSel}
                          onChange={() => toggleSelection(f.id)}
                          disabled={locked}
                          ariaLabel={`Select ${f.name}`}
                        />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 px-2.5">
                    <div className="text-[12px] font-medium text-(--text-primary) truncate">
                      {f.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                      {/* k.color is a per-file-kind lookup driven by f.kind — stays inline */}
                      <span
                        className="shrink-0 px-1.5 py-px rounded-[999px] text-white text-[9px] leading-[1.6] uppercase tracking-wider font-semibold"
                        style={{ background: k.color }}
                      >
                        {k.badge}
                      </span>
                      <span className="text-[10px] text-(--text-muted) truncate">
                        {fmtSize(f.sizeBytes)}
                      </span>
                    </div>
                  </div>

                  {/* Actions — hidden until the tile is hovered or an action is focused */}
                  <div className="flex items-center gap-0.5 shrink-0 pr-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [transition:opacity_0.12s_ease-in-out]">
                    <Tooltip content="Open raw file">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        aria-label="Open raw file"
                        className="btn-icon-ghost btn-icon-sm no-underline"
                      >
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                      </a>
                    </Tooltip>
                    {locked ? (
                      /* A disabled <button> swallows mouse events, so the tooltip would never
                         fire — render the disabled affordance as a span instead */
                      <Tooltip content="Current profile picture — can't be deleted">
                        <span className="btn-icon-ghost btn-icon-sm opacity-40 cursor-not-allowed">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip content="Delete">
                        <button
                          onClick={e => { e.stopPropagation(); requestDelete(f); }}
                          disabled={busy}
                          aria-label="Delete"
                          className="btn-icon-ghost btn-icon-sm btn-icon-danger"
                        >
                          <span className="material-symbols-outlined text-base">{busy ? 'hourglass_empty' : 'delete'}</span>
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── List: unchanged from the previous layout ────────────────── */
          <div className="flex flex-col gap-2.5">
            {sortedFiles.map(f => {
              const k          = KIND[f.kind] || { ...KIND_FALLBACK, badge: f.kind };
              const busy       = busyId === f.id;
              const isSel      = selected.has(f.id);
              const locked     = isProtected(f);
              return (
                <div
                  key={f.id}
                  className={`group flex items-center gap-3 bg-(--bg-card) rounded-[10px] py-2.5 px-3 ${isSel ? 'border-2 border-(--accent)' : 'border border-(--border-main)'}`}
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
                    <div className="text-[13px] font-medium text-(--text-primary) truncate">
                      {f.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                      {/* k.color is a per-file-kind lookup driven by f.kind — stays inline */}
                      <span
                        className="shrink-0 px-1.5 py-px rounded-[999px] text-white text-[9px] leading-[1.6] uppercase tracking-wider font-semibold"
                        style={{ background: k.color }}
                      >
                        {k.badge}
                      </span>
                      <span className="text-[11px] text-(--text-faint) truncate">
                        {f.campaignName ? f.campaignName + ' · ' : ''}{fmtSize(f.sizeBytes)} · {fmtDate(f.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions — hidden until the row is hovered or an action is focused */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [transition:opacity_0.12s_ease-in-out]">
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
