import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/vault-logo.png';

export default function OAuthCallbackPage() {
  const [params]          = useSearchParams();
  const navigate          = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token   = params.get('token');
    const userStr = params.get('user');
    const error   = params.get('error');

    if (error) {
      navigate(`/login?error=${error}`, { replace: true });
      return;
    }

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        loginWithToken(token, userData);
        navigate('/dashboard', { replace: true });
      } catch {
        navigate('/login?error=oauth_parse', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  // loginWithToken is stable (defined once in AuthContext), safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '1rem',
      background:     'var(--bg-page)',
    }}>
      <img src={logo} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', opacity: 0.6 }} />
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Signing you in…
      </p>
    </div>
  );
}
