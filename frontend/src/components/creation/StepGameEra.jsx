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

  const sectionStyle = {
    marginBottom: '2rem',
  };

  const sectionTitleStyle = {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  };

  const sectionSubStyle = {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.83rem',
    color: 'var(--text-muted)',
    marginBottom: '1rem',
  };

  function RadioCard({ id, label, hint, selected, onClick }) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '0.7rem 1rem',
          borderRadius: '8px',
          border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--border-main)'}`,
          background: selected ? 'var(--color-primary-light)' : 'var(--bg-page)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          userSelect: 'none',
        }}
      >
        {/* Radio dot */}
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--border-input)'}`,
          background: selected ? 'var(--color-primary)' : 'transparent',
          flexShrink: 0,
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {selected && (
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#fff',
            }} />
          )}
        </div>

        <div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: selected ? 600 : 400,
            fontSize: '0.92rem',
            color: selected ? 'var(--color-primary-dark)' : 'var(--text-primary)',
            marginBottom: '0.1rem',
          }}>
            {label}
          </div>
          {hint && (
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.77rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}>
              {hint}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        Game Era & Skills Cap
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        These choices shape the world and how skilled your investigator can become.
      </p>

      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Game Era ── */}
        <div style={{ ...sectionStyle, flex: '1', minWidth: '260px' }}>
          <h3 style={sectionTitleStyle}>Game Era</h3>
          <p style={sectionSubStyle}>When does your campaign take place?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
        <div style={{ ...sectionStyle, minWidth: '220px' }}>
          <h3 style={sectionTitleStyle}>Skills Cap</h3>
          <p style={sectionSubStyle}>Maximum value any skill can reach.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
