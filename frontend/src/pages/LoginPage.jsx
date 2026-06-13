import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/vault-logo.png';
import LegalModal from '../components/LegalModal';

export default function LoginPage({ initialMode = 'login' }) {
  const { login, register } = useAuth();
  const navigate             = useNavigate();
  const [searchParams]       = useSearchParams();

  const [mode,     setMode]     = useState(initialMode);
  const [legalDoc, setLegalDoc] = useState(null); // null | 'tos' | 'privacy'

  // Sliding pill animation — mirrors NavBar approach
  const modeContainerRef = useRef(null);
  const modeButtonRefs   = useRef({});
  const [modePill, setModePill] = useState(null);

  useEffect(() => {
    const el        = modeButtonRefs.current[mode];
    const container = modeContainerRef.current;
    if (!el || !container) return;
    const r = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    setModePill({ left: r.left - c.left, width: r.width });
  }, [mode]);
  const [username,   setUsername]   = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email,      setEmail]      = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // OAuth error surfaced from the callback redirect
  const oauthError = searchParams.get('error');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(identifier, password);
      } else {
        await register(username, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 16px',
      background:     'var(--bg-page)',
      fontFamily:     'var(--font-sans)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* ── Logo & Title ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src={logo}
            alt="The Catoolu"
            style={{
              display:      'block',
              margin:       '0 auto 12px',
              width:        '72px',
              height:       '72px',
              objectFit:    'contain',
            }}
          />
          <h1 style={{
            fontFamily:    'var(--font-serif)',
            fontSize:      '32px',
            color:         'var(--color-primary-dark)',
            margin:        '0 0 4px',
            letterSpacing: '0.02em',
          }}>
            The Catoolu
          </h1>
          <p style={{
            fontSize:  '13px',
            color:     'var(--text-muted)',
            margin:    0,
          }}>
            Call of Cthulhu Character Manager
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
          background:   'var(--bg-card)',
          border:       '1px solid var(--border-main)',
          borderRadius: '16px',
          boxShadow:    'var(--shadow-card)',
          padding:      '28px 28px 24px',
        }}>

          {/* ── Pill mode toggle ── */}
          <div
            ref={modeContainerRef}
            style={{
              display:      'flex',
              position:     'relative',
              background:   'var(--bg-section-hd)',
              borderRadius: '10px',
              padding:      '3px',
              marginBottom: '24px',
            }}
          >
            {/* Sliding pill */}
            {modePill && (
              <div style={{
                position:      'absolute',
                top:           '3px',
                bottom:        '3px',
                left:          modePill.left,
                width:         modePill.width,
                borderRadius:  '8px',
                background:    'var(--bg-card)',
                boxShadow:     '0 1px 3px rgba(0,0,0,0.1)',
                pointerEvents: 'none',
                transition:    'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            )}
            {[
              { value: 'login',    label: 'Sign In'        },
              { value: 'register', label: 'Create Account' },
            ].map(opt => {
              const isActive = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  ref={el => { modeButtonRefs.current[opt.value] = el; }}
                  type="button"
                  onClick={() => { setMode(opt.value); setError(''); }}
                  style={{
                    flex:         1,
                    padding:      '7px 12px',
                    borderRadius: '8px',
                    border:       'none',
                    background:   'transparent',
                    color:        isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '13px',
                    fontWeight:   isActive ? '500' : '400',
                    cursor:       isActive ? 'default' : 'pointer',
                    position:     'relative',
                    zIndex:       1,
                    transition:   'color 0.2s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit}>

            {/* Username — register only */}
            {mode === 'register' && (
              <FormField label="Username">
                <FormInput
                  type="text"
                  value={username}
                  onChange={setUsername}
                  placeholder="InvestigatorName"
                  required
                  minLength={3}
                />
              </FormField>
            )}

            {/* Login: email or username. Register: email only */}
            {mode === 'login' ? (
              <FormField label="Email or Username">
                <FormInput
                  type="text"
                  value={identifier}
                  onChange={setIdentifier}
                  placeholder="investigator@arkham.edu or username"
                  required
                />
              </FormField>
            ) : (
              <FormField label="Email">
                <FormInput
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="investigator@arkham.edu"
                  required
                />
              </FormField>
            )}

            <FormField label="Password">
              <FormInput
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                required
                minLength={8}
              />
              {/* Forgot password link */}
              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '6px' }}>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize:   '12px',
                      color:      'var(--text-muted)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </FormField>

            {/* Error */}
            {error && (
              <div style={{
                background:   'var(--danger-bg)',
                border:       '1px solid var(--danger)',
                borderRadius: '8px',
                padding:      '10px 14px',
                marginBottom: '16px',
                fontSize:     '13px',
                color:        'var(--danger)',
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width:        '100%',
                padding:      '11px',
                borderRadius: '10px',
                border:       'none',
                background:   loading ? 'var(--text-muted)' : 'var(--color-primary)',
                color:        '#ffffff',
                fontFamily:   'var(--font-sans)',
                fontSize:     '14px',
                fontWeight:   '500',
                letterSpacing:'0.03em',
                cursor:       loading ? 'not-allowed' : 'pointer',
                transition:   'background 0.15s ease, transform 0.1s ease',
                marginTop:    '4px',
              }}
              onMouseEnter={e => {
                if (!loading) e.currentTarget.style.background = 'var(--color-primary-dark)';
              }}
              onMouseLeave={e => {
                if (!loading) e.currentTarget.style.background = 'var(--color-primary)';
              }}
            >
              {loading
                ? 'Consulting the Ancient Tomes...'
                : mode === 'login' ? 'Enter the Vault' : 'Begin Investigation'}
            </button>

            {mode === 'register' && (
              <p style={{
                textAlign:  'center',
                fontSize:   '11px',
                color:      'var(--text-faint)',
                marginTop:  '10px',
                marginBottom: 0,
                lineHeight: '1.6',
              }}>
                By creating an account you agree to our{' '}
                <button onClick={() => setLegalDoc('tos')}     style={legalBtnStyle} onMouseEnter={legalHover} onMouseLeave={legalOut}>Terms of Service</button>
                {' '}and{' '}
                <button onClick={() => setLegalDoc('privacy')} style={legalBtnStyle} onMouseEnter={legalHover} onMouseLeave={legalOut}>Privacy Policy</button>
              </p>
            )}
          </form>
        </div>

        {/* ── OAuth error ── */}
        {oauthError && (
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid var(--danger)',
            borderRadius: '8px', padding: '10px 14px', marginTop: '12px',
            fontSize: '13px', color: 'var(--danger)',
          }}>
            ⚠ OAuth sign-in failed. Please try again or use email/password.
          </div>
        )}

        {/* ── OAuth providers ── */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-main)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-main)' }} />
          </div>

          <a
            href="/api/auth/discord"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '9px',
              padding:        '10px',
              borderRadius:   '10px',
              border:         'none',
              background:     '#5865F2',
              color:          '#ffffff',
              fontFamily:     'var(--font-sans)',
              fontSize:       '14px',
              fontWeight:     '500',
              textDecoration: 'none',
              transition:     'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4752c4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; }}
          >
            <DiscordIcon />
            Sign in with Discord
          </a>

          <a
            href="/api/auth/google"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '9px',
              padding:        '10px',
              borderRadius:   '10px',
              border:         '1px solid var(--border-input)',
              background:     'var(--bg-card)',
              color:          'var(--text-primary)',
              fontFamily:     'var(--font-sans)',
              fontSize:       '14px',
              fontWeight:     '500',
              textDecoration: 'none',
              transition:     'border-color 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-input)'; }}
          >
            <GoogleIcon />
            Sign in with Google
          </a>
        </div>

        {/* ── Footer ── */}
        <p style={{
          textAlign:  'center',
          fontSize:   '11px',
          color:      'var(--text-faint)',
          marginTop:  '20px',
          fontStyle:  'italic',
          lineHeight: '1.6',
        }}>
          Powered by ZimaOS and old HP office computers
        </p>
        <p style={{
          textAlign:  'center',
          fontSize:   '11px',
          color:      'var(--text-faint)',
          marginTop:  '0px',
          fontStyle:  'italic',
          lineHeight: '1.6',
        }}>
          
          Built by Someone at Saltlakes.
        </p>
        <p style={{
          textAlign:  'center',
          fontSize:   '11px',
          color:      'var(--text-faint)',
          marginTop:  '8px',
          lineHeight: '1.6',
        }}>
          <button onClick={() => setLegalDoc('tos')}     style={legalBtnStyle} onMouseEnter={legalHover} onMouseLeave={legalOut}>Terms of Service</button>
          {' · '}
          <button onClick={() => setLegalDoc('privacy')} style={legalBtnStyle} onMouseEnter={legalHover} onMouseLeave={legalOut}>Privacy Policy</button>
        </p>

        {legalDoc && <LegalModal initialDoc={legalDoc} onClose={() => setLegalDoc(null)} />}
      </div>
    </div>
  );
}

// ── Brand icon SVGs ───────────────────────────────────────
function DiscordIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.036.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Shared legal button styles ────────────────────────────
const legalBtnStyle = {
  background:     'none',
  border:         'none',
  padding:        0,
  font:           'inherit',
  color:          'var(--text-faint)',
  cursor:         'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};
const legalHover = e => { e.currentTarget.style.color = 'var(--accent)'; };
const legalOut   = e => { e.currentTarget.style.color = 'var(--text-faint)'; };

// ── Small helper components ────────────────────────────────

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display:       'block',
        fontFamily:    'var(--font-sans)',
        fontSize:      '11px',
        fontWeight:    '500',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color:         'var(--text-muted)',
        marginBottom:  '6px',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FormInput({ type, value, onChange, placeholder, required, minLength }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      style={{
        width:        '100%',
        padding:      '9px 12px',
        borderRadius: '8px',
        border:       '1px solid var(--border-input)',
        background:   'var(--bg-input)',
        color:        'var(--text-primary)',
        fontFamily:   'var(--font-sans)',
        fontSize:     '14px',
        outline:      'none',
        transition:   'border-color 0.15s ease',
        boxSizing:    'border-box',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
      onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
    />
  );
}