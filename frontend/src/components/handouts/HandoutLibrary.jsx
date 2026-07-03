import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import apiClient from '../../api/client';
import UploadProgressBar from '../UploadProgressBar';
import CustomDropdown from '../ui/CustomDropdown';
import FileDropZone from '../ui/FileDropZone';
import ConfirmDialog from '../ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

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

// ─── shared classNames ────────────────────────────────────────
const inputCss = 'w-full py-2 px-2.75 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-[13px] outline-none! box-border block';

const primaryBtnCss = 'py-1.5 px-4 rounded-[7px] border-none bg-(--color-primary) text-white font-sans text-xs font-medium cursor-pointer';

const cancelBtnCss = 'py-1.5 px-4 rounded-[7px] border border-(--border-main) bg-transparent text-(--text-muted) font-sans text-xs cursor-pointer';

const miniBtnCss = 'py-0.5 px-1.75 rounded border border-(--border-main) bg-transparent text-(--text-muted) font-sans text-[10px] cursor-pointer';

// ─── HandoutEditModal ──────────────────────────────────────────
function HandoutEditModal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[rgba(0,0,0,0.45)] flex items-center justify-center z-200 p-5 [animation:hl-overlay-in_0.15s_ease]"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-115 [animation:hl-modal-in_0.2s_cubic-bezier(0.34,1.4,0.64,1)]"
      >
        {children}
      </div>
    </div>
  );
}

// ─── TextHandoutForm ───────────────────────────────────────────
function TextHandoutForm({ initial, onSave, onCancel, saving }) {
  const [title,   setTitle]   = useState(initial?.title   ?? '');
  const [content, setContent] = useState(initial?.content ?? '');

  return (
    <div className="bg-(--bg-card) rounded-[10px] border border-(--border-main) p-4 mb-4 [animation:hl-form-in_0.2s_ease]">
      <div className="text-[11px] font-semibold text-(--text-muted) mb-2.5 uppercase tracking-[0.07em]">
        {initial ? 'Edit Text Handout' : 'New Text Handout'}
      </div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className={`${inputCss} input-focus-glow focus:border-(--border-focus)`}
        autoFocus
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Handout text…"
        rows={5}
        className={`${inputCss} input-focus-glow focus:border-(--border-focus) resize-y mt-2`}
      />
      <div className="flex gap-2 mt-2.5">
        <button
          onClick={() => onSave(title.trim() || 'Untitled', content)}
          disabled={saving}
          className={primaryBtnCss}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} disabled={saving} className={cancelBtnCss}>Cancel</button>
      </div>
    </div>
  );
}

