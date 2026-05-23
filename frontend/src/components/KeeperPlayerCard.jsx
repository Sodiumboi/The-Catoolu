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
        {/* Portrait */}
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
          {member.portrait ? (
            <img
              src={'data:image/jpeg;base64,' + member.portrait}
              alt={character_name || username}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            (character_name || username || '?').slice(0, 1).toUpperCase()
          )}
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
          { label: 'HP',  cur: member.hit_pts,   max: member.hit_pts_max,   color: 'var(--danger)'  },
          { label: 'MP',  cur: member.magic_pts,  max: member.magic_pts_max, color: '#3B82F6'        },
          { label: 'SAN', cur: member.sanity,     max: member.sanity_max,    color: 'var(--warning)' },
        ].map(stat => (
          <div key={stat.label} style={{
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
              fontSize:   '16px',
              fontWeight: '700',
              color:      stat.color,
            }}>
              {stat.cur ?? '—'}{stat.max ? '/' + stat.max : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
