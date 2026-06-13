export default function ServerDownPage() {
  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#1C1C1A',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '32px 16px',
      textAlign:      'center',
    }}>
      <span className="icon" style={{ fontSize: '48px', color: '#E24B4A', marginBottom: '20px' }}>
        cloud_off
      </span>
      <h1 style={{
        margin:     '0 0 12px',
        fontFamily: 'var(--font-serif)',
        fontSize:   '26px',
        color:      '#EAF3DE',
      }}>Server Unreachable</h1>
      <p style={{
        margin:     0,
        fontFamily: 'var(--font-sans)',
        fontSize:   '14px',
        color:      '#888780',
        maxWidth:   '360px',
        lineHeight: 1.6,
      }}>
        The Catoolu server isn't responding. Check your connection or try again in a moment.
      </p>
      <p style={{ margin: '20px 0 0', fontSize: '12px', color: '#3A3A37', fontFamily: 'var(--font-sans)' }}>
        Checking again automatically…
      </p>
    </div>
  );
}
