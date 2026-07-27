import { createContext, useContext, useReducer, useCallback, useMemo, useRef } from 'react';
import ToastContainer from '../components/ui/ToastContainer';

const ToastContext = createContext(null);

// Never show more than this many at once — the rest wait in `queue` and are
// promoted one-for-one as visible toasts dismiss.
const MAX_VISIBLE = 3;

// Auto-dismiss durations (ms) by type. `critical` is persistent (null) — it has
// no timer and no loading bar, and only leaves on manual close.
const DEFAULT_DURATION = {
  success: 5000,
  info:    5000,
  warning: 7000,
  error:   7000,
  critical: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      // Dedupe: ignore a new toast if an identical one (same type/title/message)
      // is already visible or queued. Collapses StrictMode double-invokes, rapid
      // double-clicks, and retry spam into a single toast.
      const isDup = (t) =>
        t.type === action.toast.type &&
        t.title === action.toast.title &&
        t.message === action.toast.message;
      if (state.toasts.some(isDup) || state.queue.some(isDup)) return state;
      // Overflow past MAX_VISIBLE goes to the queue instead of the visible stack.
      if (state.toasts.length < MAX_VISIBLE) {
        return { ...state, toasts: [...state.toasts, action.toast] };
      }
      return { ...state, queue: [...state.queue, action.toast] };
    }
    case 'DISMISS': {
      const remaining = state.toasts.filter((t) => t.id !== action.id);
      const removedVisible = remaining.length < state.toasts.length;
      let queue = state.queue.filter((t) => t.id !== action.id);
      let toasts = remaining;
      // A visible slot just freed — pull the next queued toast up into it.
      if (removedVisible && queue.length > 0) {
        toasts = [...remaining, queue[0]];
        queue = queue.slice(1);
      }
      return { toasts, queue };
    }
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { toasts: [], queue: [] });
  // Monotonic id source — unique for the session, no dependency needed.
  const idRef = useRef(0);

  const dismiss = useCallback((id) => dispatch({ type: 'DISMISS', id }), []);

  const toast = useCallback((options) => {
    const type = options.type || 'info';
    const persistent = options.persistent ?? (type === 'critical');
    const duration = persistent
      ? null
      : (options.duration ?? DEFAULT_DURATION[type] ?? 5000);
    const id = ++idRef.current;
    dispatch({
      type: 'ADD',
      toast: {
        id,
        type,
        title:      options.title,
        message:    options.message,
        action:     options.action,
        details:    options.details,
        duration,
        persistent,
        createdAt:  Date.now(),
      },
    });
    return id;
  }, []);

  // `toast`/`dismiss` are stable, so this value object is created once.
  const value = useMemo(() => ({
    toast,
    success:  (title, message, options = {}) => toast({ ...options, type: 'success',  title, message }),
    info:     (title, message, options = {}) => toast({ ...options, type: 'info',     title, message }),
    warning:  (title, message, options = {}) => toast({ ...options, type: 'warning',  title, message }),
    error:    (title, message, options = {}) => toast({ ...options, type: 'error',    title, message }),
    critical: (title, message, options = {}) => toast({ ...options, type: 'critical', title, message, persistent: true }),
    dismiss,
  }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={state.toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
