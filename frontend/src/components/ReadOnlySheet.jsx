// Read-only investigator dossier — no interactions, Keeper view only

function SectionHeader({ title }) {
  return (
    <div style={{
      fontSize:      '10px',
      fontWeight:    '600',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color:         'var(--accent)',
      fontFamily:    'var(--font-sans)',
      padding:       '5px 14px',
      margin:        '0 -14px 8px',
      background:    'var(--bg-section-hd)',
      borderTop:     '1px solid var(--border-main)',
      borderBottom:  '1px solid var(--border-main)',
    }}>
      {title}
    </div>
  );
}

function ValueBox({ label, value, color, small }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      {label && (
        <span style={{
          fontSize:      '8px',
          fontWeight:    '600',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color:         'var(--text-faint)',
          fontFamily:    'var(--font-sans)',
        }}>
          {label}
        </span>
      )}
      <div style={{
        minWidth:       small ? '28px' : '38px',
        height:         small ? '28px' : '38px',
        borderRadius:   '6px',
        border:         '1px solid var(--border-main)',
        background:     'var(--bg-input)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     'var(--font-serif)',
        fontSize:       small ? '12px' : '16px',
        fontWeight:     '700',
        color:          color || 'var(--text-primary)',
        padding:        '0 4px',
      }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

export default function ReadOnlySheet({ charData }) {
  const inv     = charData?.sheet_data?.Investigator;
  const details = inv?.PersonalDetails   || {};
  const chars   = inv?.Characteristics   || {};
  const skills  = inv?.Skills?.Skill     || [];
  const weapons = Array.isArray(inv?.Weapons?.weapon)
    ? inv.Weapons.weapon
    : inv?.Weapons?.weapon ? [inv.Weapons.weapon] : [];
  const items   = Array.isArray(inv?.Possessions?.item)
    ? inv.Possessions.item
    : inv?.Possessions?.item ? [inv.Possessions.item] : [];
  const cash    = inv?.Cash || {};
  const portrait = details.Portrait;

  const STATS = ['STR','CON','DEX','INT','SIZ','POW','APP','EDU'];

  const nonZeroSkills = skills.filter(s => parseInt(s.value) > 0);

  const half  = v => Math.floor((parseInt(v) || 0) / 2);
  const fifth = v => Math.floor((parseInt(v) || 0) / 5);

  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: 'var(--bg-page)', fontSize: '13px' }}>

      {/* ── A. Personal Details ── */}
      <div style={{ display: 'flex', gap: '12px', padding: '14px 14px 12px', borderBottom: '1px solid var(--border-main)' }}>
        {/* Portrait */}
        <div style={{
          width: '72px', height: '92px', flexShrink: 0,
          borderRadius: '7px', overflow: 'hidden',
          background: 'var(--bg-section-hd)',
          border: '1px solid var(--border-main)',
        }}>
          {portrait ? (
            <img
              src={'data:image/jpeg;base64,' + portrait}
              alt={details.Name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--text-muted)',
            }}>
              {(details.Name || '?').slice(0, 1)}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '21px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {details.Name || '—'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '500', marginBottom: '4px' }}>
            {details.Occupation || '—'}
          </div>
          {[
            ['Age',        details.Age],
            ['Gender',     details.Gender],
            ['Birthplace', details.Birthplace],
            ['Residence',  details.Residence],
          ].map(([label, val]) => val ? (
            <div key={label} style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-faint)', minWidth: '62px' }}>{label}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{val}</span>
            </div>
          ) : null)}
        </div>
      </div>

      {/* ── B. Characteristics ── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-main)' }}>
        <SectionHeader title="Characteristics" />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {STATS.map(key => {
            const val = chars[key];
            return (
              <div key={key} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                padding: '6px 8px', borderRadius: '8px',
                border: '1px solid var(--border-main)',
                background: 'var(--bg-input)',
                minWidth: '50px',
              }}>
                <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}>
                  {key}
                </span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {parseInt(val) || 0}
                </span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-faint)' }}>½ {half(val)}</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-faint)' }}>⅕ {fifth(val)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── C. Derived Stats ── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-main)' }}>
        <SectionHeader title="Derived" />
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <ValueBox label="DB"    value={chars.DamageBonus || 'None'} color="var(--danger)" />
          <ValueBox label="Build" value={chars.Build} />
          <ValueBox label="Dodge" value={inv?.Combat?.Dodge?.value} color="#60a5fa" />
          <ValueBox label="Move"  value={chars.Move} />
        </div>
      </div>

      {/* ── D. Tracked Stats ── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-main)' }}>
        <SectionHeader title="Tracked Stats" />
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* HP */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.07em' }}>HP</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
              <ValueBox label="Max" value={chars.HitPtsMax} small />
              <ValueBox label="Now" value={chars.HitPts} />
            </div>
          </div>
          {/* MP */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.07em' }}>MP</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
              <ValueBox label="Max" value={chars.MagicPtsMax} small />
              <ValueBox label="Now" value={chars.MagicPts} />
            </div>
          </div>
          {/* Luck */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.07em' }}>Luck</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
              <ValueBox label="Max" value={chars.LuckMax} small />
              <ValueBox label="Now" value={chars.Luck} />
            </div>
          </div>
          {/* Sanity */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.07em' }}>Sanity</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
              <ValueBox label="Max" value={chars.SanityStart} small />
              <ValueBox label="Now" value={chars.Sanity} />
              <ValueBox label="Ins." value={chars.SanityMax} small color="var(--danger)" />
            </div>
          </div>
        </div>
      </div>

      {/* ── E. Skills ── */}
      {nonZeroSkills.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-main)' }}>
          <SectionHeader title="Skills" />
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px', marginBottom: '2px' }}>
            {[0, 1].map(col => (
              <div key={col} style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0 2px', borderBottom: '1px solid var(--border-main)' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skill</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-faint)', minWidth: '26px', textAlign: 'right' }}>Reg</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-faint)', minWidth: '18px', textAlign: 'right' }}>½</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-faint)', minWidth: '14px', textAlign: 'right' }}>⅕</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 12px' }}>
            {nonZeroSkills.map((s, i) => {
              const val = parseInt(s.value) || 0;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '3px 0',
                  borderBottom: '1px solid var(--border-main)22',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
                    {s.name}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', minWidth: '26px', textAlign: 'right' }}>
                      {val}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-faint)', minWidth: '18px', textAlign: 'right' }}>{half(val)}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-faint)', minWidth: '14px', textAlign: 'right' }}>{fifth(val)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── F. Weapons ── */}
      {weapons.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-main)' }}>
          <SectionHeader title="Weapons" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                {['Weapon', 'Skill', 'Reg', 'Damage', 'Range'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '2px 4px',
                    fontSize: '8px', fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--text-faint)', fontFamily: 'var(--font-sans)',
                    borderBottom: '1px solid var(--border-main)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weapons.map((w, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-main)22' }}>
                  <td style={{ padding: '5px 4px', color: 'var(--text-primary)', fontWeight: '500', fontSize: '12px' }}>{w.name}</td>
                  <td style={{ padding: '5px 4px', color: 'var(--text-muted)', fontSize: '12px' }}>{w.skillname}</td>
                  <td style={{ padding: '5px 4px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--accent)', fontSize: '13px' }}>{w.regular}</td>
                  <td style={{ padding: '5px 4px', color: 'var(--text-muted)', fontSize: '12px' }}>{w.damage}</td>
                  <td style={{ padding: '5px 4px', color: 'var(--text-muted)', fontSize: '12px' }}>{w.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── G. Backstory & Psychology ── */}
      {(() => {
        const back = inv?.Backstory || {};
        const FIELDS = [
          { key: 'description', label: 'Description'          },
          { key: 'traits',      label: 'Traits'               },
          { key: 'ideology',    label: 'Ideology & Beliefs'   },
          { key: 'people',      label: 'Significant People'   },
          { key: 'phobias',     label: 'Phobias & Manias'     },
          { key: 'locations',   label: 'Meaningful Locations' },
          { key: 'possessions', label: 'Treasured Possessions'},
          { key: 'tomes',       label: 'Tomes & Artefacts'    },
        ];
        const filled = FIELDS.filter(f => back[f.key]?.trim());
        if (!filled.length) return null;
        return (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-main)' }}>
            <SectionHeader title="Backstory & Psychology" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filled.map(({ key, label }) => (
                <div key={key}>
                  <div style={{
                    fontSize: '8px', fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--accent)', fontFamily: 'var(--font-sans)',
                    marginBottom: '3px',
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: '12px', color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    padding: '6px 8px', borderRadius: '6px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-main)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {back[key]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── H. Possessions ── */}
      {items.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-main)' }}>
          <SectionHeader title="Possessions & Equipment" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', padding: '2px 0' }}>
                <span style={{ color: 'var(--accent)', flexShrink: 0, fontSize: '10px', marginTop: '1px' }}>◆</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── H. Financial Status ── */}
      {(cash.spending || cash.cash || cash.assets) && (
        <div style={{ padding: '10px 14px' }}>
          <SectionHeader title="Financial Status" />
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Spending Limit', val: cash.spending },
              { label: 'Cash on Hand',   val: cash.cash     },
              { label: 'Assets',         val: cash.assets   },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)' }}>
                  {label}
                </span>
                <div style={{
                  padding: '4px 12px', borderRadius: '6px',
                  border: '1px solid var(--border-main)',
                  background: 'var(--bg-input)',
                  fontFamily: 'var(--font-serif)', fontSize: '14px',
                  fontWeight: '700', color: 'var(--success)',
                  minWidth: '80px', textAlign: 'center',
                }}>
                  {val || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
