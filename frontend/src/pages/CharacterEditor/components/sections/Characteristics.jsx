import Section from '../../../../components/sheet/Section';
import StatGrid from '../../../../components/sheet/StatGrid';
import { TrackedStats, DerivedBadges } from '../../../../components/sheet/DerivedStats';

export default function Characteristics({
  chars, inv,
  onUpdateChar, onUpdateSheet,
}) {
  return (
    <Section title="Characteristics">

      {/* HP / MP / LUCK / SANITY — horizontal row */}
      <TrackedStats
        chars={chars} editable horizontal
        onChangeCurrent={(field, v) =>
          onUpdateSheet(s => { s.Investigator.Characteristics[field] = v; })}
      />

      <div style={{ borderTop: '1px solid var(--border-main)', margin: '20px 0 16px' }} />

      {/* 8 characteristics — two groups of four in a flex row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        <StatGrid chars={chars} editable onChangeChar={onUpdateChar} />
      </div>

      <div style={{ borderTop: '1px solid var(--border-main)', margin: '16px 0 0', paddingTop: '14px' }}>
        <DerivedBadges chars={chars} inv={inv} />
      </div>

    </Section>
  );
}
