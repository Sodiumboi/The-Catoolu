export default function KeeperPlayerCard({ member }) {
  const { character_name, character_occupation, username } = member;

  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border-main)',
      borderRadius: '10px',
      padding:      '12px',
      marginBottom: '10px',
    }}>
      {/* Header */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '10px',
        marginBottom:  '10px',
        paddingBottom: '10px',
        borderBottom:  '1px solid var(--border-main)',
      }}>
        {/* Portrait placeholder */}
        <div style={{
          width:          '44px',
          height:         '44px',
          borderRadius:   '8px',
          background:     'var(--color-primary-light)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          fontFamily:     'var(--font-serif)',
          fontSize:       '18px',
          color:          'var(--color-primary-dark)',
          overflow:       'hidden',
          border:         '1px solid var(--border-main)',
        }}>
          {(character_name || username || '?').slice(0, 1).toUpperCase()}
        </div>

        <div>
          <div style={{
            fontFamily:  'var(--font-serif)',
            fontSize:    '15px',
            color:       'var(--text-primary)',
            lineHeight:  '1.2',
          }}>
            {character_name || 'No investigator'}
          </div>
          <div style={{
            fontSize:  '11px',
            color:     'var(--accent)',
            marginTop: '2px',
          }}>
            {character_occupation || username}
          </div>
        </div>
      </div>

      {/* Stats — placeholder values until live sheet data arrives */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:                 '6px',
      }}>
        {[
          { label: 'HP',  key: 'HitPts',   color: 'var(--danger)'  },
          { label: 'MP',  key: 'MagicPts', color: '#3B82F6'        },
          { label: 'SAN', key: 'Sanity',   color: 'var(--warning)' },
        ].map(stat => (
          <div key={stat.key} style={{
            textAlign:  'center',
            background: 'var(--bg-section-hd)',
            borderRadius:'6px',
            padding:    '6px 4px',
            border:     '1px solid var(--border-main)',
          }}>
            <div style={{
              fontSize:      '10px',
              color:         'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom:  '2px',
            }}>
              {stat.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize:   '18px',
              fontWeight: '700',
              color:      stat.color,
            }}>
              {member[stat.key] ?? '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
