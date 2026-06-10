import InvestigatorNotes from '../../../../components/InvestigatorNotes';
import Section from '../../../../components/sheet/Section';
import StatGrid from '../../../../components/sheet/StatGrid';
import { TrackedStats, DerivedBadges } from '../../../../components/sheet/DerivedStats';

const Divider = () => (
  <div className="w-px self-stretch" style={{ background: 'var(--border-main)' }} />
);

export default function Characteristics({
  chars, inv, characterId,
  onUpdateChar, onUpdateSheet,
}) {
  return (
    <Section title="Characteristics">
      <div className="flex gap-6 mb-6 items-start flex-wrap">

        {/* 8 characteristics (two columns + divider) */}
        <StatGrid chars={chars} editable onChangeChar={onUpdateChar} />

        <Divider />

        {/* Tracked stats */}
        <TrackedStats
          chars={chars} editable
          onChangeCurrent={(field, v) =>
            onUpdateSheet(s => { s.Investigator.Characteristics[field] = v; })}
        />

        <Divider />

        {/* Notes */}
        <div className="flex-1" style={{ minWidth: '220px', maxWidth: '360px' }}>
          <InvestigatorNotes
            characterId={characterId}
            initialNotes={inv?.Notes || ''}
            onSave={notes => onUpdateSheet(s => { s.Investigator.Notes = notes; })}
          />
        </div>
      </div>

      <div className="border-t mb-4" style={{ borderColor: 'var(--border-main)' }} />

      {/* Derived stats row */}
      <DerivedBadges chars={chars} inv={inv} />
    </Section>
  );
}
