import Tooltip from './ui/Tooltip';

const DICE = [4, 6, 8, 10, 12, 20, 100];

export default function DiceRow({
  advMode, disMode,
  rollVisibility,
  isRolling = false,
  rollingDie = null,
  onToggleAdv, onToggleDis,
  onToggleVisibility,
  onRoll,
}) {
  const handleDie = (sides, shiftKey = false) => {
    if (isRolling) return;
    const suffix = advMode ? 'adv' : disMode ? 'dis' : '';
    const notation = '1d' + sides + suffix;
    onRoll(notation, shiftKey);
  };

  return (
    <div className="dice-row flex items-center gap-1.25 pt-2 px-3 pb-1 border-t border-(--border-main) bg-(--bg-nav) overflow-x-auto flex-nowrap [scrollbar-width:none]">
      {DICE.map(sides => {
        const notation  = '1d' + sides + (advMode ? 'adv' : disMode ? 'dis' : '');
        const isThisDie = rollingDie === notation;
        return (
          <Tooltip key={sides} content={'Roll 1d' + sides + (advMode ? ' Adv' : disMode ? ' Dis' : '')}>
          <button
            onClick={e => handleDie(sides, e.shiftKey)}
            disabled={isRolling}
            className={`py-1 px-2.25 rounded-md font-sans text-xs font-normal [transition:all_0.1s] ${isRolling ? 'cursor-not-allowed' : 'cursor-pointer'} ${isRolling && !isThisDie ? 'opacity-50' : 'opacity-100'} ${isThisDie ? 'border border-(--accent) bg-(--accent-bg) text-(--accent) [animation:pulse-accent_2s_ease-in-out_infinite]' : 'border border-(--border-main) bg-(--bg-card) text-(--text-secondary)'}`}
            onMouseEnter={e => {
              if (isRolling) return;
              e.currentTarget.style.background   = 'var(--accent-bg)';
              e.currentTarget.style.borderColor  = 'var(--accent)';
              e.currentTarget.style.color        = 'var(--accent)';
            }}
            onMouseLeave={e => {
              if (isRolling) return;
              e.currentTarget.style.background  = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-main)';
              e.currentTarget.style.color       = 'var(--text-secondary)';
            }}
          >
            D{sides}
          </button>
          </Tooltip>
        );
      })}

      <div className="w-px h-5 bg-(--border-main) mx-0.5" />

      {/* Adv */}
      <button onClick={onToggleAdv}
        className={`py-1 px-2.25 rounded-md font-sans text-[11px] cursor-pointer [transition:all_0.1s] ${advMode ? 'font-semibold border border-(--accent) bg-(--accent-bg) text-(--accent)' : 'font-normal border border-(--border-main) bg-(--bg-card) text-(--text-faint)'}`}>
        <span className="icon icon-sm mr-0.5">trending_down</span>Adv
      </button>

      {/* Dis */}
      <button onClick={onToggleDis}
        className={`py-1 px-2.25 rounded-md font-sans text-[11px] cursor-pointer [transition:all_0.1s] ${disMode ? 'font-semibold border border-(--danger) bg-(--danger-bg) text-(--danger)' : 'font-normal border border-(--border-main) bg-(--bg-card) text-(--text-faint)'}`}>
        <span className="icon icon-sm mr-0.5">trending_up</span>Dis
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-(--border-main) mx-0.5" />

      {/* Roll Visibility */}
      <Tooltip content={rollVisibility === 'everyone'
        ? 'Rolls visible to everyone — click for Only Me'
        : 'Rolls only visible to you — click for Everyone'}>
      <button
        onClick={onToggleVisibility}
        className={`py-1 px-2.25 rounded-md font-sans text-[11px] cursor-pointer [transition:all_0.15s] whitespace-nowrap ${rollVisibility === 'only_me' ? 'font-semibold border border-(--warning) text-(--warning) bg-[rgba(186,117,23,0.1)]' : 'font-normal border border-(--border-main) text-(--text-faint) bg-(--bg-card)'}`}
      >
        {rollVisibility === 'only_me'
          ? <><span className="icon icon-sm">lock</span>{' '}Only Me</>
          : <><span className="icon icon-sm">visibility</span>{' '}Everyone</>
        }
      </button>
      </Tooltip>

    </div>
  );
}