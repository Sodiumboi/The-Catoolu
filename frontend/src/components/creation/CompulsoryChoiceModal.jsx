import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  isCompulsoryChoiceEntryResolved,
  resolveEitherToken,
  describeCompulsoryChoiceEntry,
  exampleName,
  isExampleVisible,
  GROUP_EXAMPLES,
} from '../../utils/compulsoryChoices';
import { PREFILLED_WEAPON_SKILLS } from '../../utils/skillBases';

// Portal-based picker for a single compulsoryChoices entry. Replicates ConfirmDialog's structural
// conventions (portal into document.body, fixed backdrop z-1100 / dialog z-1101, Escape dismiss,
// body-scroll-lock, backdrop-click cancel + inner stopPropagation) but is a stateful picker with a
// single Done action, not a yes/no prompt. Four render branches — free / fixed / open / either —
// each resolving to plain skill-name string(s) via the shape locked in compulsoryChoices.js.
//
// Props:
//   open          bool
//   entry         compulsoryChoices[i] | null   (null when open === false)
//   currentValue  value already chosen (partial/complete/undefined)
//   skillCatalog  getSkillCatalog() output      (only consulted by the 'free' branch)
//   onConfirm     (finalValue) => void          (fires once draft satisfies isResolved)
//   onCancel      () => void                     (Escape / backdrop / cancel — discards draft)
const PILL = 'py-[0.3rem] px-[0.85rem] rounded-full border-2 font-sans text-[0.82rem] [transition:all_0.12s]';
const PILL_ON = 'border-(--color-primary) bg-(--color-primary) text-white font-semibold cursor-pointer';
const PILL_OFF = 'border-(--border-input) bg-(--bg-card) text-(--text-secondary) font-normal cursor-pointer';
const PILL_DISABLED = 'border-(--border-input) bg-(--bg-card) text-(--text-faint) font-normal cursor-not-allowed opacity-50';

