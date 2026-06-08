import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import ProtectedRoute     from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CharacterEditorPage from './pages/CharacterEditor';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import ProfilePage        from './pages/ProfilePage';
import KeeperPage   from './pages/KeeperPage';
import CampaignPage     from './pages/CampaignPage';
import InboxPage        from './pages/InboxPage';
import CampaignRoomPage from './pages/CampaignRoomPage';
import CharacterCreationPage from './pages/CharacterCreationPage';

// ── Forces full remount when character UUID changes ─────────
function CharacterEditorWithKey() {
  const { uuid } = useParams();
  return (
    <ProtectedRoute>
      <CharacterEditorPage key={uuid} />
    </ProtectedRoute>
  );
}



// ── Main App ───────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
            {/* Public routes */}
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
            <Route path="/reset-password"   element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            }/>
            <Route path="/character/:uuid" element={<CharacterEditorWithKey />} />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            }/>

            {/* Hidden creation engine — no NavBar link */}
            <Route path="/plzwork" element={
              <ProtectedRoute><CharacterCreationPage /></ProtectedRoute>
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
            <Route
              path="/campaign/:uuid"
              element={
                <ProtectedRoute>
                  <CampaignRoomPage />
                </ProtectedRoute>
              }
            />
      </Routes>
    </BrowserRouter>
  );
}