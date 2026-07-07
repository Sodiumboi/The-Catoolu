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
      className={`flex items-end gap-2 mb-2 relative ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
    >
      {/* Portrait / avatar */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-(--color-primary-light) flex items-center justify-center border border-(--border-main)">
          {msg.portrait ? (
            <img
              src={'data:image/jpeg;base64,' + msg.portrait}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : msg.avatar_url ? (
            <img
              src={(import.meta.env.VITE_API_URL || '') + msg.avatar_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-sans text-[11px] font-semibold text-(--color-primary-dark)">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      )}

      <div className="max-w-[65%]">
        <div className={`py-2 px-3 text-sm leading-normal break-words whitespace-pre-wrap font-sans ${isOwn ? 'bg-(--color-primary) text-white border-none rounded-[16px_16px_4px_16px]' : 'bg-(--bg-card) text-(--text-primary) border border-(--border-main) rounded-[16px_16px_16px_4px]'}`}>
          {msg.image_urls?.length > 0 && (
            <div className={`grid gap-1 max-w-65 ${msg.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${msg.content ? 'mb-1.5' : 'mb-0'}`}>
              {msg.image_urls.map((url, i) => {
                const single = msg.image_urls.length === 1;
                return (
                  <img
                    key={i}
                    src={url}
                    alt={'Shared image ' + (i + 1)}
                    loading="lazy"
                    onClick={() => setViewingImage(url)}
                    className={`w-full rounded-md cursor-pointer block ${single ? 'max-h-70 object-contain' : 'aspect-square object-cover'}`}
                  />
                );
              })}
            </div>
          )}
          {msg.content}
          <div className="flex items-center justify-end gap-1.25 mt-1">
            {!isOwn && (
              <>
                <span className="text-[10px] text-(--accent) font-semibold">
                  {displayName}
                </span>
                <span className="text-[10px] text-(--text-faint)">·</span>
              </>
            )}
            <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-(--text-faint)'}`}>
              {time}
            </span>
          </div>
        </div>
      </div>

      {/* Three-dot action button */}
      {canDelete && (hovered || menuOpen) && (
        <div className="self-end shrink-0 relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(m => !m); }}
            aria-label="Message actions"
            className="btn-icon btn-icon-xs"
          >
            <span className="material-symbols-outlined text-sm!">more_vert</span>
          </button>

          {menuOpen && (
            <div className={`absolute bottom-full mb-1 bg-(--bg-card) rounded-md shadow-(--shadow-dropdown) z-200 min-w-0 overflow-hidden ${isOwn ? 'right-0 left-auto' : 'right-auto left-0'}`}>
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
