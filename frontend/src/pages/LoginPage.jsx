import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/vault-logo.png';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate             = useNavigate();

  const [mode,     setMode]     = useState('login');
  const [username,   setUsername]   = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email,      setEmail]      = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

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
          <div style={{
            display:      'flex',
            background:   'var(--bg-section-hd)',
            borderRadius: '10px',
            padding:      '3px',
            marginBottom: '24px',
          }}>
            {[
              { value: 'login',    label: 'Sign In'        },
              { value: 'register', label: 'Create Account' },
            ].map(opt => {
              const isActive = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setMode(opt.value); setError(''); }}
                  style={{
                    flex:         1,
                    padding:      '7px 12px',
                    borderRadius: '8px',
                    border:       'none',
                    background:   isActive ? 'var(--bg-card)' : 'transparent',
                    color:        isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '13px',
                    fontWeight:   isActive ? '500' : '400',
                    cursor:       isActive ? 'default' : 'pointer',
                    boxShadow:    isActive
                      ? '0 1px 3px rgba(0,0,0,0.1)'
                      : 'none',
                    transition:   'all 0.15s ease',
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
          </form>
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
          Powered by Kon Tuen Claude and Resend —
          Built by someone, who rolled 1 on adv d20.
        </p>
      </div>
    </div>
  );
}

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