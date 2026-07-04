import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import apiClient from '../../api/client';
import Tooltip from '../ui/Tooltip';

const SORT_OPTIONS = [
  { value: 'date-desc',   label: 'Date added: newest' },
  { value: 'date-asc',    label: 'Date added: oldest' },
  { value: 'name-asc',    label: 'Name A–Z' },
  { value: 'name-desc',   label: 'Name Z–A' },
  { value: 'type-images', label: 'Type: images first' },
  { value: 'type-text',   label: 'Type: text first' },
];

if (typeof document !== 'undefined' && !document.getElementById('khp-styles')) {
  const s = document.createElement('style');
  s.id = 'khp-styles';
  s.textContent = `@keyframes khp-in { from { opacity: 0 } to { opacity: 1 } }`;
  document.head.appendChild(s);
}

const typeIcon = (type) =>
  type === 'image' ? 'image' : type === 'bundle' ? 'stacks' : 'text_fields';

const labelCss = 'text-[10px] font-semibold text-(--text-muted) uppercase tracking-[0.08em] font-sans';

const shareCss = 'text-[10px] text-(--accent) font-medium py-0.5 px-1.75 border-[0.5px] border-(--color-primary-mid) rounded bg-(--accent-bg) whitespace-nowrap font-sans cursor-pointer shrink-0';

