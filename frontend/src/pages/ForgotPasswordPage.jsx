import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import logo from '../assets/vault-logo.png';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 bg-(--bg-page) font-sans">
      <div className="w-full max-w-[400px]">

        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="The Catoolu"
               className="block mx-auto mb-3 w-16 h-16 object-contain" />
          <h1 className="font-serif text-[28px] text-(--color-primary-dark) m-0">
            The Catoolu
          </h1>
        </div>

        <div className="bg-(--bg-card) border border-(--border-main) rounded-2xl shadow-(--shadow-card) p-7">
          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="text-[40px] mb-4">📬</div>
              <h2 className="font-serif text-xl text-(--text-primary) m-0 mb-3">
                Check Your Inbox
              </h2>
              <p className="text-[13px] text-(--text-muted) leading-[1.7] m-0 mb-2">
                If <strong className="text-(--text-primary)">{email}</strong> is
                registered, a reset link has been sent.
                Check your spam folder if it doesn't appear within a few minutes.
              </p>
              <p className="text-[13px] text-(--text-muted) m-0 mb-5">
                The link expires in <strong className="text-(--text-primary)">1 hour</strong>.
              </p>
              <Link to="/login" className="text-[13px] text-(--accent) no-underline">
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h2 className="font-serif text-xl text-(--text-primary) m-0 mb-2">
                Forgot Password
              </h2>
              <p className="text-[13px] text-(--text-muted) leading-[1.6] m-0 mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.07em] text-(--text-muted) mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="investigator@arkham.edu"
                    className="w-full py-[9px] px-3 rounded-lg border border-(--border-input) bg-(--bg-input) text-(--text-primary) font-sans text-sm outline-none box-border"
                    onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                    onBlur={e  => e.target.style.borderColor = 'var(--border-input)'}
                  />
                </div>

                {error && (
                  <div className="bg-(--danger-bg) border border-(--danger) rounded-lg py-2.5 px-3.5 mb-4 text-[13px] text-(--danger)">
                    ⚠ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full p-[11px] rounded-[10px] border-none text-white font-sans text-sm font-medium ${loading ? 'bg-(--text-muted) cursor-not-allowed' : 'bg-(--color-primary) cursor-pointer'}`}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-[13px] text-(--text-muted) mt-5">
                Remember it?{' '}
                <Link to="/login" className="text-(--accent) no-underline">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}