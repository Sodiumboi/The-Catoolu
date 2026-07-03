export default function UnsavedChangesModal({ changedSections, onCancel, onDiscard, onSave, saving }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-200 p-6 bg-black/50 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-(--bg-card) border border-(--border-main) rounded-2xl shadow-(--shadow-dropdown) p-7 w-full max-w-105"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <span className="icon text-[22px]">warning</span>
          <h2 className="font-serif text-xl text-(--text-primary) m-0">
            Unsaved Changes
          </h2>
        </div>

        <p className="font-sans text-sm text-(--text-secondary) mt-0 mb-3 leading-[1.6]">
          You have unsaved changes to this investigator:
        </p>

        {changedSections.length > 0 && (
          <ul className="m-0 mb-5 p-3 px-4 bg-(--bg-section-hd) rounded-lg border border-(--border-main) list-none">
            {changedSections.map(section => (
              <li key={section} className="font-sans text-[13px] text-(--text-primary) py-0.75 flex items-center gap-2">
                <span className="text-(--warning) text-[10px]">●</span>
                {section}
              </li>
            ))}
          </ul>
        )}

        <p className="font-sans text-[13px] text-(--text-muted) mt-0 mb-6">
          What would you like to do?
        </p>

        <div className="flex gap-2.5 justify-end">
          <button onClick={onCancel}
            className="py-2 px-4 rounded-lg border border-(--border-main) bg-transparent text-(--text-secondary) font-sans text-[13px] cursor-pointer [transition:all_0.15s]"
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            Cancel
          </button>
          <button onClick={onDiscard}
            className="py-2 px-4 rounded-lg border border-(--danger) bg-transparent text-(--danger) font-sans text-[13px] cursor-pointer [transition:all_0.15s]"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Discard Changes
          </button>
          <button onClick={onSave} disabled={saving}
            className={`py-2 px-4 rounded-lg border-none text-white font-sans text-[13px] font-medium [transition:background_0.15s] ${saving ? 'bg-(--text-muted) cursor-not-allowed' : 'bg-(--color-primary) cursor-pointer'}`}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary-dark)'; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary)'; }}>
            {saving ? 'Saving...' : <><span className="icon icon-sm">save</span>{' '}Save & Leave</>}
          </button>
        </div>
      </div>
    </div>
  );
}
