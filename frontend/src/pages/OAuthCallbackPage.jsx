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
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-(--bg-page)">
      <img src={logo} alt="" className="w-12 h-12 object-contain opacity-60" />
      <p className="font-sans text-[0.9rem] text-(--text-muted)">
        Signing you in…
      </p>
    </div>
  );
}
