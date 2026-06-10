import Section from '../../../../components/sheet/Section';
import SheetPersonalDetails from '../../../../components/sheet/PersonalDetails';

export default function PersonalDetails({
  details, portrait, portraitInputRef,
  onPortraitUpload, onUpdateDetail,
}) {
  return (
    <Section title="Personal Details">
      <SheetPersonalDetails
        details={details}
        portrait={portrait}
        editable
        portraitInputRef={portraitInputRef}
        onPortraitUpload={onPortraitUpload}
        onUpdateDetail={onUpdateDetail}
      />
    </Section>
  );
}
