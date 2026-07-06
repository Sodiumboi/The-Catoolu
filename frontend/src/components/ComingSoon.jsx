import { useNavigate } from 'react-router-dom';

export default function ComingSoon({ tab, version, description, icon }) {
  const navigate = useNavigate();

  return (
    <div style={{
      flex:           1,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '60px 24px',
    }}>
      <div style={{
        textAlign:    'center',
        maxWidth:     '420px',
      }}>
        {/* Icon */}
        <div style={{
          fontSize:     '56px',
          marginBottom: '20px',
          opacity:      0.4,
        }}>
          {icon}
        </div>

        {/* Tab name */}
        <h1 style={{
          fontFamily:   'var(--font-serif)',
          fontSize:     '28px',
          color:        'var(--text-primary)',
          margin:       '0 0 8px',
        }}>
          {tab}
        </h1>

        {/* Version badge */}
        <div style={{
          display:      'inline-flex',
          alignItems:   'center',
          background:   'var(--accent-bg)',
          border:       '1px solid var(--border-main)',
          borderRadius: '20px',
          padding:      '4px 14px',
          marginBottom: '16px',
        }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize:   '12px',
            color:      'var(--accent)',
            fontWeight: '500',
          }}>
            Coming in {version}
          </span>
        </div>

        {/* Description */}
        <p style={{
          fontFamily:   'var(--font-sans)',
          fontSize:     '14px',
          color:        'var(--text-muted)',
          lineHeight:   '1.7',
          margin:       '0 0 28px',
        }}>
          {description}
        </p>

        {/* Back to dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-back"
        >
          <span className="icon icon-sm">arrow_back</span>Back to Investigators
        </button>
      </div>
    </div>
  );
}