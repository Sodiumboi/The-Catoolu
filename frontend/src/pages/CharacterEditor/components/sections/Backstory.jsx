import { Section, BackstoryField } from '../../primitives';

const FIELDS = [
  { key: 'description', label: 'Description' },
  { key: 'traits',      label: 'Traits' },
  { key: 'ideology',    label: 'Ideology & Beliefs' },
  { key: 'people',      label: 'Significant People' },
  { key: 'phobias',     label: 'Phobias & Manias' },
  { key: 'locations',   label: 'Meaningful Locations' },
  { key: 'possessions', label: 'Treasured Possessions' },
  { key: 'tomes',       label: 'Tomes & Artefacts' },
];

export default function Backstory({ back, onUpdateBack }) {
  return (
    <Section title="Backstory & Psychology">
      {FIELDS.map(({ key, label }) => (
        <BackstoryField
          key={key}
          label={label}
          value={back[key]}
          onChange={v => onUpdateBack(key, v)}
        />
      ))}
    </Section>
  );
}
