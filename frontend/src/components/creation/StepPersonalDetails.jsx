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

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border-input)',
    borderRadius: '6px',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.3rem',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-sans)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ── Form fields ── */}
      <div style={{ flex: '1', minWidth: '280px', maxWidth: '420px' }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          fontSize: '1.5rem',
          marginBottom: '0.25rem',
        }}>
          Investigator Details
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.88rem',
          marginBottom: '1.75rem',
        }}>
          Who is this investigator?
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Name *</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="e.g. Vogel"
            value={name}
            onChange={e => setField('name', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Age * (15–90)</label>
          <input
            style={inputStyle}
            type="number"
            min={15}
            max={90}
            value={age}
            onChange={e => setField('age', parseInt(e.target.value) || '')}
            onBlur={() => setAgeTouched(true)}
          />
          {/* Reserved space — always same height, prevents layout shift */}
          <div style={{ height: '1.3rem', marginTop: '0.3rem' }}>
            {hint && (
              <p style={{
                color: hint.type === 'warning' ? 'var(--warning)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                margin: 0,
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.4,
              }}>
                {hint.text}
              </p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Residence</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="e.g. Arkham, Massachusetts"
            value={residence}
            onChange={e => setField('residence', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '0' }}>
          <label style={labelStyle}>Birthplace</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="e.g. Boston, Massachusetts"
            value={birthplace}
            onChange={e => setField('birthplace', e.target.value)}
          />
        </div>
      </div>

      {/* ── Portrait upload ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          Portrait <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
        </span>

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '120px',
            height: '150px',
            border: '2px dashed var(--border-input)',
            borderRadius: '8px',
            background: portrait ? 'transparent' : 'var(--bg-page)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
        >
          {portrait ? (
            <img
              src={`data:image/jpeg;base64,${portrait}`}
              alt="Portrait preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '0.5rem' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📷</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                Click to upload
              </div>
            </div>
          )}
        </div>

        {portrait && (
          <button
            onClick={() => setField('portrait', null)}
            style={{
              fontSize: '0.75rem',
              color: 'var(--danger)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              padding: '0',
            }}
          >
            Remove
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePortraitFile}
        />
      </div>
    </div>
  );
}
