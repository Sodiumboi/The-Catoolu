import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import logo from '../assets/vault-logo.png';

export default function ResetPasswordPage() {
  const [searchParams]         = useSearchParams();
  const navigate               = useNavigate();
  const { login: saveSession } = useAuth();
  const token                  = searchParams.get('token');

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/reset-password', { token, password });
      localStorage.setItem('coc_token', res.data.token);
      localStorage.setItem('coc_user',  JSON.stringify(res.data.user));
      setSuccess(true);
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 bg-(--bg-page) font-sans">
      <div className="w-full max-w-[400px]">

        <div className="text-center mb-8">
          <img src={logo} alt="The Catoolu"
               className="block mx-auto mb-3 w-16 h-16 object-contain" />
          <h1 className="font-serif text-[28px] text-(--color-primary-dark) m-0">
            The Catoolu
          </h1>
        </div>

        <div className="bg-(--bg-card) border border-(--border-main) rounded-2xl shadow-(--shadow-card) p-7">
          {success ? (
            <div className="text-center">
              <div className="text-[40px] mb-4">✅</div>
              <h2 className="font-serif text-xl text-(--text-primary) m-0 mb-2">
                Password Reset!
              </h2>
              <p className="text-[13px] text-(--text-muted)">
                Redirecting you to the vault...
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-xl text-(--text-primary) m-0 mb-2">
                Set New Password
              </h2>
              <p className="text-[13px] text-(--text-muted) m-0 mb-6">
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit}>
                {[
                  { label: 'New Password',      value: password, set: setPassword },
                  { label: 'Confirm Password',  value: confirm,  set: setConfirm  },
                ].map(field => (
                  <div key={field.label} className="mb-4">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.07em] text-(--text-muted) mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="password"
                      value={field.value}
                      onChange={e => field.set(e.target.value)}
                      required
                      minLength={8}
                      className="w-full py-[9px] px-3 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-sm outline-none! box-border"
                      onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                      onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
                    />
                  </div>
                ))}

                {confirm && confirm !== password && (
                  <p className="text-xs text-(--danger) mt-[-8px] mx-0 mb-3">
                    Passwords don't match
                  </p>
                )}

                {error && (
                  <div className="bg-(--danger-bg) border border-(--danger) rounded-lg py-2.5 px-3.5 mb-4 text-[13px] text-(--danger)">
                    ⚠ {error}
                    {error.includes('expired') && (
                      <> <Link to="/forgot-password"
                               className="text-(--accent) no-underline">
                        Request a new link
                      </Link></>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className={`btn-primary w-full justify-center ${(loading || !token) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : 'Set New Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}