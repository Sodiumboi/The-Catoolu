import { createPortal } from 'react-dom';

function lookupValue(charData, rollType, rollName) {
  if (!charData?.sheet_data?.Investigator) return null;
  const inv = charData.sheet_data.Investigator;
  if (rollType === 'stat') {
    return parseInt(inv.Characteristics?.[rollName]) || null;
  }
  const skills = inv?.Skills?.Skill || [];
  for (const s of skills) {
    const display = s.subskill && s.subskill.toLowerCase() !== 'none'
      ? s.name + ' (' + s.subskill + ')'
      : s.name;
    if (display === rollName || s.name === rollName) {
      return parseInt(s.value) || null;
    }
  }
  return null;
}

export default function RollRequestPill({ requests, myCharFullData, onRoll, onDismiss }) {
  if (!requests.length) return null;

  return createPortal(
    <div className="fixed bottom-5 right-5 z-500 flex flex-col gap-2 items-end">
      {requests.map(req => {
        const resolved = req.rollValue ?? lookupValue(myCharFullData, req.rollType, req.rollName);
        const canRoll  = resolved != null;

        return (
          <div
            key={req.requestId}
            className="bg-(--bg-card) border-[1.5px] border-(--accent) rounded-xl py-3.5 px-4 shadow-(--shadow-card) min-w-65 max-w-80 [animation:popIn_220ms_cubic-bezier(0.34,1.56,0.64,1)_both,pulse-accent_2s_220ms_infinite]"
          >
            <div className="text-[11px] text-(--text-muted) mb-1 font-sans flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">casino</span>
              Keeper requests:
            </div>
            <div className="font-serif text-base text-(--text-primary) mb-3">
              {req.rollName}
              {resolved != null && (
                <span className="text-[13px] text-(--text-muted) ml-1.5">
                  ({resolved})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRoll(req.rollName, resolved, req.requestId)}
                disabled={!canRoll}
                className={`flex-1 py-1.5 px-3 border-none rounded-md font-sans text-[13px] font-medium [transition:opacity_0.1s] ${canRoll ? 'bg-(--accent) text-white cursor-pointer' : 'bg-(--bg-section-hd) text-(--text-faint) cursor-not-allowed'}`}
              >
                Roll
              </button>
              <button
                onClick={() => onDismiss(req.requestId)}
                className="py-1.5 px-3 bg-none text-(--text-muted) border border-(--border-main) rounded-md cursor-pointer font-sans text-[13px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
