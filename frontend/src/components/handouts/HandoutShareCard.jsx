import { useState } from 'react';
import HandoutViewer from './HandoutViewer';

const typeIcon = (type) =>
  type === 'image' ? 'image' : type === 'bundle' ? 'stacks' : 'text_fields';

// ─── Inline image preview (Discord-style) ─────────────────────
function ImageShareCard({ handout, onView }) {
  return (
    <div
      onClick={onView}
      className="relative max-w-65 cursor-pointer rounded-[10px] overflow-hidden border-[0.5px] border-[#C0DD97] bg-[#0a0a0a]"
    >
      <img
        src={handout.content}
        alt={handout.title}
        className="block w-full max-h-50 object-contain"
      />
      <div className="absolute bottom-0 left-0 right-0 pt-[18px] px-2.5 pb-[7px] bg-[linear-gradient(transparent,rgba(0,0,0,0.65))] flex items-center justify-between">
        <span className="text-[11px] text-white font-medium overflow-hidden text-ellipsis whitespace-nowrap flex-1">
          {handout.title}
        </span>
        <span className="material-symbols-outlined text-[13px] text-white/70 shrink-0 ml-1">
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
      className="border-[0.5px] border-[#C0DD97] border-l-[2.5px] border-l-[#3B6D11] rounded-lg py-1.5 px-2.5 bg-white inline-flex gap-2 items-center max-w-70 cursor-pointer"
    >
      <div className="w-7.5 h-7.5 rounded-[5px] bg-[#EAF3DE] flex items-center justify-center text-[#3B6D11] shrink-0">
        <span className="material-symbols-outlined text-sm">
          {typeIcon(handout.type)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-[#3B6D11] font-medium">
          📎 Handout shared
        </div>
        <div className="text-xs font-medium text-[#1a0f05] overflow-hidden text-ellipsis whitespace-nowrap">
          {handout.title}
        </div>
      </div>
      <span className="material-symbols-outlined text-sm text-[#888780] shrink-0">
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
      className="cursor-pointer max-w-65 select-none"
    >
      {/* Stacked content cards — i=0 is front (bottom-left), i=n-1 is back (top-right) */}
      <div
        className="relative mb-2.5"
        style={{
          // width/height computed from live item count (n) + OFFSET — stacked card geometry, not static styling
          width:  CARD_W + (n - 1) * OFFSET,
          height: CARD_H + (n - 1) * OFFSET,
        }}
      >
        {preview.map((item, i) => (
          <div
            key={item.uuid}
            className={`absolute rounded-[10px] overflow-hidden border-[0.5px] border-[#C0DD97] shadow-[0_2px_6px_rgba(0,0,0,0.10)] ${item.type === 'image' ? 'bg-[#0a0a0a]' : 'bg-[#EAF3DE]'}`}
            style={{
              // top/left/width/height/zIndex computed from live item count (n) + index (i) — stacked card geometry
              top:    (n - 1 - i) * OFFSET,
              left:   i * OFFSET,
              width:  CARD_W,
              height: CARD_H,
              zIndex: n - i,
            }}
          >
            {item.type === 'image' && item.content ? (
              <img
                src={item.content}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2.5">
                <span className="material-symbols-outlined text-3xl text-[#3B6D11]">
                  {typeIcon(item.type)}
                </span>
                <span className="text-[10px] text-[#3B6D11] text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-[90%]">
                  {item.title}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer: title + count */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-[#3B6D11] font-medium">📦 Bundle shared</div>
          <div className="text-[13px] font-medium text-[#1a0f05] overflow-hidden text-ellipsis whitespace-nowrap">
            {handout.title}
          </div>
        </div>
        <div className="shrink-0 text-[10px] bg-[#EAF3DE] text-[#27500A] py-0.5 px-1.5 rounded-sm">
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
        className={`flex items-end gap-2 mb-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      >
        {/* Avatar — only for others, matches ChatBubble pattern */}
        {!isOwn && (
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-(--color-primary-light) flex items-center justify-center border border-(--border-main)">
            {avatar_url ? (
              <img
                src={(import.meta.env.VITE_API_URL || '') + avatar_url}
                alt={username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-sans text-[11px] font-semibold text-(--color-primary-dark)">
                {initials}
              </span>
            )}
          </div>
        )}

        {/* Outer card box — mirrors chat bubble shape, flipped for own messages */}
        <div className={`inline-block max-w-75 bg-(--bg-card) border border-(--border-main) py-2 px-2.5 relative ${isOwn ? 'rounded-[16px_16px_4px_16px]' : 'rounded-[16px_16px_16px_4px]'}`}>
          {/* Header: username · time + three-dot */}
          <div className="flex items-center gap-1.5 mb-2 font-sans">
            <span className="text-[11px] text-(--text-faint) flex-1">
              {isOwn
                ? <>You shared a handout{time ? <> · <span className="text-(--text-faint)">{time}</span></> : ''}</>
                : <><span className="text-(--accent) font-semibold">{username}</span>{' '}shared a handout{time ? ` · ${time}` : ''}</>
              }
            </span>

            {/* Always in flow when canDelete — visibility toggled so no layout shift on hover */}
            {canDelete && (
              <div className={`relative shrink-0 ${(hovered || menuOpen) ? 'visible' : 'invisible'}`}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(m => !m); }}
                  aria-label="Message actions"
                  className="btn-icon btn-icon-xs"
                >
                  <span className="material-symbols-outlined text-sm!">more_vert</span>
                </button>

                {menuOpen && (
                  <div className={`absolute top-full mt-1 bg-(--bg-card) rounded-md shadow-(--shadow-dropdown) z-200 min-w-0 overflow-hidden ${isOwn ? 'right-0 left-auto' : 'right-auto left-0'}`}>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1 w-full py-1 px-2 bg-none border-none cursor-pointer text-(--danger) text-[11px] font-sans text-left hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
                    >
                      <span className="material-symbols-outlined text-xs!">delete</span>
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
