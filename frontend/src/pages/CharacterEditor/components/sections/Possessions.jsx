import Section from '../../../../components/sheet/Section';

const stripDollar = v => String(v || '').replace(/^\$+/, '').trim();

export default function Possessions({
  items, cash,
  onUpdatePossession, onDeletePossession, onAddPossession,
  onUpdateCash,
}) {
  return (
    <>
      <Section title="Possessions & Equipment">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-(--accent) shrink-0">◆</span>
              <input
                type="text"
                value={item.description}
                onChange={e => onUpdatePossession(i, e.target.value)}
                className="flex-1 px-2 py-1 rounded text-sm outline-none! bg-(--bg-input) border-[1.5px] border-(--border-input) text-(--text-primary) [transition:border-color_0.12s_ease]"
                onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-focus)'; }}
                onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-input)'; }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
              />
              <button onClick={() => onDeletePossession(i)}
                className="text-xs px-1.5 py-0.5 rounded shrink-0 transition-all text-(--danger) border-[1px_solid_var(--danger)33]"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger)22'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span className="icon icon-sm">close</span>
              </button>
            </div>
          ))}
        </div>
        <button onClick={onAddPossession}
          className="px-4 py-2 rounded text-xs font-medium transition-all bg-(--accent-bg) text-(--accent) border-[1px_solid_var(--accent)44]"
          onMouseEnter={e => e.currentTarget.style.background = 'var(--border-main)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-bg)'}>
          + Add Item
        </button>
      </Section>

      <Section title="Financial Status">
        <div className="flex gap-4 flex-wrap">
          {[
            { label: 'Spending Limit', field: 'spending' },
            { label: 'Cash on Hand',   field: 'cash'     },
            { label: 'Assets',         field: 'assets'   },
          ].map(({ label, field }) => (
            <div key={field} className="flex flex-col items-center">
              <label className="text-xs uppercase tracking-widest mb-1 text-(--accent)">
                {label}
              </label>
              <input
                type="text"
                value={stripDollar(cash[field])}
                onChange={e => onUpdateCash(field, stripDollar(e.target.value))}
                className="text-center px-3 py-2 rounded text-base font-bold outline-none! w-35 bg-(--bg-input) border-[1.5px] border-(--border-input) text-(--success) [transition:border-color_0.12s_ease]"
                onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-focus)'; }}
                onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border-input)'; }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
              />
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
