// ── Section ──────────────────────────────────────────────────────────
// The bordered card with an uppercase accent header used to frame each
// part of the sheet. Shared by the OG Editor and KeeperSheet so the two
// engines render identical chrome.

export default function Section({ title, children }) {
  return (
    <div className="rounded-lg border mb-6 overflow-hidden border-(--border-main) bg-(--bg-card)">
      <div className="px-4 py-2 border-b border-(--border-main) bg-(--bg-section-hd)">
        <h2 className="text-xs font-bold uppercase tracking-widest text-(--accent)">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
