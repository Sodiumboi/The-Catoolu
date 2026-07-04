import { useRef, useEffect } from 'react';

/**
 * Themed checkbox — replaces the OS-native <input type="checkbox">, whose
 * blue chrome clashes with the app's accent palette. A visually-hidden real
 * input sits on top for keyboard/focus/a11y; the styled box renders the state.
 *
 * Props:
 *   checked        bool  — checked state
 *   indeterminate  bool  — partial state (shows a dash; ignored when checked)
 *   onChange       func   — native change handler
 *   disabled       bool
 *   ariaLabel      string — accessible name when no visible <label> wraps it
 */
export default function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  ariaLabel,
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  const active = checked || indeterminate;

  return (
    <span className="relative inline-flex items-center justify-center w-4 h-4 shrink-0">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`absolute inset-0 w-full h-full m-0 opacity-0 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      />
      <span
        className={`pointer-events-none w-4 h-4 rounded-[5px] border flex items-center justify-center [transition:background-color_0.12s,border-color_0.12s] ${active ? 'bg-(--color-primary) border-(--color-primary)' : 'bg-(--bg-card) border-(--border-input)'} ${disabled ? 'opacity-50' : ''}`}
      >
        {checked
          ? <span className="material-symbols-outlined text-[10px]! leading-none text-white">check</span>
          : indeterminate && <span className="w-2 h-0.5 rounded-full bg-white" />}
      </span>
    </span>
  );
}
