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

      <div className="border-t border-(--border-main) mt-5 mb-4" />

      {/* 8 characteristics — two groups of four in a flex row */}
      <div className="flex gap-2 items-start flex-wrap justify-center">
        <StatGrid chars={chars} editable onChangeChar={onUpdateChar} />
      </div>

      <div className="border-t border-(--border-main) mt-4 pt-3.5">
        <DerivedBadges chars={chars} inv={inv} />
      </div>

    </Section>
  );
}
