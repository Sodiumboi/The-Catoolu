import { createPortal } from 'react-dom';
import Toast from './Toast';

// Fixed, top-right stack that portals above everything (z-10001 clears the real
// ceiling — the CustomDropdown panel at 10000). The container itself is
// click-through (pointer-events-none); each Toast re-enables its own pointer
// events so the gaps between toasts never trap clicks meant for the page.
export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return createPortal(
    <div
      className="fixed top-17 right-4 z-[10001] flex flex-col gap-3 pointer-events-none"
      role="region"
      aria-label="Notifications">
      {/* Newest on top — reverse the insertion-ordered array for render. */}
      {[...toasts].reverse().map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}
