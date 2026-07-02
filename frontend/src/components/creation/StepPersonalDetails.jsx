import { useState, useRef } from 'react';

export default function StepPersonalDetails({ state, setField }) {
  const { name, age, residence, birthplace, portrait } = state;
  const [ageTouched, setAgeTouched] = useState(false);
  const fileInputRef = useRef(null);

  function handlePortraitFile(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setField('portrait', evt.target.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function ageHint() {
    if (!ageTouched) return null;
    if (age >= 15 && age <= 19)
      return { text: 'Age 15–19: EDU –5, and 5 pts deducted from STR/SIZ in Step 4.', type: 'warning' };
    if (age >= 40 && age <= 49)
      return { text: 'Age 40–49: 5 pts must be deducted from STR/CON/DEX/APP in Step 4.', type: 'info' };
    if (age >= 50 && age <= 59)
      return { text: 'Age 50–59: 10 pts must be deducted from STR/CON/DEX/APP in Step 4.', type: 'info' };
    if (age >= 60 && age <= 69)
      return { text: 'Age 60–69: 20 pts must be deducted from STR/CON/DEX/APP in Step 4.', type: 'info' };
    if (age >= 70)
      return { text: `Age ${age}+: ${age >= 80 ? 80 : 40} pts must be deducted from STR/CON/DEX/APP in Step 4.`, type: 'info' };
    return null;
  }

  const hint = ageHint();

  const inputClass = "w-full py-2 px-3 border border-(--border-input) rounded-md bg-(--bg-input) text-(--text-primary) font-sans text-[0.95rem] outline-none box-border";

  const labelClass = "block mb-[0.3rem] text-[0.82rem] font-semibold text-(--text-secondary) font-sans uppercase tracking-[0.04em]";

  return (
    <div className="flex gap-10 items-start flex-wrap">

      {/* ── Form fields ── */}
      <div className="flex-1 min-w-70 max-w-105">
        <h2 className="font-serif text-(--text-primary) text-[1.5rem] mb-1">
          Investigator Details
        </h2>
        <p className="text-(--text-muted) font-sans text-[0.88rem] mb-7">
          Who is this investigator?
        </p>

        <div className="mb-5">
          <label className={labelClass}>Name *</label>
          <input
            className={inputClass}
            type="text"
            placeholder="e.g. Vogel"
            value={name}
            onChange={e => setField('name', e.target.value)}
          />
        </div>

        <div className="mb-5">
          <label className={labelClass}>Age * (15–90)</label>
          <input
            className={inputClass}
            type="number"
            min={15}
            max={90}
            value={age}
            onChange={e => setField('age', parseInt(e.target.value) || '')}
            onBlur={() => setAgeTouched(true)}
          />
          {/* Reserved space — always same height, prevents layout shift */}
          <div className="h-[1.3rem] mt-[0.3rem]">
            {hint && (
              <p className={`text-[0.78rem] m-0 font-sans leading-[1.4] ${hint.type === 'warning' ? 'text-(--warning)' : 'text-(--text-muted)'}`}>
                {hint.text}
              </p>
            )}
          </div>
        </div>

        <div className="mb-5">
          <label className={labelClass}>Residence</label>
          <input
            className={inputClass}
            type="text"
            placeholder="e.g. Arkham, Massachusetts"
            value={residence}
            onChange={e => setField('residence', e.target.value)}
          />
        </div>

        <div className="mb-0">
          <label className={labelClass}>Birthplace</label>
          <input
            className={inputClass}
            type="text"
            placeholder="e.g. Boston, Massachusetts"
            value={birthplace}
            onChange={e => setField('birthplace', e.target.value)}
          />
        </div>
      </div>

      {/* ── Portrait upload ── */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-[0.82rem] font-semibold text-(--text-secondary) font-sans uppercase tracking-[0.04em]">
          Portrait <span className="font-normal opacity-60">(optional)</span>
        </span>

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`w-30 h-37.5 border-2 border-dashed border-(--border-input) rounded-lg cursor-pointer flex items-center justify-center overflow-hidden relative [transition:border-color_0.15s] ${portrait ? 'bg-transparent' : 'bg-(--bg-page)'}`}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
        >
          {portrait ? (
            <img
              src={`data:image/jpeg;base64,${portrait}`}
              alt="Portrait preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-2">
              <div className="text-[1.8rem] mb-[0.4rem]">📷</div>
              <div className="text-[0.72rem] text-(--text-faint) font-sans leading-[1.4]">
                Click to upload
              </div>
            </div>
          )}
        </div>

        {portrait && (
          <button
            onClick={() => setField('portrait', null)}
            className="text-[0.75rem] text-(--danger) bg-transparent border-none cursor-pointer font-sans p-0"
          >
            Remove
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePortraitFile}
        />
      </div>
    </div>
  );
}