// ─── ImageEditForm ─────────────────────────────────────────────
function ImageEditForm({ initial, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(initial?.title ?? '');

  return (
    <div className="bg-(--bg-card) rounded-[10px] border border-(--border-main) p-4 mb-4 [animation:hl-form-in_0.2s_ease]">
      <div className="text-[11px] font-semibold text-(--text-muted) mb-2.5 uppercase tracking-[0.07em]">
        Rename Image
      </div>
      {initial?.content && (
        <img
          src={initial.content}
          alt={initial.title}
          className="w-full max-h-60 object-contain rounded-md mb-2.5 block bg-(--bg-section-hd)"
        />
      )}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Image name"
        className={`${inputCss} input-focus-glow focus:border-(--border-focus)`}
        autoFocus
      />
      <div className="flex gap-2 mt-2.5">
        <button
          onClick={() => onSave(title.trim() || 'Untitled')}
          disabled={saving}
          className={primaryBtnCss}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} disabled={saving} className={cancelBtnCss}>Cancel</button>
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
    <div className="bg-(--bg-card) rounded-[10px] border border-(--border-main) p-4 mb-4 [animation:hl-form-in_0.2s_ease]">
      <div className="text-[11px] font-semibold text-(--text-muted) mb-2.5 uppercase tracking-[0.07em]">
        {initial ? 'Edit Bundle' : 'New Bundle'}
      </div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Bundle title"
        className={`${inputCss} input-focus-glow focus:border-(--border-focus)`}
        autoFocus
      />

      <div className="mt-3.5 mb-2 text-[11px] font-semibold text-(--text-muted) uppercase tracking-[0.07em]">
        Add to bundle
        <span className="font-normal normal-case tracking-normal ml-1.25 text-[10px]">
          (hold to preview)
        </span>
      </div>

      {available.length === 0 ? (
        <div className="p-3 text-xs text-(--text-faint) italic text-center border border-(--border-main) rounded-lg">
          No handouts yet
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-1.75 max-h-55 overflow-y-auto overscroll-contain p-0.5">
          {available.map(h => {
            const isSel = selected.includes(h.uuid);
            return (
              <div
                key={h.uuid}
                onPointerDown={e => handlePointerDown(e, h)}
                onPointerUp={() => handlePointerUp(h)}
                onPointerLeave={handlePointerLeave}
                className={`rounded-lg overflow-hidden cursor-pointer relative select-none [transition:border-color_0.1s,box-shadow_0.1s] ${isSel ? 'border-2 border-(--color-primary) shadow-[0_0_0_2px_var(--accent-bg)]' : 'border border-(--border-main) shadow-none'}`}
              >
                {/* Thumbnail */}
                <div className={`h-14.5 flex items-center justify-center overflow-hidden ${h.type === 'image' ? 'bg-(--accent-bg)' : 'bg-(--bg-section-hd)'}`}>
                  {h.type === 'image' && h.content ? (
                    <img src={h.content} alt={h.title}
                      className="w-full h-full object-cover pointer-events-none" />
                  ) : (
                    <span className={`material-symbols-outlined text-[22px] opacity-70 ${isSel ? 'text-(--color-primary)' : 'text-(--text-faint)'}`}>
                      {typeIcon(h.type)}
                    </span>
                  )}
                </div>
                {/* Title */}
                <div className="py-0.75 px-1.25 text-[10px] font-sans text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap bg-(--bg-card)">
                  {h.title}
                </div>
                {/* Selected checkmark */}
                {isSel && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-(--color-primary) flex items-center justify-center">
                    <span className="material-symbols-outlined text-[11px] text-white">check</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <>
          <div className="mt-3.5 mb-1.5 text-[11px] font-semibold text-(--text-muted) uppercase tracking-[0.07em]">
            Order ({selected.length})
          </div>
          <div className="flex flex-col gap-0.75">
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
                  className="flex items-center gap-2 py-1.25 px-2 rounded-md border border-(--border-main) bg-(--bg-page) cursor-grab text-xs"
                >
                  <span className="material-symbols-outlined text-sm text-(--text-faint) shrink-0">
                    drag_indicator
                  </span>
                  <span className="material-symbols-outlined text-[13px] text-(--accent) shrink-0">
                    {typeIcon(h.type)}
                  </span>
                  <span className="flex-1 text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap">
                    {h.title}
                  </span>
                  <button
                    onClick={() => toggleItem(uuid)}
                    className="bg-none border-none cursor-pointer text-(--text-faint) py-0 px-0.5 text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="flex gap-2 mt-3.5">
        <button
          onClick={() => onSave(title.trim() || 'Untitled', selected)}
          disabled={saving}
          className={primaryBtnCss}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} disabled={saving} className={cancelBtnCss}>Cancel</button>
      </div>

      {/* Hold-to-preview overlay */}
      {preview && createPortal(
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.72)] flex items-center justify-center z-400 p-6 [animation:hl-overlay-in_0.1s_ease] pointer-events-none">
          {preview.type === 'image' && preview.content ? (
            <img
              src={preview.content}
              alt={preview.title}
              className="max-w-[90vw] max-h-[85vh] rounded-[10px] shadow-[0_8px_40px_rgba(0,0,0,0.5)] pointer-events-none"
            />
          ) : (
            <div className="bg-(--bg-card) rounded-xl p-6 max-w-110 w-full shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-lg text-(--accent)">
                  {typeIcon(preview.type)}
                </span>
                <span className="font-serif text-base text-(--text-primary)">
                  {preview.title}
                </span>
              </div>
              {preview.content && (
                <div className="font-sans text-[13px] text-(--text-secondary) leading-[1.6] whitespace-pre-wrap max-h-[60vh] overflow-y-auto overscroll-contain">
                  {preview.content}
                </div>
              )}
              {preview.type === 'bundle' && (
                <div className="text-[11px] text-(--text-faint) mt-2">
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
      className="bg-(--bg-card) rounded-[10px] border border-(--border-main) overflow-hidden cursor-pointer [transition:border-color_0.12s]"
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}
    >
      <div className={`h-16 flex items-center justify-center overflow-hidden ${isImage ? 'bg-(--accent-bg)' : 'bg-(--bg-section-hd)'}`}>
        {isImage && handout.content ? (
          <img
            src={handout.content}
            alt={handout.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-[28px] text-(--text-faint) opacity-50">
            {typeIcon(handout.type)}
          </span>
        )}
      </div>
      <div className="py-1.5 px-2">
        <div className="text-[11px] font-medium text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap mb-1">
          {handout.title}
        </div>
        <div className="flex gap-1">
          <button
            onClick={e => { e.stopPropagation(); onDelete(handout); }}
            className={`${miniBtnCss} text-(--danger) border-(--danger)`}
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
    <div className="relative mt-2 mb-1">
      {/* Stack layer 2 — furthest back */}
      <div className="absolute top-[-6px] left-1 right-1 h-full bg-(--accent-bg) border-[0.5px] border-(--color-primary-mid) rounded-[10px] z-0" />
      {/* Stack layer 1 */}
      <div className="absolute top-[-3px] left-0.5 right-0.5 h-full bg-(--accent-bg) border-[0.5px] border-(--color-primary-mid) rounded-[10px] z-1" />
      {/* Main card */}
      <div
        onClick={() => onEdit(bundle)}
        className="relative z-2 bg-(--bg-card) border-[0.5px] border-(--color-primary-mid) rounded-[10px] overflow-hidden cursor-pointer [transition:border-color_0.12s]"
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-primary-mid)'}
      >
        {/* Preview */}
        <div className="h-16 bg-(--accent-bg) flex items-center justify-center gap-2">
          {items.length === 0 ? (
            <span className="material-symbols-outlined text-2xl text-(--accent) opacity-40">
              stacks
            </span>
          ) : items.slice(0, 3).map((item, i) => (
            <span key={item.uuid} className={`material-symbols-outlined text-(--accent) ${i === 0 ? 'text-2xl opacity-100' : 'text-lg opacity-60'}`}>
              {typeIcon(item.type)}
            </span>
          ))}
        </div>

        {/* Item count badge */}
        <div className="absolute top-1.5 right-1.5 bg-(--color-primary) text-(--color-primary-light) text-[10px] py-px px-1.25 rounded-[10px]">
          {items.length}
        </div>

        {/* Footer */}
        <div className="py-1.5 px-2 flex items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap">
              {bundle.title}
            </div>
            <div className="text-[9px] bg-(--accent-bg) text-(--accent) py-px px-1.25 rounded mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap">
              bundle · {items.length} item{items.length !== 1 ? 's' : ''}{isNested ? ' · nested' : ''}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(bundle); }}
            className={`${miniBtnCss} text-(--danger) border-(--danger) shrink-0`}
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
    <div className="bg-(--bg-card) rounded-[10px] border border-(--border-main) overflow-hidden opacity-60">
      <div className="h-16 bg-(--accent-bg) flex items-center justify-center">
        <span className="material-symbols-outlined text-[22px] text-(--accent) opacity-50">
          upload
        </span>
      </div>
      <div className="py-1.5 px-2">
        <div className="text-[11px] text-(--text-faint) italic">
          Uploading…
        </div>
      </div>
    </div>
  );
}

// ─── Section heading ───────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <div className="text-[11px] font-semibold text-(--text-muted) uppercase tracking-[0.08em] mb-2.5">
      {children}
    </div>
  );
}

// ─── Grid ──────────────────────────────────────────────────────
function Grid({ children }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5 mb-6">
      {children}
    </div>
  );
}

// ─── CreateTile (dashed create box) ────────────────────────────
function CreateTile({ icon, label, hint, chevron, innerRef, onClick, style }) {
  return (
    <button
      ref={innerRef}
      onClick={onClick}
      className="bg-transparent border-2 border-dashed border-(--border-main) rounded-[var(--radius-squircle,12px)] text-(--text-muted) cursor-pointer w-full h-full min-h-20 box-border p-2.5 flex flex-col items-center justify-center gap-1 font-sans [transition:border-color_0.15s,color_0.15s]"
      style={style}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.color = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      <span className="flex items-center gap-1.25">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
        <span className="text-[13px] font-semibold">{label}</span>
        {chevron && <span className="material-symbols-outlined text-base">expand_more</span>}
      </span>
      {hint && (
        <span className="text-[10px] text-(--text-faint) text-center leading-[1.3]">
          {hint}
        </span>
      )}
    </button>
  );
}

// ─── AddMenu (Image / Text popover) ────────────────────────────
function AddMenu({ anchorRef, onImage, onText, onClose }) {
  const menuRef = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (anchorRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchorRef, onClose]);

  const itemCss = 'flex items-center gap-2 w-full py-2 px-3 text-[13px] text-(--text-primary) font-sans cursor-pointer bg-transparent border-none text-left';

  return (
    <div
      ref={menuRef}
      className="absolute top-[calc(100%+6px)] left-0 z-60 min-w-42 bg-(--bg-card) border border-(--border-main) rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.18)] overflow-hidden [animation:hl-form-in_0.12s_ease]"
    >
      <button
        className={itemCss} onClick={onImage}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span className="material-symbols-outlined text-lg text-(--accent)">image</span>
        <span className="flex-1">Image</span>
        <span className="text-[10px] text-(--text-faint)">upload</span>
      </button>
      <button
        className={itemCss} onClick={onText}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span className="material-symbols-outlined text-lg text-(--accent)">text_fields</span>
        <span className="flex-1">Text</span>
      </button>
    </div>
  );
}

// ─── StagingModal (review files before upload) ─────────────────
function StagingModal({ items, onRemove, onCancel, onUpload, uploading }) {
  const validCount = items.filter(i => i.isImage).length;
  return (
    <HandoutEditModal onClose={uploading ? () => {} : onCancel}>
      <div className="bg-(--bg-card) rounded-xl border border-(--border-main) p-4.5">
        <div className="text-[11px] font-semibold text-(--text-muted) uppercase tracking-[0.07em] mb-3">
          Ready to upload ({validCount})
        </div>
        <div className="flex flex-col gap-1.5 max-h-85 overflow-y-auto overscroll-contain">
          {items.map(it => (
            <div
              key={it.id}
              className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg border border-(--border-main) ${it.isImage ? 'bg-(--bg-page) opacity-100' : 'bg-(--bg-section-hd) opacity-60'}`}
            >
              <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-(--bg-section-hd) flex items-center justify-center">
                {it.isImage ? (
                  <img src={it.url} alt={it.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-lg text-(--text-faint)">block</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap">
                  {it.name}
                </div>
                {!it.isImage && (
                  <div className="text-[10px] text-(--danger) mt-px">
                    not an image — will be skipped
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemove(it.id)}
                disabled={uploading}
                className="bg-none border-none cursor-pointer text-(--text-faint) text-lg leading-none py-0 px-0.5"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3.5">
          <button
            onClick={onUpload}
            disabled={uploading || validCount === 0}
            className={`${primaryBtnCss} ${validCount === 0 ? 'opacity-50' : 'opacity-100'}`}
          >
            {uploading ? 'Uploading…' : `Upload ${validCount} file${validCount !== 1 ? 's' : ''}`}
          </button>
          <button onClick={onCancel} disabled={uploading} className={cancelBtnCss}>Cancel</button>
        </div>
      </div>
    </HandoutEditModal>
  );
}

// ─── HandoutLibrary ────────────────────────────────────────────
export default function HandoutLibrary({ campaignUuid }) {
  const [handouts,       setHandouts]      = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [creating,       setCreating]      = useState(null); // 'text' | 'bundle' | null
  const [editing,        setEditing]       = useState(null); // handout object | null
  const { confirm, dialogProps } = useConfirm();
  const [saving,         setSaving]        = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [handoutProgress, setHandoutProgress] = useState(null);
  const [stats,          setStats]         = useState({ imageCount: 0 });
  const [sortBy,         setSortBy]        = useState(
    () => localStorage.getItem('handout-library-sort') || 'date-desc'
  );
  const [staged,           setStaged]           = useState([]); // files awaiting upload review
  const [stagingUploading, setStagingUploading] = useState(false);
  const [addMenuOpen,      setAddMenuOpen]      = useState(false);
  const fileInputRef = useRef(null);
  const addTileRef   = useRef(null);

  // Revoke any outstanding object URLs on unmount
  const stagedRef = useRef(staged);
  useEffect(() => { stagedRef.current = staged; }, [staged]);
  useEffect(() => () => {
    stagedRef.current.forEach(i => i.url && URL.revokeObjectURL(i.url));
  }, []);

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
    localStorage.setItem('handout-library-sort', val);
  };

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

  // ── Staging (review files before upload) ──────────────────
  const stageFiles = (files) => {
    if (!files || files.length === 0) return;
    const additions = files.map(f => {
      const isImage = f.type.startsWith('image/');
      return {
        id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        file: f,
        name: f.name,
        isImage,
        url: isImage ? URL.createObjectURL(f) : null,
      };
    });
    setStaged(prev => [...prev, ...additions]);
  };

  const removeStaged = (id) => {
    setStaged(prev => {
      const target = prev.find(i => i.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter(i => i.id !== id);
    });
  };

  const clearStaged = () => {
    setStaged(prev => {
      prev.forEach(i => i.url && URL.revokeObjectURL(i.url));
      return [];
    });
  };

  const handleStagedUpload = async () => {
    const valid = staged.filter(i => i.isImage);
    if (valid.length === 0) return;
    setStagingUploading(true);
    try {
      await Promise.all(valid.map(i => uploadImage(i.file)));
    } finally {
      setStagingUploading(false);
      clearStaged();
    }
  };

  // ── Image upload ──────────────────────────────────────────
  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    stageFiles(files);
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
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) setHandoutProgress(Math.round((e.loaded / e.total) * 100));
          },
        }
      );
      setHandouts(prev => [...prev, res.data]);
      setStats(s => ({ ...s, imageCount: s.imageCount + 1 }));
    } catch {
      alert(`Failed to upload ${file.name}.`);
    } finally {
      setUploadingCount(n => {
        const next = n - 1;
        if (next <= 0) setHandoutProgress(null);  // clear bar when no uploads remain
        return next;
      });
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
  const handleDelete = async (h) => {
    const isBundle = h.type === 'bundle';
    const ok = await confirm({
      title: isBundle ? 'Delete bundle?' : 'Delete handout?',
      message: isBundle
        ? `Delete "${h.title}"? This will delete the bundle but not its contents.`
        : `Delete "${h.title}"? This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/campaigns/${campaignUuid}/handouts/${h.uuid}`);
      setHandouts(prev => prev.filter(item => item.uuid !== h.uuid));
    } catch {
      alert('Failed to delete handout.');
    }
  };

  // ── Edit dispatch ──────────────────────────────────────────
  const handleEdit = (handout) => {
    setCreating(null);
    setEditing(handout);
  };

  const handleCancelEdit = () => setEditing(null);
  const handleCancelCreate = () => setCreating(null);

  const { bundles, individual } = useMemo(() => {
    const sorted = [...handouts].sort(applySortFn);
    return {
      bundles:    sorted.filter(h => h.type === 'bundle'),
      individual: sorted.filter(h => h.type !== 'bundle'),
    };
  }, [handouts, sortBy]);

  if (loading) {
    return (
      <div className="py-10 px-0 text-center text-(--text-faint) text-[13px]">
        Loading handouts…
      </div>
    );
  }

  return (
    <FileDropZone
      global
      onFiles={stageFiles}
      overlayLabel="Drop images to upload"
      overlayIcon="upload"
    >
      {/* Hidden file input — multiple files allowed */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilePick}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="font-serif text-xl text-(--text-primary) m-0">
            Handout library
          </h2>
          <div className="mt-0.75 text-[11px] text-(--text-faint) flex items-center gap-1 font-sans">
            <span className="material-symbols-outlined text-xs">public</span>
            {stats.imageCount} image{stats.imageCount !== 1 ? 's' : ''} across all campaigns
          </div>
        </div>
        <div className="w-47.5 shrink-0">
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
      </div>

      {/* Upload progress */}
      {handoutProgress !== null && (
        <div className="mb-2">
          <UploadProgressBar progress={handoutProgress} />
        </div>
      )}

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
      <div className="mb-6">
        <SectionHeading>Bundles</SectionHeading>
        <Grid>
          {bundles.map(b => (
            <BundleCard
              key={b.uuid}
              bundle={b}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          <CreateTile
            icon="stacks"
            label="New bundle"
            hint="group handouts together"
            style={{ marginTop: 8, marginBottom: 4, height: 'calc(100% - 12px)' }}
            onClick={() => { setAddMenuOpen(false); setEditing(null); setCreating('bundle'); }}
          />
        </Grid>
      </div>

      {/* ── Individual handouts section ── */}
      <div>
        <SectionHeading>Individual handouts</SectionHeading>
        <Grid>
          {individual.map(h => (
            <HandoutCard
              key={h.uuid}
              handout={h}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          {Array.from({ length: uploadingCount }).map((_, i) => <LoadingCard key={`loading-${i}`} />)}
          <div className="relative flex flex-col">
            <CreateTile
              innerRef={addTileRef}
              icon="add"
              label="Add handout"
              chevron
              hint="click, or drag & drop images"
              style={{ flex: 1 }}
              onClick={() => setAddMenuOpen(o => !o)}
            />
            {addMenuOpen && (
              <AddMenu
                anchorRef={addTileRef}
                onImage={() => { setAddMenuOpen(false); fileInputRef.current?.click(); }}
                onText={() => { setAddMenuOpen(false); setEditing(null); setCreating('text'); }}
                onClose={() => setAddMenuOpen(false)}
              />
            )}
          </div>
        </Grid>
      </div>

      {/* Staging review modal */}
      {staged.length > 0 && (
        <StagingModal
          items={staged}
          onRemove={removeStaged}
          onCancel={() => { if (!stagingUploading) clearStaged(); }}
          onUpload={handleStagedUpload}
          uploading={stagingUploading}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog {...dialogProps} />
    </FileDropZone>
  );
}
