import axios from 'axios';

// Create an Axios instance with our base URL
// Because of the Vite proxy, /api automatically goes to localhost:3001
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ────────────────────────────────────
// Runs before EVERY outgoing request
// Automatically pulls the token from localStorage and adds it
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('coc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── DEV-only failure injection (error-handling testing) ────
// Armed from the admin Toast test panel. When active, makes real apiClient
// requests fail so the app's actual error toasts (real status/details/retry)
// fire without stopping the backend. The whole block is compiled out of
// production; in prod `devFailure` is null and `armDevFailure` is a no-op.
export const devFailure = import.meta.env.DEV ? { mode: 'off', once: true } : null;

export function armDevFailure(next) {
  if (devFailure) Object.assign(devFailure, next);
}

if (import.meta.env.DEV) {
  apiClient.interceptors.request.use((config) => {
    if (!devFailure || devFailure.mode === 'off') return config;
    if (config.url?.includes('/health')) return config; // never trip the health poll
    const { mode } = devFailure;
    if (devFailure.once) devFailure.mode = 'off'; // one-shot unless sticky
    if (mode === 'network') {
      return Promise.reject(Object.assign(new Error('Network Error'), { config }));
    }
    if (mode === 'timeout') {
      return Promise.reject(Object.assign(new Error('timeout of 10000ms exceeded'), { code: 'ECONNABORTED', config }));
    }
    // HTTP status modes ('500' / '503' / '429' / …) — shaped like a real axios error.
    return Promise.reject(Object.assign(new Error(`Simulated HTTP ${mode}`), {
      config,
      response: { status: Number(mode), data: { error: `Simulated ${mode} (dev failure injection)` } },
    }));
  });
}

// ── Response Interceptor ───────────────────────────────────
// Runs when EVERY response comes back
// If we get a 401 (unauthorized), token is expired — log the user out
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('coc_token');
      localStorage.removeItem('coc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
