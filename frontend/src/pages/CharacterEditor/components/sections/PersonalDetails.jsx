import PortraitDisplay from '../../../../components/PortraitDisplay';
import { Section, DetailInput } from '../../primitives';

export default function PersonalDetails({
  details, portrait, portraitInputRef,
  onPortraitUpload, onUpdateDetail,
}) {
  return (
    <Section title="Personal Details">
      <div className="flex gap-6">
        <PortraitDisplay
          portrait={portrait}
          onUploadClick={() => portraitInputRef.current?.click()}
        />
        <input
          ref={portraitInputRef}
          type="file"
          accept="image/*"
          onChange={onPortraitUpload}
          className="hidden"
        />
        <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DetailInput label="Name"       value={details.Name}       onChange={v => onUpdateDetail('Name', v)} />
          <DetailInput label="Occupation" value={details.Occupation} onChange={v => onUpdateDetail('Occupation', v)} />
          <DetailInput label="Age"        value={details.Age}        onChange={v => onUpdateDetail('Age', v)} />
          <DetailInput label="Gender"     value={details.Gender}     onChange={v => onUpdateDetail('Gender', v)} />
          <DetailInput label="Birthplace" value={details.Birthplace} onChange={v => onUpdateDetail('Birthplace', v)} />
          <DetailInput label="Residence"  value={details.Residence}  onChange={v => onUpdateDetail('Residence', v)} />
        </div>
      </div>
    </Section>
  );
}
