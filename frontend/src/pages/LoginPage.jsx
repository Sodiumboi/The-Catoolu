import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import logo from '../assets/vault-logo.png';
import LegalModal from '../components/LegalModal';

export default function LoginPage({ initialMode = 'login' }) {
  const { login, register } = useAuth();
  const toast                = useToast();
  const navigate             = useNavigate();
  const [searchParams]       = useSearchParams();

  const [mode,     setMode]     = useState(initialMode);
  const [legalDoc, setLegalDoc] = useState(null); // null | 'tos' | 'privacy'

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
        const signedIn = await login(identifier, password);
        // Advisory only — the sign-in already succeeded. A password set before
        // the current rules keeps working; this just points at where to update
        // it. Delayed so it lands after the dashboard has settled.
        if (signedIn?.password_needs_update) {
          setTimeout(() => toast.info(
            'Consider updating your password',
            'Yours predates our current guidelines. It still works — you can change it any time in Account & Settings → Security.',
            { duration: 9000 },
          ), 1200);
        }
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
    <div className="min-h-screen flex items-center justify-center py-6 px-4 bg-(--bg-page) font-sans">
      <div className="w-full max-w-100">

        {/* ── Logo & Title ── */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="The Catoolu"
            className="block mx-auto mb-3 w-18 h-18 object-contain"
          />
          <h1 className="font-serif text-[32px] text-(--color-primary-dark) mt-0 mb-1 tracking-[0.02em]">
            The Catoolu
          </h1>
          <p className="text-[13px] text-(--text-muted) m-0">
            Call of Cthulhu Character Manager
          </p>
        </div>

        {/* ── Card ── */}
        <div className="bg-(--bg-card) border border-(--border-main) rounded-2xl shadow-(--shadow-card) pt-7 px-7 pb-6">

          {/* ── Mode toggle ── */}
          <div className="seg w-full mb-6">
            {[
              { value: 'login',    label: 'Sign In'        },
              { value: 'register', label: 'Create Account' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setMode(opt.value); setError(''); }}
                className={`seg-tab flex-1 ${mode === opt.value ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
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
                <div className="text-right mt-1.5">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-(--text-muted) no-underline"
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
              <div className="bg-(--danger-bg) border border-(--danger) rounded-lg py-2.5 px-3.5 mb-4 text-[13px] text-(--danger)">
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full justify-center mt-1 tracking-[0.03em] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading
                ? 'Consulting the Ancient Tomes...'
                : mode === 'login' ? 'Enter the Vault' : 'Begin Investigation'}
            </button>

            {mode === 'register' && (
              <p className="text-center text-[11px] text-(--text-faint) mt-2.5 mb-0 leading-[1.6]">
                By creating an account you agree to our{' '}
                <button onClick={() => setLegalDoc('tos')}     className={legalBtnClass} onMouseEnter={legalHover} onMouseLeave={legalOut}>Terms of Service</button>
                {' '}and{' '}
                <button onClick={() => setLegalDoc('privacy')} className={legalBtnClass} onMouseEnter={legalHover} onMouseLeave={legalOut}>Privacy Policy</button>
              </p>
            )}
          </form>
        </div>

        {/* ── OAuth error ── */}
        {oauthError && (
          <div className="bg-(--danger-bg) border border-(--danger) rounded-lg py-2.5 px-3.5 mt-3 text-[13px] text-(--danger)">
            ⚠ OAuth sign-in failed. Please try again or use email/password.
          </div>
        )}

        {/* ── OAuth providers ── */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-(--border-main)" />
            <span className="font-sans text-[11px] text-(--text-faint) whitespace-nowrap">
              or continue with
            </span>
            <div className="flex-1 h-px bg-(--border-main)" />
          </div>

          <a
            href="/api/auth/discord"
            className="flex items-center justify-center gap-2.25 p-2.5 rounded-[10px] border-none bg-[#5865F2] text-white font-sans text-sm font-medium no-underline [transition:background_0.15s_ease]"
            onMouseEnter={e => { e.currentTarget.style.background = '#4752c4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; }}
          >
            <DiscordIcon />
            Sign in with Discord
          </a>

          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-2.25 p-2.5 rounded-[10px] border border-(--border-input) bg-(--bg-card) text-(--text-primary) font-sans text-sm font-medium no-underline [transition:border-color_0.15s_ease]"
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-input)'; }}
          >
            <GoogleIcon />
            Sign in with Google
          </a>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-[11px] text-(--text-faint) mt-5 italic leading-[1.6]">
          Powered by ZimaOS and old HP office computers
        </p>
        <p className="text-center text-[11px] text-(--text-faint) mt-0 italic leading-[1.6]">

          Built by Someone at Saltlakes.
        </p>
        <p className="text-center text-[11px] text-(--text-faint) mt-2 leading-[1.6]">
          <button onClick={() => setLegalDoc('tos')}     className={legalBtnClass} onMouseEnter={legalHover} onMouseLeave={legalOut}>Terms of Service</button>
          {' · '}
          <button onClick={() => setLegalDoc('privacy')} className={legalBtnClass} onMouseEnter={legalHover} onMouseLeave={legalOut}>Privacy Policy</button>
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
const legalBtnClass = "bg-none border-none p-0 [font:inherit] text-(--text-faint) cursor-pointer underline [text-underline-offset:2px]";
const legalHover = e => { e.currentTarget.style.color = 'var(--accent)'; };
const legalOut   = e => { e.currentTarget.style.color = 'var(--text-faint)'; };

// ── Small helper components ────────────────────────────────

function FormField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block font-sans text-[11px] font-medium uppercase tracking-[0.07em] text-(--text-muted) mb-1.5">
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
      className="w-full py-2.25 px-3 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-sm outline-none! [transition:border-color_0.15s_ease] box-border"
      onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
      onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
    />
  );
}