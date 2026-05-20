import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CharacterEditorPage from './pages/CharacterEditor';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import ProfilePage        from './pages/ProfilePage';
import KeeperPage   from './pages/KeeperPage';
import CampaignPage from './pages/CampaignPage';
import InboxPage    from './pages/InboxPage';

// ── Forces full remount when character ID changes ──────────
function CharacterEditorWithKey() {
  const { id } = useParams();
  return (
    <ProtectedRoute>
      <CharacterEditorPage key={id} />
    </ProtectedRoute>
  );
}



// ── Main App ───────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
            <Route path="/reset-password"   element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            }/>
            <Route path="/character/:id" element={<CharacterEditorWithKey />} />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            }/>

            {/* Fallbacks */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
            
            <Route
              path="/keeper"
              element={
                <ProtectedRoute>
                  <KeeperPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaign"
              element={
                <ProtectedRoute>
                  <CampaignPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <InboxPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}