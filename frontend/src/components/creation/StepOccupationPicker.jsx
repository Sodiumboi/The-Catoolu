import { useState } from 'react';
import OCCUPATIONS from '../../utils/occupations';

function PreviewPanel({ occ, stats, gameEra }) {
  if (!occ) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed var(--border-main)',
        borderRadius: '10px',
        padding: '2rem',
        color: 'var(--text-faint)',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.9rem',
        minHeight: '300px',
      }}>
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
    <div style={{
      flex: 1,
      border: '1px solid var(--border-main)',
      borderRadius: '10px',
      background: 'var(--bg-card)',
      padding: '1.5rem',
      overflowY: 'auto',
      maxHeight: '560px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-primary-dark)', marginBottom: '0.25rem' }}>
        {occ.name}
      </h3>
      {isUnusual && (
        <p style={{
          fontSize: '12px',
          color: 'var(--warning-text, #b47800)',
          marginTop: '0',
          marginBottom: '0.5rem',
          fontStyle: 'italic',
          fontFamily: 'var(--font-sans)',
        }}>
          ⚠ This occupation may not fit the {ERA_LABELS[gameEra] ?? gameEra} setting.
          Check with your Keeper before selecting.
        </p>
      )}
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
        {occ.description}
      </p>

      {/* Formula + points */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Stat label="Skill Points Formula" value={occ.skillPointsFormula} />
        <Stat label="Your Occupation Pts" value={pts} accent />
        <Stat label="Credit Rating" value={`${occ.creditRating.min}–${occ.creditRating.max}`} />
      </div>

      <Divider />

      {/* Compulsory skills */}
      <div style={{ marginBottom: '1rem' }}>
        <Label>Compulsory Skills</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
          {occ.compulsorySkills.map(s => (
            <span key={s} style={{
              padding: '0.2rem 0.6rem',
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-mid)',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-primary-dark)',
            }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Specialty choices */}
      {occ.specialtyChoices.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <Label>Personal Specialties</Label>
          {occ.specialtyChoices.map((group, i) => (
            <div key={i} style={{ marginTop: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Pick {group.pick} — {group.label}:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {group.from.map(skill => (
                  <span key={skill} style={{
                    padding: '0.2rem 0.6rem',
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '9999px',
                    fontSize: '0.76rem',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-secondary)',
                  }}>{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Divider />

      {/* Cash & Assets (using CR midpoint) */}
      <div>
        <Label>Cash & Assets <span style={{ fontWeight: 400, opacity: 0.6 }}>(at CR {crMid})</span></Label>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-sans)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: accent ? '1.3rem' : '0.95rem', fontFamily: accent ? 'var(--font-serif)' : 'var(--font-sans)', fontWeight: 700, color: accent ? 'var(--color-primary)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function Label({ children }) {
  return (
    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-sans)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block' }}>
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--border-main)', margin: '0.75rem 0' }} />;
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
      <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        Choose Occupation
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Hover to preview, click to select. Occupation points are calculated live from your stats.
      </p>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Left: list ── */}
        <div style={{ width: '230px', flexShrink: 0 }}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border-input)',
              borderRadius: '7px',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.88rem',
              marginBottom: '0.5rem',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />

          <div
            style={{
              border: '1px solid var(--border-main)',
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '480px',
              overflowY: 'auto',
            }}
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
                  style={{
                    padding: '0.6rem 0.9rem',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border-main)' : 'none',
                    background: isSelected
                      ? 'var(--color-primary-light)'
                      : isHovered
                        ? 'var(--row-hover)'
                        : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.1s',
                  }}
                >
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.88rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'var(--color-primary-dark)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.3rem',
                    }}>
                      {occ.name}
                      {isUnusual && (
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--warning-bg, rgba(180,120,0,0.15))',
                          color: 'var(--warning-text, #b47800)',
                          fontWeight: 500,
                        }}>
                          unusual era
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
                      {occ.skillPointsFormula} = {occ.skillPointsCalc(stats)} pts
                    </div>
                  </div>
                  {isSelected && (
                    <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>✓</span>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
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
