import InvestigatorNotes from '../../../../components/InvestigatorNotes';
import { Section, StatBox, TrackedStat, ReadOnlyBadge } from '../../primitives';
import { calcDodge } from '../../../../utils/cocCalculations';

const LEFT_STATS  = [{ key: 'STR' }, { key: 'CON' }, { key: 'DEX' }, { key: 'INT', sub: 'IDEA' }];
const RIGHT_STATS = [{ key: 'SIZ' }, { key: 'POW' }, { key: 'APP' }, { key: 'EDU', sub: 'KNOW' }];

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

        {/* Left stat column */}
        <div className="flex flex-col gap-3">
          {LEFT_STATS.map(({ key, sub }) => (
            <StatBox key={key} label={key} sublabel={sub}
              value={chars[key]} onChange={v => onUpdateChar(key, v)} />
          ))}
        </div>

        <Divider />

        {/* Right stat column */}
        <div className="flex flex-col gap-3">
          {RIGHT_STATS.map(({ key, sub }) => (
            <StatBox key={key} label={key} sublabel={sub}
              value={chars[key]} onChange={v => onUpdateChar(key, v)} />
          ))}
        </div>

        <Divider />

        {/* Tracked stats */}
        <div className="flex flex-col gap-3 justify-center">
          <TrackedStat label="Hit Points"
            maxVal={chars.HitPtsMax} currentVal={chars.HitPts}
            onChangeCurrent={v => onUpdateSheet(s => { s.Investigator.Characteristics.HitPts = v; })} />
          <TrackedStat label="Magic Points"
            maxVal={chars.MagicPtsMax} currentVal={chars.MagicPts}
            onChangeCurrent={v => onUpdateSheet(s => { s.Investigator.Characteristics.MagicPts = v; })} />
          <TrackedStat label="Luck"
            maxVal={chars.LuckMax} currentVal={chars.Luck}
            onChangeCurrent={v => onUpdateSheet(s => { s.Investigator.Characteristics.Luck = v; })} />
          <TrackedStat label="Sanity"
            maxVal={chars.SanityStart} currentVal={chars.Sanity}
            onChangeCurrent={v => onUpdateSheet(s => { s.Investigator.Characteristics.Sanity = v; })}
            thirdLabel="Insane" thirdVal={chars.SanityMax} />
        </div>

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
      <div className="flex gap-6 flex-wrap justify-center">
        <ReadOnlyBadge label="Damage Bonus" value={chars.DamageBonus || 'None'} color="var(--danger)" />
        <ReadOnlyBadge label="Build"        value={chars.Build}                  color="var(--text-primary)" />
        <ReadOnlyBadge label="Dodge"
          value={inv?.Combat?.Dodge?.value || calcDodge(chars.DEX)}
          color="#60a5fa" />
        <ReadOnlyBadge label="Move"         value={chars.Move}                   color="var(--text-primary)" />
      </div>
    </Section>
  );
}
