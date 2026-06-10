import Section from '../../../../components/sheet/Section';
import SheetBackstory from '../../../../components/sheet/Backstory';

export default function Backstory({ back, onUpdateBack }) {
  return (
    <Section title="Backstory & Psychology">
      <SheetBackstory back={back} editable onUpdateBack={onUpdateBack} />
    </Section>
  );
}
