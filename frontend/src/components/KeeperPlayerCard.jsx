import { useRef } from 'react';
import Tooltip from './ui/Tooltip';

export default function KeeperPlayerCard({
  member,
  onOpenSheet,
  onRequestRoll,
  pendingRequests,
  onCancelRequest,
}) {
  const { character_name, character_occupation, username } = member;
  const rollBtnRef = useRef(null);

  const pending = pendingRequests || [];

  return (
    <div className="bg-(--bg-card) border border-(--border-main) rounded-[10px] p-3 mb-2.5 relative">
      {/* Top-right action buttons */}
      <div className="absolute top-2.5 right-2.5 flex gap-1">
        {member.character_id && onRequestRoll && (
          <Tooltip content="Request a roll">
          <button
            ref={rollBtnRef}
            onClick={e => { e.stopPropagation(); onRequestRoll(member, rollBtnRef.current?.getBoundingClientRect()); }}
            aria-label="Request a roll"
            className="bg-none border-none cursor-pointer text-(--text-faint) flex items-center p-0.5 rounded-sm [transition:color_0.1s] hover:text-(--accent)"
          >
            <span className="icon icon-sm">casino</span>
          </button>
          </Tooltip>
        )}
        {member.character_id && onOpenSheet && (
          <Tooltip content="View character sheet">
          <button
            onClick={e => { e.stopPropagation(); onOpenSheet(member); }}
            aria-label="View character sheet"
            className="bg-none border-none cursor-pointer text-(--text-faint) flex items-center p-0.5 rounded-sm [transition:color_0.1s] hover:text-(--accent)"
          >
            <span className="icon icon-sm">open_in_new</span>
          </button>
          </Tooltip>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2.5 pb-2.5 border-b border-(--border-main)">
        {/* Portrait */}
        <div className="w-11 h-11 rounded-lg bg-(--color-primary-light) flex items-center justify-center shrink-0 font-serif text-lg text-(--color-primary-dark) overflow-hidden border border-(--border-main)">
          {member.portrait ? (
            <img
              src={'data:image/jpeg;base64,' + member.portrait}
              alt={character_name || username}
              className="w-full h-full object-cover"
            />
          ) : (
            (character_name || username || '?').slice(0, 1).toUpperCase()
          )}
        </div>

        <div>
          <div className="font-serif text-[15px] text-(--text-primary) leading-[1.2]">
            {character_name || 'No investigator'}
          </div>
          <div className="text-[11px] text-(--accent) mt-0.5">
            {character_occupation || username}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'HP',  cur: member.hit_pts,   max: member.hit_pts_max,   color: 'var(--danger)'  },
          { label: 'MP',  cur: member.magic_pts,  max: member.magic_pts_max, color: '#3B82F6'        },
          { label: 'SAN', cur: member.sanity,     max: member.sanity_max,    color: 'var(--warning)' },
        ].map(stat => (
          <div key={stat.label} className="text-center bg-(--bg-section-hd) rounded-md py-1.5 px-1 border border-(--border-main)">
            <div className="text-[10px] text-(--text-muted) uppercase tracking-wider mb-0.5">
              {stat.label}
            </div>
            {/* color stays inline — per-stat color varies (danger/blue/warning), not a fixed token */}
            <div className="font-serif text-base font-bold" style={{ color: stat.color }}>
              {stat.cur ?? '—'}{stat.max ? '/' + stat.max : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Pending roll requests */}
      {pending.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {pending.map(({ requestId, rollName }) => (
            <div
              key={requestId}
              className="flex items-center justify-between py-1 px-2 bg-(--accent-bg) border border-(--accent) rounded-md text-xs text-(--accent) font-sans"
            >
              <span>{rollName} requested...</span>
              <Tooltip content="Cancel request">
              <button
                onClick={() => onCancelRequest(requestId)}
                aria-label="Cancel request"
                className="bg-none border-none cursor-pointer text-(--accent) py-0 px-0.5 flex items-center leading-none text-sm hover:opacity-70"
              >
                ✕
              </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
