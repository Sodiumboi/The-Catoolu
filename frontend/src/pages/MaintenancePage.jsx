import logo from '../assets/vault-logo.png';

export default function MaintenancePage({ message }) {
  return (
    <div style={{
      minHeight:      '100vh',
      background:     'var(--bg-page)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '32px 16px',
      textAlign:      'center',
    }}>
      <img
        src={logo}
        alt="The Catoolu"
        style={{ width: '72px', height: '72px', objectFit: 'contain', marginBottom: '24px', opacity: 0.7 }}
      />
      <h1 style={{
        margin:     '0 0 12px',
        fontFamily: 'var(--font-serif)',
        fontSize:   '28px',
        color:      'var(--text-primary)',
      }}>Under Maintenance</h1>
      <p style={{
        margin:     '0 0 8px',
        fontFamily: 'var(--font-sans)',
        fontSize:   '15px',
        color:      'var(--text-secondary)',
        maxWidth:   '400px',
        lineHeight: 1.6,
      }}>
        {message || 'We are updating The Catoolu. Back soon.'}
      </p>
      <p style={{ margin: '24px 0 0', fontSize: '12px', color: 'var(--text-faint)', fontFamily: 'var(--font-sans)' }}>
        You can check back later, Refresh if needed.
      </p>
    </div>
  );
}
