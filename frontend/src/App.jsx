import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute        from './components/ProtectedRoute';
import LoginPage             from './pages/LoginPage';
import LandingPage           from './pages/LandingPage';
import AdminPage             from './pages/AdminPage';
import DashboardPage         from './pages/DashboardPage';
import CharacterEditorPage   from './pages/CharacterEditor';
import ForgotPasswordPage    from './pages/ForgotPasswordPage';
import ResetPasswordPage     from './pages/ResetPasswordPage';
import ProfilePage           from './pages/ProfilePage';
import FileManagerPage        from './pages/FileManagerPage';
import KeeperPage            from './pages/KeeperPage';
import CampaignPage          from './pages/CampaignPage';
import InboxPage             from './pages/InboxPage';
import CampaignRoomPage      from './pages/CampaignRoomPage';
import CharacterCreationPage from './pages/CharacterCreationPage';
import AboutPage             from './pages/AboutPage';
import LegalPage             from './pages/LegalPage';
import OAuthCallbackPage     from './pages/OAuthCallbackPage';
import MaintenancePage       from './pages/MaintenancePage';
import ServerDownPage        from './pages/ServerDownPage';
import { preloadWhenIdle }   from './utils/preloadImages';
import { ABOUT_PRELOAD_IMAGES } from './utils/aboutTeam';

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const pref = localStorage.getItem('coc_home_page');
    if (pref && pref !== '/') return <Navigate to={pref} replace />;
  }
  return <LandingPage />;
}

// ── Forces full remount when character UUID changes ─────────
function CharacterEditorWithKey() {
  const { uuid } = useParams();
  return (
    <ProtectedRoute>
      <CharacterEditorPage key={uuid} />
    </ProtectedRoute>
  );
}

// ── Health polling — drives maintenance / server-down gates ─
const POLL_INTERVAL = 60_000;

async function checkHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timer);
    return await res.json();
  } catch {
    clearTimeout(timer);
    return { status: 'down' };
  }
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  // null = first check not yet done; prevents any route from flashing before we know state.
  const [health, setHealth]   = useState(null);
  const firstCheckDone        = useRef(false);

  const poll = useCallback(async () => {
    const result = await checkHealth();

    if (!firstCheckDone.current) {
      // On initial page load: apply the full gate (maintenance OR down)
      firstCheckDone.current = true;
      setHealth(result);
      return;
    }

    // Subsequent polls: only switch state for 'ok' recovery or genuine server-down.
    // 'maintenance' is handled by the NavBar socket pill for users already in the app.
    if (result.status === 'ok' || result.status === 'down') {
      setHealth(result);
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  // Warm the cache for the About page's remote team avatars during idle time,
  // so they render instantly whenever the user navigates there.
  useEffect(() => preloadWhenIdle(ABOUT_PRELOAD_IMAGES), []);

  // Only admins bypass the maintenance gate so they can still reach /admin to turn it off.
  // All other users (logged-in or not) see the static maintenance page on refresh.
  const storedUser = JSON.parse(localStorage.getItem('coc_user') || 'null');
  const isAdmin    = storedUser?.is_admin === true;

  if (health === null)                                    return null; // waiting for first check
  if (health.status === 'maintenance' && !isAdmin)        return <MaintenancePage message={health.message} />;
  if (health.status === 'down')                           return <ServerDownPage />;

  return (
    <BrowserRouter>
      <Routes>
            {/* Public routes */}
            <Route path="/"                 element={<RootRoute />} />
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/register"         element={<LoginPage initialMode="register" />} />
            <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
            <Route path="/reset-password"   element={<ResetPasswordPage />} />
            <Route path="/about"            element={<AboutPage />} />
            <Route path="/legal"            element={<LegalPage />} />
            <Route path="/oauth-callback"   element={<OAuthCallbackPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            }/>
            <Route path="/character/:uuid" element={<CharacterEditorWithKey />} />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            }/>
            <Route path="/files" element={
              <ProtectedRoute><FileManagerPage /></ProtectedRoute>
            }/>

            <Route path="/create" element={
              <ProtectedRoute><CharacterCreationPage /></ProtectedRoute>
            }/>
            <Route path="/plzwork" element={<Navigate to="/create" replace />} />

            <Route path="/admin" element={
              <ProtectedRoute><AdminPage /></ProtectedRoute>
            }/>

            {/* Fallback */}
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />

            <Route path="/keeper" element={
              <ProtectedRoute><KeeperPage /></ProtectedRoute>
            }/>
            <Route path="/campaign" element={
              <ProtectedRoute><CampaignPage /></ProtectedRoute>
            }/>
            <Route path="/inbox" element={
              <ProtectedRoute><InboxPage /></ProtectedRoute>
            }/>
            <Route path="/campaign/:uuid" element={
              <ProtectedRoute><CampaignRoomPage /></ProtectedRoute>
            }/>
      </Routes>
    </BrowserRouter>
  );
}
