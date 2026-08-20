import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
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
import { APP_VERSION }       from './config/version';
import WhatsNewModal         from './components/WhatsNewModal';
import { WHATS_NEW_KEY }     from './components/SettingsModal';
import BackgroundArt         from './components/BackgroundArt';
import ErrorBoundary         from './components/ErrorBoundary';
import { useToast }          from './context/ToastContext';

// Errors thrown by browser extensions and Cloudflare's injected edge scripts
// land on our global handlers but are not ours to fix — showing them as a toast
// just tells the user something is broken when the app is fine. Our own bundles
// never live under these paths, so a stack frame naming one is proof of origin.
const FOREIGN_SOURCES = ['chrome-extension://', 'moz-extension://', 'safari-web-extension://', 'safari-extension://', '/cdn-cgi/'];
function isForeignError(error, filename = '') {
  const trace = `${filename}\n${error?.stack || ''}`;
  return FOREIGN_SOURCES.some((s) => trace.includes(s));
}

// ── Renders the parallax background art behind the 4 main pages ─
// Lives inside <BrowserRouter> so it can read the current path. BackgroundArt
// itself reads bgArtEnabled + theme from context and gates its own rendering.
function AppShell({ children }) {
  const location = useLocation();

  const BG_PAGES = ['/dashboard', '/character/', '/keeper', '/campaign'];
  const showBgArt = BG_PAGES.some((p) => {
    // /campaign must match EXACTLY — never /campaign/:uuid (the room).
    if (p === '/campaign') return location.pathname === '/campaign';
    return location.pathname.startsWith(p);
  });

  return (
    <>
      {showBgArt && <BackgroundArt />}
      {children}
    </>
  );
}

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
// While the server is down, poll much faster so we detect recovery within ~5s
// instead of waiting up to a full minute for the next normal-cadence check.
const DOWN_POLL_INTERVAL = 5_000;
// Require this many CONSECUTIVE failed health checks before declaring the
// server down. Background-tab timer throttling and transient timeouts can fire
// a single stale/late check on tab restore; one failure must never trip the
// ServerDownPage. Most visible in Edge.
const FAILURE_THRESHOLD = 3;

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
  const { user } = useAuth();
  const toast    = useToast();
  // What's New modal — auto-shown once per release to logged-in users.
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  // null = first check not yet done; prevents any route from flashing before we know state.
  const [health, setHealth]   = useState(null);
  const firstCheckDone        = useRef(false);
  // Consecutive-failure counter. Kept in a ref (not state) so the interval and
  // the visibilitychange listener always read/write the current value without
  // re-creating the interval or risking a stale closure.
  const consecutiveFailures   = useRef(0);
  const intervalRef           = useRef(null);
  // Tracks whether we have surfaced the ServerDownPage, so the recovery path can
  // hard-reload the page (clean slate) the moment the server answers again.
  const wasDownRef            = useRef(false);
  // Holds the latest poll callback so we can (re)schedule it from inside poll
  // itself without referencing the `poll` identifier before it is declared.
  const pollRef               = useRef(null);

  const poll = useCallback(async () => {
    const wasFirstCheck = !firstCheckDone.current;
    const result = await checkHealth();

    // A genuine 'down' result is a single failed/timed-out check. Count it, and
    // only surface ServerDownPage once we've hit FAILURE_THRESHOLD in a row.
    if (result.status === 'down') {
      consecutiveFailures.current += 1;
      firstCheckDone.current = true;
      if (consecutiveFailures.current >= FAILURE_THRESHOLD) {
        wasDownRef.current = true;
        setHealth({ status: 'down' });
        // Switch to the fast cadence so we catch recovery within ~5s. Scheduled
        // via pollRef (rather than the `poll` identifier or startInterval, both
        // declared below) to avoid a use-before-declaration reference here.
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => pollRef.current?.(), DOWN_POLL_INTERVAL);
      } else if (wasFirstCheck) {
        // First load and not yet over threshold: don't gate on a single miss.
        // Treat as 'ok' so the app renders; subsequent polls confirm or recover.
        setHealth({ status: 'ok' });
      }
      return;
    }

    // Any non-down result clears the failure streak.
    consecutiveFailures.current = 0;

    if (wasFirstCheck) {
      // On initial page load: apply the full gate (maintenance OR ok).
      firstCheckDone.current = true;
      setHealth(result);
      return;
    }

    // Subsequent polls: 'ok' recovery flips us back out of the down state.
    // 'maintenance' is handled by the NavBar socket pill for users already in the app.
    if (result.status === 'ok') {
      // If we had previously surfaced ServerDownPage, hard-reload to come back
      // cleanly (fresh sockets/state) rather than just flipping React state.
      // The fresh page boots its own normal-cadence interval, so no cleanup needed.
      if (wasDownRef.current) {
        window.location.reload();
        return;
      }
      setHealth(result);
    }
  }, []);

  // Keep the ref pointed at the latest poll so the fast-cadence interval (above)
  // always invokes the current callback. (poll is stable, but syncing in an
  // effect avoids writing a ref during render.)
  useEffect(() => { pollRef.current = poll; }, [poll]);

  // Single source of truth for (re)starting the poll interval. Defaults to the
  // normal cadence; callers may pass DOWN_POLL_INTERVAL for the fast recovery loop.
  const startInterval = useCallback((ms = POLL_INTERVAL) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(poll, ms);
  }, [poll]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Initial check + start polling on mount.
    poll();
    startInterval();

    // ONE visibilitychange handler covering both throttle layers:
    //  - hidden:  stop checks entirely (no throttled/stale fires while backgrounded)
    //  - visible: reset the failure streak, fire one fresh check, restart interval
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        consecutiveFailures.current = 0;
        poll();
        startInterval();
      } else {
        stopInterval();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopInterval();
    };
  }, [poll, startInterval, stopInterval]);

  // Warm the cache for the About page's remote team avatars during idle time,
  // so they render instantly whenever the user navigates there.
  useEffect(() => preloadWhenIdle(ABOUT_PRELOAD_IMAGES), []);

  // ── Global uncaught-error safety net ──────────────────────────
  // Surface uncaught promise rejections and runtime errors as a toast instead
  // of failing silently. Render/lifecycle errors are handled by ErrorBoundary.
  useEffect(() => {
    const onRejection = (event) => {
      // Rejections tagged { silent: true } are intentionally ignored.
      if (event.reason?.silent) return;
      console.error('[unhandledrejection]', event.reason);
      if (isForeignError(event.reason)) return;
      toast.error(
        'Something went wrong',
        'An unexpected error occurred. Try refreshing if the problem persists.',
        { details: { raw: event.reason?.message || String(event.reason) } },
      );
    };
    const onError = (event) => {
      // Cross-origin scripts report a generic "Script error." with no usable
      // error object — nothing actionable to show.
      if (!event.error) return;
      console.error('[window.onerror]', event.filename, event.error);
      if (isForeignError(event.error, event.filename)) return;
      toast.error(
        'Something went wrong',
        'An unexpected error occurred. Try refreshing if the problem persists.',
        { details: { raw: event.error?.message || event.message } },
      );
    };
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError);
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError);
    };
  }, [toast]);

  // Auto-show the What's New modal once per release for logged-in users.
  // The short delay lets the app settle before the modal pops in.
  // Opting out (Settings → Notifications) suppresses only the auto-show — the
  // footer link still opens it on demand.
  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(WHATS_NEW_KEY) === 'false') return;
    if (localStorage.getItem('catoolu_seen_whats_new') === APP_VERSION) return;
    const timer = setTimeout(() => setShowWhatsNew(true), 1500);
    return () => clearTimeout(timer);
  }, [user]);

  const handleCloseWhatsNew = () => {
    localStorage.setItem('catoolu_seen_whats_new', APP_VERSION);
    setShowWhatsNew(false);
  };

  // Only admins bypass the maintenance gate so they can still reach /admin to turn it off.
  // All other users (logged-in or not) see the static maintenance page on refresh.
  const storedUser = JSON.parse(localStorage.getItem('coc_user') || 'null');
  const isAdmin    = storedUser?.is_admin === true;

  if (health === null)                                    return null; // waiting for first check
  if (health.status === 'maintenance' && !isAdmin)        return <MaintenancePage message={health.message} />;
  if (health.status === 'down')                           return <ServerDownPage />;

  return (
    <ErrorBoundary>
    <BrowserRouter>
      {showWhatsNew && <WhatsNewModal onClose={handleCloseWhatsNew} />}
      <AppShell>
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
      </AppShell>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