export default function CompulsoryChoiceModal({ open, entry, currentValue, skillCatalog, gameEra, onConfirm, onCancel }) {
  const isEither = entry?.type === 'either';
  const [draft, setDraft] = useState(isEither ? (currentValue ?? null) : (currentValue ?? []));
  const [search, setSearch] = useState('');
  const [pendingGroup, setPendingGroup] = useState(null); // free-branch group awaiting a specialty
  const [groupText, setGroupText] = useState('');
  const [openText, setOpenText] = useState('');           // open-branch free-text specialty

  // Internal draft (and the other picker state slices) are initialized once from currentValue by
  // the useState initializers above. The call site keys this component on the open entry index, so
  // opening a new entry remounts a fresh instance instead of resetting state via an effect.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || !entry) return null;

  const arr = Array.isArray(draft) ? draft : [];
  const atMax = arr.length >= entry.pick;
  const resolved = isCompulsoryChoiceEntryResolved(entry, draft);

  const addValue = (value) => {
    if (!value || arr.includes(value) || atMax) return;
    setDraft([...arr, value]);
  };
  const removeValue = (value) => setDraft(arr.filter(v => v !== value));

  // ── selected-picks summary row (fixed/open/free) ──
  const selectedRow = (
    <div className="mb-3">
      <p className="font-sans text-[0.72rem] uppercase tracking-[0.05em] text-(--text-muted) mb-[0.35rem]">
        Selected ({arr.length} of {entry.pick})
      </p>
      {arr.length === 0 ? (
        <p className="font-sans text-[0.8rem] text-(--text-faint)">Nothing chosen yet.</p>
      ) : (
        <div className="flex flex-wrap gap-[0.4rem]">
          {arr.map(v => (
            <button key={v} onClick={() => removeValue(v)} className={`${PILL} ${PILL_ON} flex items-center gap-1`}>
              {v}<span className="text-[0.9rem] leading-none">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  let body = null;

  if (entry.type === 'fixed') {
    body = (
      <div>
        {selectedRow}
        <div className="flex flex-wrap gap-[0.4rem]">
          {entry.from.map(skill => {
            const selected = arr.includes(skill);
            const disabled = !selected && atMax;
            return (
              <button
                key={skill}
                onClick={() => (selected ? removeValue(skill) : addValue(skill))}
                className={`${PILL} ${selected ? PILL_ON : disabled ? PILL_DISABLED : PILL_OFF}`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>
    );
  } else if (entry.type === 'open') {
    const prefilledForGroup = PREFILLED_WEAPON_SKILLS.filter(s => s.startsWith(`${entry.group} (`));
    const visibleExamples = (entry.examples ?? []).filter(ex => isExampleVisible(ex, gameEra));
    body = (
      <div>
        {selectedRow}
        {prefilledForGroup.length > 0 && (
          <div className="mb-3">
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.05em] text-(--text-muted) mb-[0.35rem]">
              Or keep an existing skill
            </p>
            <div className="flex flex-wrap gap-[0.4rem]">
              {prefilledForGroup.map(value => {
                const selected = arr.includes(value);
                const disabled = !selected && atMax;
                const label = value.slice(`${entry.group} (`.length, -1);
                return (
                  <button
                    key={value}
                    onClick={() => (selected ? removeValue(value) : addValue(value))}
                    className={`${PILL} ${selected ? PILL_ON : disabled ? PILL_DISABLED : PILL_OFF}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {visibleExamples.length > 0 && (
          <div className="flex flex-wrap gap-[0.4rem] mb-3">
            {visibleExamples.map(ex => {
              const name = exampleName(ex);
              const value = `${entry.group} (${name})`;
              const selected = arr.includes(value);
              const disabled = !selected && atMax;
              return (
                <button
                  key={name}
                  onClick={() => (selected ? removeValue(value) : addValue(value))}
                  className={`${PILL} ${selected ? PILL_ON : disabled ? PILL_DISABLED : PILL_OFF}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={openText}
            onChange={e => setOpenText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && openText.trim()) { addValue(`${entry.group} (${openText.trim()})`); setOpenText(''); } }}
            placeholder={`${entry.group} specialty…`}
            disabled={atMax}
            className="flex-1 font-sans text-[0.85rem] text-(--text-primary) bg-(--bg-page) border border-(--border-input) rounded-md px-2 py-1 outline-none focus:border-(--border-focus) input-focus-glow disabled:opacity-50"
          />
          <button
            onClick={() => { if (openText.trim()) { addValue(`${entry.group} (${openText.trim()})`); setOpenText(''); } }}
            disabled={!openText.trim() || atMax}
            className={`btn-secondary ${(!openText.trim() || atMax) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Add
          </button>
        </div>
      </div>
    );
  } else if (entry.type === 'free') {
    const isOwnLang = pendingGroup === 'Language (Own)';
    // Suggestion chips for the group the player drilled into — reuse the same canonical per-group
    // sets the 'open' branch reads from occupations.js, era-filtered exactly like that branch. May
    // be empty for a group with no canonical set (then no chip row renders). Clicking a chip
    // resolves the specialty immediately (same add-and-close path as the Enter/Add flow below), so
    // the player never has to type a name that's already offered.
    const groupExamples = (GROUP_EXAMPLES[pendingGroup] ?? []).filter(ex => isExampleVisible(ex, gameEra));
    const addGroupSpecialty = (name) => { addValue(`${pendingGroup} (${name})`); setPendingGroup(null); setGroupText(''); };
    const filtered = skillCatalog
      .filter(c => c.name.toLowerCase().includes(search.trim().toLowerCase()))
      .slice(0, 40);
    body = (
      <div>
        {selectedRow}
        {pendingGroup ? (
          <div className="bg-(--bg-page) border border-(--border-main) rounded-lg p-3">
            <p className="font-sans text-[0.82rem] text-(--text-secondary) mb-2">
              {isOwnLang
                ? <>Add <strong>{pendingGroup}</strong> (the specific language is named later in the skill list).</>
                : <>Name a <strong>{pendingGroup}</strong> specialty:</>}
            </p>
            {!isOwnLang && groupExamples.length > 0 && (
              <div className="flex flex-wrap gap-[0.4rem] mb-2">
                {groupExamples.map(ex => {
                  const name = exampleName(ex);
                  return (
                    <button
                      key={name}
                      onClick={() => addGroupSpecialty(name)}
                      className={`${PILL} ${PILL_OFF}`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}
            {!isOwnLang && (
              <input
                type="text"
                value={groupText}
                onChange={e => setGroupText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && groupText.trim()) { addValue(`${pendingGroup} (${groupText.trim()})`); setPendingGroup(null); setGroupText(''); } }}
                placeholder="Specialty…"
                autoFocus
                className="w-full mb-2 font-sans text-[0.85rem] text-(--text-primary) bg-(--bg-card) border border-(--border-input) rounded-md px-2 py-1 outline-none focus:border-(--border-focus) input-focus-glow"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const value = isOwnLang ? 'Own Language' : `${pendingGroup} (${groupText.trim()})`;
                  if (isOwnLang || groupText.trim()) { addValue(value); setPendingGroup(null); setGroupText(''); }
                }}
                disabled={!isOwnLang && !groupText.trim()}
                className={`btn-primary ${(!isOwnLang && !groupText.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Add
              </button>
              <button onClick={() => { setPendingGroup(null); setGroupText(''); }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search skills…"
              disabled={atMax}
              className="w-full mb-3 font-sans text-[0.85rem] text-(--text-primary) bg-(--bg-page) border border-(--border-input) rounded-md px-2 py-1 outline-none focus:border-(--border-focus) input-focus-glow disabled:opacity-50"
            />
            {atMax ? (
              <p className="font-sans text-[0.8rem] text-(--text-faint)">All {entry.pick} picks made. Remove one above to change.</p>
            ) : (
              <div className="flex flex-wrap gap-[0.4rem] max-h-56 overflow-y-auto">
                {filtered.map(item => {
                  const isGroup = item.type === 'group';
                  const already = !isGroup && arr.includes(item.name);
                  return (
                    <button
                      key={`${item.type}:${item.name}`}
                      onClick={() => (isGroup ? (setPendingGroup(item.name), setGroupText('')) : addValue(item.name))}
                      disabled={already}
                      className={`${PILL} ${already ? PILL_DISABLED : PILL_OFF}`}
                    >
                      {item.name}{isGroup ? ' …' : ''}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="font-sans text-[0.8rem] text-(--text-faint)">No matching skills.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  } else if (entry.type === 'either') {
    const isPendingOther = pendingGroup === 'Language (Other)';
    body = isPendingOther ? (
      <div className="bg-(--bg-page) border border-(--border-main) rounded-lg p-3">
        <p className="font-sans text-[0.82rem] text-(--text-secondary) mb-2">
          Name a <strong>Language (Other)</strong> specialty:
        </p>
        <input
          type="text"
          value={groupText}
          onChange={e => setGroupText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && groupText.trim()) { setDraft(`Language (Other) (${groupText.trim()})`); setPendingGroup(null); setGroupText(''); } }}
          placeholder="Specialty…"
          autoFocus
          className="w-full mb-2 font-sans text-[0.85rem] text-(--text-primary) bg-(--bg-card) border border-(--border-input) rounded-md px-2 py-1 outline-none focus:border-(--border-focus) input-focus-glow"
        />
        <div className="flex gap-2">
          <button
            onClick={() => { if (groupText.trim()) { setDraft(`Language (Other) (${groupText.trim()})`); setPendingGroup(null); setGroupText(''); } }}
            disabled={!groupText.trim()}
            className={`btn-primary ${!groupText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Add
          </button>
          <button onClick={() => { setPendingGroup(null); setGroupText(''); }} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="flex flex-wrap gap-[0.5rem]">
        {entry.options.map(opt => {
          const isOwn = opt.group === 'Language (Own)';
          const token = isOwn ? resolveEitherToken(opt.group) : null;
          const selected = isOwn ? draft === token : (typeof draft === 'string' && draft.startsWith('Language (Other) ('));
          return (
            <button
              key={opt.group}
              onClick={() => {
                if (isOwn) { setDraft(token); return; }
                const existingName = typeof draft === 'string' && draft.startsWith('Language (Other) (')
                  ? draft.slice('Language (Other) ('.length, -1)
                  : '';
                setGroupText(existingName);
                setPendingGroup('Language (Other)');
              }}
              className={`${PILL} ${selected ? PILL_ON : PILL_OFF}`}
            >
              {opt.group}
            </button>
          );
        })}
      </div>
    );
  }

  const dialog = (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, animation: 'confirm-fade-in 0.15s ease',
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ccm-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-main)',
          borderRadius: 12, padding: 24, maxWidth: 460, width: '92%',
          maxHeight: '86vh', overflowY: 'auto',
          boxShadow: 'var(--shadow-dropdown)', zIndex: 1101,
          animation: 'confirm-pop-in 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
      >
        <h2
          id="ccm-title"
          style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--text-primary)', margin: '0 0 4px' }}
        >
          Occupation Choice
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 18px' }}>
          {describeCompulsoryChoiceEntry(entry, gameEra)}
        </p>

        {body}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 22 }}>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            type="button"
            onClick={() => onConfirm(draft)}
            disabled={!resolved}
            className={`btn-primary ${!resolved ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