// ─── Preview portal ─────────────────────────────────────────────
function PreviewPortal({ item }) {
  if (!item) return null;
  return createPortal(
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.72)] flex items-center justify-center z-400 p-6 [animation:khp-in_0.1s_ease] pointer-events-none">
      {item.type === 'image' && item.content ? (
        <img src={item.content} alt={item.title} className="max-w-[90vw] max-h-[85vh] rounded-[10px] shadow-[0_8px_40px_rgba(0,0,0,0.5)]" />
      ) : (
        <div className="bg-(--bg-card) rounded-xl p-6 max-w-110 w-full shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="material-symbols-outlined text-lg text-(--accent)">
              {typeIcon(item.type)}
            </span>
            <span className="font-serif text-base text-(--text-primary)">
              {item.title}
            </span>
          </div>
          {item.content && (
            <div className="font-sans text-[13px] text-(--text-secondary) leading-[1.6] whitespace-pre-wrap max-h-[60vh] overflow-y-auto overscroll-contain">
              {item.content}
            </div>
          )}
          {item.type === 'bundle' && (
            <div className="text-[11px] text-(--text-faint) mt-2">
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
    <div {...hold} className="rounded-md overflow-hidden select-none border border-(--border-main) cursor-default">
      <div className={`h-9.5 overflow-hidden flex items-center justify-center ${item.type === 'image' ? 'bg-(--accent-bg)' : 'bg-(--bg-section-hd)'}`}>
        {item.type === 'image' && item.content ? (
          <img src={item.content} alt=""
            className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <span className="material-symbols-outlined text-[15px] text-(--text-faint) opacity-60">
            {typeIcon(item.type)}
          </span>
        )}
      </div>
      <div className="py-0.5 px-1 text-[9px] font-sans text-(--text-muted) overflow-hidden text-ellipsis whitespace-nowrap bg-(--bg-card)">
        {item.title}
      </div>
    </div>
  );
}

// ─── Grid item card ──────────────────────────────────────────────
function GridItemCard({ item, sharing, isShared, onShare, hold }) {
  return (
    <div {...hold} className="rounded-lg overflow-hidden select-none border border-(--border-main) bg-(--bg-card)">
      <div className={`h-15 relative overflow-hidden flex items-center justify-center ${item.type === 'image' ? 'bg-(--accent-bg)' : 'bg-(--bg-section-hd)'}`}>
        {item.type === 'image' && item.content ? (
          <img src={item.content} alt={item.title}
            className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <span className="material-symbols-outlined text-2xl text-(--text-faint) opacity-60">
            {typeIcon(item.type)}
          </span>
        )}
        {isShared && (
          <div className="absolute bottom-0.75 right-0.75 bg-(--color-primary) rounded py-px px-1 text-[9px] text-white">shared</div>
        )}
      </div>
      <div className="py-1 px-1.5 flex items-center gap-1">
        <div className="flex-1 text-[10px] font-sans text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap">{item.title}</div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onShare}
          disabled={sharing}
          className={`${shareCss} py-px px-1.25 ${sharing ? 'opacity-70' : 'opacity-100'}`}
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
    <div className="relative mt-1.25 mb-0.5">
      <div className="absolute top-[-4px] left-[3px] right-[3px] h-full bg-(--accent-bg) border-[0.5px] border-(--color-primary-mid) rounded-lg z-0" />
      <div className="absolute top-[-2px] left-[1.5px] right-[1.5px] h-full bg-(--accent-bg) border-[0.5px] border-(--color-primary-mid) rounded-lg z-1" />
      <div {...hold} className={`relative z-2 rounded-lg overflow-hidden bg-(--bg-card) cursor-pointer select-none [transition:border-color_0.1s] ${expanded ? 'border-[0.5px] border-(--color-primary)' : 'border-[0.5px] border-(--color-primary-mid)'}`}>
        {/* Thumbnail area */}
        <div className="h-15 bg-(--accent-bg) relative flex items-center justify-center gap-1 overflow-hidden">
          {items.length === 0 ? (
            <span className="material-symbols-outlined text-[22px] text-(--accent) opacity-40">stacks</span>
          ) : items.slice(0, 3).map((it, i) => (
            it.type === 'image' && it.content ? (
              <img key={it.uuid} src={it.content} alt=""
                className={`rounded object-cover pointer-events-none ${i === 0 ? 'w-8.5 h-8.5 opacity-100' : 'w-5.5 h-5.5 opacity-70'}`}
              />
            ) : (
              <span key={it.uuid} className={`material-symbols-outlined text-(--accent) ${i === 0 ? 'text-[22px] opacity-100' : 'text-base opacity-60'}`}>
                {typeIcon(it.type)}
              </span>
            )
          ))}
          <div className="absolute top-1 left-1 bg-(--color-primary) text-white text-[9px] py-px px-1.25 rounded-[10px]">{items.length}</div>
          {isShared && (
            <div className="absolute bottom-0.75 right-0.75 bg-(--color-primary) rounded py-px px-1 text-[9px] text-white">shared</div>
          )}
          <span className="material-symbols-outlined absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[13px] text-(--accent) opacity-80">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
        {/* Footer */}
        <div className="py-1 px-1.5 flex items-center gap-1">
          <div className="flex-1 text-[10px] font-sans text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap">{bundle.title}</div>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onShare}
            disabled={sharing}
            className={`${shareCss} py-px px-1.25 ${sharing ? 'opacity-70' : 'opacity-100'}`}
          >
            {sharing ? '…' : 'Share'}
          </button>
        </div>
        {/* Expanded sub-items */}
        {expanded && items.length > 0 && (
          <div
            onPointerDown={e => e.stopPropagation()}
            className="py-1.5 px-1.5 pb-2 border-t border-(--border-subtle)"
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-1">
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
    <div {...hold} className="bg-(--bg-card) border-[0.5px] border-(--border-main) rounded-lg py-1.75 px-2.5 flex items-center gap-2 select-none">
      <div className={`w-8 h-8 rounded-md shrink-0 overflow-hidden flex items-center justify-center ${item.type === 'image' ? 'bg-(--accent-bg) text-(--accent)' : 'bg-(--bg-section-hd) text-(--text-muted)'}`}>
        {item.type === 'image' && item.content ? (
          <img src={item.content} alt={item.title}
            className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-base">{typeIcon(item.type)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap">{item.title}</div>
        <div className="text-[10px] text-(--text-faint) flex items-center gap-1.25">
          {item.type}
          {isShared && (
            <span className="bg-(--color-primary) text-white rounded py-px px-1 text-[9px]">shared</span>
          )}
        </div>
      </div>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onShare}
        disabled={sharing}
        className={`${shareCss} ${sharing ? 'cursor-default' : 'cursor-pointer'} ${sharing ? 'opacity-70' : 'opacity-100'}`}
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
    <div className="relative mt-1.25 mb-0.5">
      <div className="absolute top-[-4px] left-[3px] right-[3px] h-full bg-(--accent-bg) border-[0.5px] border-(--color-primary-mid) rounded-lg z-0" />
      <div className="absolute top-[-2px] left-[1.5px] right-[1.5px] h-full bg-(--accent-bg) border-[0.5px] border-(--color-primary-mid) rounded-lg z-1" />
      <div className="relative z-2">
        {/* Bundle header row */}
        <div {...hold} className={`bg-(--bg-card) py-1.75 px-2.5 flex items-center gap-2 cursor-pointer select-none [transition:border-color_0.1s] ${expanded ? 'border-[0.5px] border-(--color-primary)' : 'border-[0.5px] border-(--color-primary-mid)'} ${expanded && items.length > 0 ? 'rounded-t-lg' : 'rounded-lg'}`}>
          <div className="w-8 h-8 rounded-md shrink-0 bg-(--accent-bg) flex items-center justify-center text-(--accent)">
            <span className="material-symbols-outlined text-base">stacks</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap">{bundle.title}</div>
            <div className="text-[10px] text-(--text-faint) flex items-center gap-1.25">
              {items.length} item{items.length !== 1 ? 's' : ''}
              {isShared && (
                <span className="bg-(--color-primary) text-white rounded py-px px-1 text-[9px]">shared</span>
              )}
            </div>
          </div>
          <span className="material-symbols-outlined text-base text-(--text-faint) shrink-0">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onShare}
            disabled={sharing}
            className={`${shareCss} ${sharing ? 'cursor-default' : 'cursor-pointer'} ${sharing ? 'opacity-70' : 'opacity-100'}`}
          >
            {sharing ? '…' : 'Share'}
          </button>
        </div>
        {/* Expanded sub-items */}
        {expanded && items.length > 0 && (
          <div
            onPointerDown={e => e.stopPropagation()}
            className={`bg-(--bg-card) border-t border-(--border-subtle) rounded-b-lg py-1.5 px-2.5 pb-2 flex flex-col gap-1 ${expanded ? 'border-[0.5px] border-(--color-primary)' : 'border-[0.5px] border-(--color-primary-mid)'}`}
          >
            {items.map(sub => (
              <div
                key={sub.uuid}
                {...makeHold(sub)}
                className="flex items-center gap-2 py-1 px-1.5 rounded-md border border-(--border-subtle) bg-(--bg-page) select-none"
              >
                <div className={`w-6 h-6 rounded shrink-0 overflow-hidden flex items-center justify-center ${sub.type === 'image' ? 'bg-(--accent-bg)' : 'bg-(--bg-section-hd)'}`}>
                  {sub.type === 'image' && sub.content ? (
                    <img src={sub.content} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[13px] text-(--text-faint)">
                      {typeIcon(sub.type)}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-[11px] font-sans text-(--text-secondary) overflow-hidden text-ellipsis whitespace-nowrap">{sub.title}</div>
                <span className="text-[9px] text-(--text-faint) font-sans shrink-0">{sub.type}</span>
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
  const [sortOpen,    setSortOpen]    = useState(false);
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

  const viewToggleCss = (active) =>
    `py-0.75 px-1.75 border-none rounded [transition:background_0.1s,color_0.1s] cursor-pointer flex items-center ${active ? 'bg-(--accent-bg) text-(--color-primary)' : 'bg-transparent text-(--text-faint)'}`;

  if (loading) {
    return (
      <div className="p-4 text-(--text-faint) text-xs italic font-sans">
        Loading handouts…
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-3.5">

      {/* Header: title + sort icon + view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2 min-h-9">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) font-sans">Handouts</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sort — icon button + dropdown menu */}
          <div className="relative">
            <Tooltip content="Sort">
            <button
              onClick={() => setSortOpen(o => !o)}
              className="p-1 rounded-[7px] border border-(--border-main) bg-(--bg-card) text-(--text-muted) cursor-pointer flex items-center [transition:color_0.1s,border-color_0.1s]"
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <span className="icon icon-sm">swap_vert</span>
            </button>
            </Tooltip>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                <div className="absolute top-full right-0 mt-1 z-50 bg-(--bg-card) border border-(--border-main) rounded-lg shadow-(--shadow-dropdown) overflow-hidden py-1 min-w-44">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { handleSortChange(opt.value); setSortOpen(false); }}
                      className={`block w-full text-left py-1.5 px-3 text-[12px] font-sans cursor-pointer whitespace-nowrap [transition:background_0.1s] ${sortBy === opt.value ? 'text-(--accent) bg-(--accent-bg) font-medium' : 'text-(--text-primary) bg-transparent'}`}
                      onMouseEnter={e => { if (sortBy !== opt.value) e.currentTarget.style.background = 'var(--bg-section-hd)'; }}
                      onMouseLeave={e => { if (sortBy !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* View toggle */}
          <div className="inline-flex gap-0.5 p-0.5 border border-(--border-main) rounded-[7px] bg-(--bg-card)">
            <button className={viewToggleCss(view === 'list')} onClick={() => changeView('list')}>
              <span className="icon icon-sm">list</span>
            </button>
            <button className={viewToggleCss(view === 'grid')} onClick={() => changeView('grid')}>
              <span className="icon icon-sm">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bundles */}
      {bundles.length > 0 && (
        <div>
          <div className={`${labelCss} mb-1.75`}>Bundles</div>
          {view === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] items-start gap-2.5">
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
            <div className="flex flex-col gap-2.5">
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
          <div className={`${labelCss} mb-1.75`}>Individual</div>
          {view === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
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
            <div className="flex flex-col gap-1.5">
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
        <div className="text-center py-8 px-4 border border-dashed border-(--border-main) rounded-lg text-xs text-(--text-faint) italic font-sans">
          No handouts yet — add them from the manage page
        </div>
      )}

      {/* Manage link */}
      <button
        onClick={() => navigate('/keeper', { state: { openCampaignUuid: campaignUuid, openTab: 'handouts', returnTo: `/campaign/${campaignUuid}` } })}
        className="w-full py-2 px-3 border border-dashed border-(--border-main) rounded-lg bg-transparent text-(--text-muted) font-sans text-xs cursor-pointer flex items-center justify-center gap-1.25"
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-main)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <span className="material-symbols-outlined text-sm">library_books</span>
        Manage handout library
      </button>

      <PreviewPortal item={preview} />
    </div>
  );
}
