import { StrictMode }          from 'react';
import { createRoot }          from 'react-dom/client';
import './index.css';
import App                     from './App.jsx';
import { AuthProvider }           from './context/AuthContext';
import { SocketProvider }         from './context/SocketContext';
import { CampaignProvider }       from './context/CampaignContext';
import { ThemeProvider }          from './context/ThemeContext';
import { NavBarActionsProvider }  from './context/NavBarActionsContext';
import { ToastProvider }           from './context/ToastContext';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <CampaignProvider>
          <ThemeProvider>
            <NavBarActionsProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </NavBarActionsProvider>
          </ThemeProvider>
        </CampaignProvider>
      </SocketProvider>
    </AuthProvider>
  </StrictMode>
);