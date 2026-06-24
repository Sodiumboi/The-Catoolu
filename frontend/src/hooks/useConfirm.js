import { useCallback, useRef, useState } from 'react';

/**
 * Promise-based confirmation hook paired with <ConfirmDialog />.
 *
 * Usage:
 *   const { confirm, dialogProps } = useConfirm();
 *   const ok = await confirm({ title: '...', message: '...', variant: 'danger' });
 *   if (!ok) return;
 *   // perform destructive action
 *
 *   // In JSX:
 *   <ConfirmDialog {...dialogProps} />
 *
 * Only one dialog can be open at a time per hook instance.
 */
export default function useConfirm() {
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'danger',
  });

  // Holds the active Promise resolver so state updates do not stale-close over it.
  const resolveRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    setDialog({
      open: true,
      title: opts.title ?? '',
      message: opts.message ?? '',
      confirmLabel: opts.confirmLabel ?? 'Confirm',
      cancelLabel: opts.cancelLabel ?? 'Cancel',
      variant: opts.variant ?? 'danger',
    });
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const close = useCallback(() => {
    setDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    close();
  }, [close]);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    close();
  }, [close]);

  const dialogProps = {
    open: dialog.open,
    title: dialog.title,
    message: dialog.message,
    confirmLabel: dialog.confirmLabel,
    cancelLabel: dialog.cancelLabel,
    variant: dialog.variant,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return { confirm, dialogProps };
}
