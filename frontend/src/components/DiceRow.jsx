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
            className={`btn-die ${isThisDie ? 'active [animation:pulse-accent_2s_ease-in-out_infinite]' : ''}`}
          >
            D{sides}
          </button>
          </Tooltip>
        );
      })}

      <div className="w-px h-5 bg-(--border-main) mx-0.5" />

      {/* Adv */}
      <button onClick={onToggleAdv}
        className={`btn-die ${advMode ? 'active' : ''}`}>
        <span className="icon icon-sm mr-0.5">trending_down</span>Adv
      </button>

      {/* Dis */}
      <button onClick={onToggleDis}
        className={`btn-die ${disMode ? 'is-danger' : ''}`}>
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
        className={`btn-die ${rollVisibility === 'only_me' ? 'is-warning' : ''}`}
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