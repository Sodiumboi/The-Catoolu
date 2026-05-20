export default function UnsavedChangesModal({ changedSections, onCancel, onDiscard, onSave, saving }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-dropdown)',
          padding: '28px',
          width: '100%', maxWidth: '420px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '22px' }}>⚠️</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--text-primary)', margin: 0 }}>
            Unsaved Changes
          </h2>
        </div>

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: '1.6' }}>
          You have unsaved changes to this investigator:
        </p>

        {changedSections.length > 0 && (
          <ul style={{ margin: '0 0 20px', padding: '12px 16px', background: 'var(--bg-section-hd)', borderRadius: '8px', border: '1px solid var(--border-main)', listStyle: 'none' }}>
            {changedSections.map(section => (
              <li key={section} style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-primary)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--warning)', fontSize: '10px' }}>●</span>
                {section}
              </li>
            ))}
          </ul>
        )}

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px' }}>
          What would you like to do?
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            Cancel
          </button>
          <button onClick={onDiscard}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Discard Changes
          </button>
          <button onClick={onSave} disabled={saving}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: saving ? 'var(--text-muted)' : 'var(--color-primary)', color: '#ffffff', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s ease' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary-dark)'; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary)'; }}>
            {saving ? 'Saving...' : '💾 Save & Leave'}
          </button>
        </div>
      </div>
    </div>
  );
}
