import { Link } from 'react-router-dom';
import logo from '../assets/vault-logo.png';

// Shown in place of the character creation wizard while the creation engine
// is taken offline (see config/features.js → CREATION_ENGINE_ENABLED).
// Dhole's House import remains the working path for adding characters.
export default function CreationUnavailablePage() {
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
      }}>Character Creation</h1>
      <p style={{
        margin:     '0 0 8px',
        fontFamily: 'var(--font-sans)',
        fontSize:   '15px',
        color:      'var(--text-secondary)',
        maxWidth:   '400px',
        lineHeight: 1.6,
      }}>
        We're rebuilding the character creation engine from the ground up. In
        the meantime, you can import a character from Dhole's House.
      </p>
      <Link
        to="/dashboard"
        style={{
          display:        'inline-block',
          marginTop:      '24px',
          padding:        '10px 20px',
          background:     'var(--accent)',
          color:          'var(--accent-contrast, #fff)',
          borderRadius:   '8px',
          fontFamily:     'var(--font-sans)',
          fontSize:       '14px',
          fontWeight:     500,
          textDecoration: 'none',
        }}
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
