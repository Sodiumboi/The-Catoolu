import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/vault-logo.png';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Still checking localStorage — show nothing (prevents flash of login page)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <img src={logo} alt="Loading"
             className="object-contain animate-pulse"
             style={{ width: '56px', height: '56px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Consulting the tomes...</p>
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in — show the actual page
  return children;
}
