import { useState } from 'react';
import OCCUPATIONS from '../../utils/occupations';

function PreviewPanel({ occ, stats, gameEra }) {
  if (!occ) {
    return (
      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-(--border-main) rounded-[10px] p-8 text-(--text-faint) font-sans text-[0.9rem] min-h-75">
        ← Select an occupation to preview
      </div>
    );
  }

  const pts        = occ.skillPointsCalc(stats);
  const crMid      = Math.floor((occ.creditRating.min + occ.creditRating.max) / 2);
  const { cash, assets, spendingLimit } = occ.cashAndAssets(crMid);
  const isUnusual  = occ.erasAvailable?.length > 0
    && gameEra
    && !occ.erasAvailable.includes(gameEra);

  return (
    <div className="flex-1 border border-(--border-main) rounded-[10px] bg-(--bg-card) p-6 overflow-y-auto overscroll-contain max-h-140">
      <h3 className="font-serif text-[1.5rem] text-(--color-primary-dark) mb-1">
        {occ.name}
      </h3>
      {isUnusual && (
        <p className="text-xs text-[var(--warning-text,_#b47800)] mt-0 mb-2 italic font-sans">
          ⚠ This occupation may not fit the {ERA_LABELS[gameEra] ?? gameEra} setting.
          Check with your Keeper before selecting.
        </p>
      )}
      <p className="font-sans text-[0.84rem] text-(--text-muted) mb-5 leading-normal">
        {occ.description}
      </p>

      {/* Formula + points */}
      <div className="flex gap-6 mb-4 flex-wrap">
        <Stat label="Skill Points Formula" value={occ.skillPointsFormula} />
        <Stat label="Your Occupation Pts" value={pts} accent />
        <Stat label="Credit Rating" value={`${occ.creditRating.min}–${occ.creditRating.max}`} />
      </div>

      <Divider />

      {/* Compulsory skills */}
      <div className="mb-4">
        <Label>Compulsory Skills</Label>
        <div className="flex flex-wrap gap-[0.35rem] mt-[0.4rem]">
          {occ.compulsorySkills.map(s => (
            <span key={s} className="py-[0.2rem] px-[0.6rem] bg-(--color-primary-light) border border-(--color-primary-mid) rounded-full text-[0.78rem] font-sans text-(--color-primary-dark)">{s}</span>
          ))}
        </div>
      </div>

      {/* Specialty choices */}
      {occ.specialtyChoices.length > 0 && (
        <div className="mb-4">
          <Label>Personal Specialties</Label>
          {occ.specialtyChoices.map((group, i) => (
            <div key={i} className="mt-2">
              <span className="font-sans text-[0.78rem] text-(--text-muted) block mb-[0.3rem]">
                Pick {group.pick} — {group.label}:
              </span>
              <div className="flex flex-wrap gap-[0.3rem]">
                {group.from.map(skill => (
                  <span key={skill} className="py-[0.2rem] px-[0.6rem] bg-(--bg-page) border border-(--border-input) rounded-full text-[0.76rem] font-sans text-(--text-secondary)">{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Divider />

      {/* Cash & Assets (using CR midpoint) */}
      <div>
        <Label>Cash & Assets <span className="font-normal opacity-60">(at CR {crMid})</span></Label>
        <div className="flex gap-6 mt-2 flex-wrap">
          <Stat label="Cash"          value={`$${cash}`} />
          <Stat label="Assets"        value={`$${assets}`} />
          <Stat label="Spending Lvl"  value={`$${spendingLimit}`} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.68rem] font-sans text-(--text-muted) uppercase tracking-wider">{label}</span>
      <span className={`font-bold ${accent ? 'text-[1.3rem] font-serif text-(--color-primary)' : 'text-[0.95rem] font-sans text-(--text-primary)'}`}>{value}</span>
    </div>
  );
}

function Label({ children }) {
  return (
    <span className="text-[0.72rem] font-sans font-bold uppercase tracking-[0.06em] text-(--text-muted) block">
      {children}
    </span>
  );
}

function Divider() {
  return <div className="border-t border-(--border-main) my-3" />;
}

const ERA_LABELS = {
  modern:        'Modern',
  classic_1920s: "Classic 1920's",
  gaslight:      'Cthulhu by Gaslight',
  old_west:      'Old West',
  regency:       'Regency Cthulhu',
  dark_ages:     'Dark Ages',
};

export default function StepOccupationPicker({ state, setOccupation }) {
  const { stats, selectedOccupation, gameEra } = state;
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState(null);

  const filtered = OCCUPATIONS.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const preview = hovered ?? selectedOccupation;

  return (
    <div>
      <h2 className="font-serif text-(--text-primary) text-[1.5rem] mb-1">
        Choose Occupation
      </h2>
      <p className="font-sans text-[0.88rem] text-(--text-muted) mb-6">
        Hover to preview, click to select. Occupation points are calculated live from your stats.
      </p>

      <div className="flex gap-5 items-start flex-wrap">

        {/* ── Left: list ── */}
        <div className="w-57.5 shrink-0">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full py-2 px-3 border border-(--border-input) rounded-[7px] bg-(--bg-input) text-(--text-primary) font-sans text-[0.88rem] mb-2 box-border outline-none! focus:border-(--border-focus) input-focus-glow"
          />

          <div
            className="border border-(--border-main) rounded-lg overflow-hidden max-h-120 overflow-y-auto overscroll-contain"
            onMouseLeave={() => setHovered(null)}
          >
            {filtered.map((occ, i) => {
              const isSelected = selectedOccupation?.id === occ.id;
              const isHovered  = hovered?.id === occ.id;
              const isUnusual  = occ.erasAvailable?.length > 0
                && gameEra
                && !occ.erasAvailable.includes(gameEra);

              return (
                <div
                  key={occ.id}
                  onClick={() => setOccupation(occ)}
                  onMouseEnter={() => setHovered(occ)}
                  className={`py-[0.6rem] px-[0.9rem] cursor-pointer flex justify-between items-center [transition:background_0.1s] ${i < filtered.length - 1 ? 'border-b border-(--border-main)' : 'border-b-0'} ${isSelected ? 'bg-(--color-primary-light)' : isHovered ? 'bg-(--row-hover)' : 'bg-(--bg-card)'}`}
                >
                  <div>
                    <div className={`font-sans text-[0.88rem] flex items-center flex-wrap gap-[0.3rem] ${isSelected ? 'font-semibold text-(--color-primary-dark)' : 'font-normal text-(--text-primary)'}`}>
                      {occ.name}
                      {isUnusual && (
                        <span className="text-[10px] py-px px-[5px] rounded-[4px] bg-[var(--warning-bg,_rgba(180,120,0,0.15))] text-[var(--warning-text,_#b47800)] font-medium">
                          unusual era
                        </span>
                      )}
                    </div>
                    <div className="text-[0.72rem] text-(--text-faint) font-sans">
                      {occ.skillPointsFormula} = {occ.skillPointsCalc(stats)} pts
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-(--color-primary) text-[0.9rem]">✓</span>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-4 text-center text-(--text-faint) font-sans text-[0.85rem]">
                No matches
              </div>
            )}
          </div>
        </div>

        {/* ── Right: preview ── */}
        <PreviewPanel occ={preview} stats={stats} gameEra={gameEra} />
      </div>
    </div>
  );
}
