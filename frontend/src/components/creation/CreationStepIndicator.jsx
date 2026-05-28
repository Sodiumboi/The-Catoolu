const STEPS = [
  { n: 1, label: 'Details' },
  { n: 2, label: 'Era' },
  { n: 3, label: 'Stats' },
  { n: 4, label: 'Age' },
  { n: 5, label: 'Occupation' },
  { n: 6, label: 'Occ. Skills' },
  { n: 7, label: 'Interests' },
  { n: 8, label: 'Review' },
];

export default function CreationStepIndicator({ currentStep, goToStep }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '0.25rem',
    }}>
      {STEPS.map((step) => {
        const isDone    = step.n < currentStep;
        const isActive  = step.n === currentStep;
        const isLocked  = step.n > currentStep;

        return (
          <button
            key={step.n}
            onClick={() => isDone && goToStep(step.n)}
            disabled={isLocked || isActive}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              border: isActive
                ? '2px solid var(--color-primary)'
                : isDone
                  ? '2px solid var(--color-primary-mid)'
                  : '2px solid var(--border-main)',
              background: isActive
                ? 'var(--color-primary)'
                : isDone
                  ? 'var(--color-primary-light)'
                  : 'transparent',
              color: isActive
                ? '#fff'
                : isDone
                  ? 'var(--color-primary-dark)'
                  : 'var(--text-muted)',
              cursor: isDone ? 'pointer' : 'default',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-sans)',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
              opacity: isLocked ? 0.45 : 1,
            }}
          >
            <span style={{
              width: '1.1rem',
              height: '1.1rem',
              borderRadius: '50%',
              background: isActive ? 'rgba(255,255,255,0.25)' : isDone ? 'var(--color-primary-mid)' : 'var(--border-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: isActive ? '#fff' : isDone ? 'var(--color-primary-dark)' : 'var(--text-muted)',
              flexShrink: 0,
            }}>
              {isDone ? '✓' : step.n}
            </span>
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
