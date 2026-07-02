const ERAS = [
  { id: 'classic_1920s',    label: 'Classic 1920s',      hint: 'The golden age of Lovecraft. Jazz, prohibition, and ancient horrors.' },
  { id: 'modern',           label: 'Modern',             hint: 'Present day. Technology helps — but the monsters adapt too.' },
  { id: 'gaslight',         label: 'Cthulhu by Gaslight', hint: 'Victorian era, 1890s. Gas lamps, corsets, and cosmic dread.' },
  { id: 'old_west',         label: 'Old West',           hint: 'The American frontier. Something wrong lurks beyond the trail.' },
  { id: 'regency',          label: 'Regency Cthulhu',    hint: 'Regency England, early 1800s. Drawing rooms hiding unspeakable things.' },
  { id: 'dark_ages',        label: 'Dark Ages',          hint: 'Medieval Europe. Superstition is not far from the truth.' },
];

const CAPS = [
  { value: 75, label: 'Max 75', hint: 'Standard. Keeps characters grounded and mortal.' },
  { value: 99, label: 'Max 99', hint: 'Pulp / experienced. Allows near-mastery of skills.' },
];

export default function StepGameEra({ state, setField }) {
  const { gameEra, skillsCap } = state;

  const sectionClass = "mb-8";
  const sectionTitleClass = "font-serif text-[1.15rem] text-(--text-primary) mb-1";
  const sectionSubClass = "font-sans text-[0.83rem] text-(--text-muted) mb-4";

  function RadioCard({ id, label, hint, selected, onClick }) {
    return (
      <div
        onClick={onClick}
        className={`flex items-start gap-3 py-[0.7rem] px-4 rounded-lg cursor-pointer [transition:border-color_0.15s,background_0.15s] select-none border-2 ${selected ? 'border-(--color-primary) bg-(--color-primary-light)' : 'border-(--border-main) bg-(--bg-page)'}`}
      >
        {/* Radio dot */}
        <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center [transition:all_0.15s] border-2 ${selected ? 'border-(--color-primary) bg-(--color-primary)' : 'border-(--border-input) bg-transparent'}`}>
          {selected && (
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          )}
        </div>

        <div>
          <div className={`font-sans text-[0.92rem] mb-[0.1rem] ${selected ? 'font-semibold text-(--color-primary-dark)' : 'font-normal text-(--text-primary)'}`}>
            {label}
          </div>
          {hint && (
            <div className="font-sans text-[0.77rem] text-(--text-muted) leading-[1.4]">
              {hint}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-(--text-primary) text-[1.5rem] mb-1">
        Game Era & Skills Cap
      </h2>
      <p className="font-sans text-[0.88rem] text-(--text-muted) mb-8">
        These choices shape the world and how skilled your investigator can become.
      </p>

      <div className="flex gap-12 flex-wrap items-start">

        {/* ── Game Era ── */}
        <div className={`${sectionClass} flex-1 min-w-65`}>
          <h3 className={sectionTitleClass}>Game Era</h3>
          <p className={sectionSubClass}>When does your campaign take place?</p>
          <div className="flex flex-col gap-2">
            {ERAS.map(era => (
              <RadioCard
                key={era.id}
                id={era.id}
                label={era.label}
                hint={era.hint}
                selected={gameEra === era.id}
                onClick={() => setField('gameEra', era.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Skills Cap ── */}
        <div className={`${sectionClass} min-w-55`}>
          <h3 className={sectionTitleClass}>Skills Cap</h3>
          <p className={sectionSubClass}>Maximum value any skill can reach.</p>
          <div className="flex flex-col gap-2">
            {CAPS.map(cap => (
              <RadioCard
                key={cap.value}
                id={cap.value}
                label={cap.label}
                hint={cap.hint}
                selected={skillsCap === cap.value}
                onClick={() => setField('skillsCap', cap.value)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
