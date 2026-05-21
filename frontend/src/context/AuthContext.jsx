import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

// 1. Create the context object
const AuthContext = createContext(null);

// 2. Create the Provider — wraps the whole app and shares state
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('coc_token');
    const savedUser  = localStorage.getItem('coc_user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.removeItem('coc_token');
        localStorage.removeItem('coc_user');
      }
    }
    setLoading(false);
  }, []);

  // ── Login ────────────────────────────────────────────────
  const login = async (identifier, password) => {
    const response = await apiClient.post('/auth/login', { identifier, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('coc_token', token);
    localStorage.setItem('coc_user', JSON.stringify(userData));
    setUser(userData);
    setToken(token);

    return userData;
  };

  // ── Register ─────────────────────────────────────────────
  const register = async (username, email, password) => {
    const response = await apiClient.post('/auth/register', { username, email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('coc_token', token);
    localStorage.setItem('coc_user', JSON.stringify(userData));
    setUser(userData);
    setToken(token);

    return userData;
  };

  // ── Logout ───────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('coc_token');
    localStorage.removeItem('coc_user');
    setUser(null);
    setToken(null);
  };

  const value = { user, token, loading, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Custom hook — components call useAuth() to access the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
