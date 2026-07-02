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
    <div className="flex items-center mb-8 flex-wrap gap-1">
      {STEPS.map((step) => {
        const isDone    = step.n < currentStep;
        const isActive  = step.n === currentStep;
        const isLocked  = step.n > currentStep;

        return (
          <button
            key={step.n}
            onClick={() => isDone && goToStep(step.n)}
            disabled={isLocked || isActive}
            className={`flex items-center gap-[0.35rem] py-[0.35rem] px-3 rounded-full border-2 font-sans text-[0.78rem] [transition:all_0.15s] ${isActive ? 'border-(--color-primary) bg-(--color-primary) text-white font-semibold cursor-default' : isDone ? 'border-(--color-primary-mid) bg-(--color-primary-light) text-(--color-primary-dark) font-normal cursor-pointer' : 'border-(--border-main) bg-transparent text-(--text-muted) font-normal cursor-default'} ${isLocked ? 'opacity-45' : 'opacity-100'}`}
          >
            <span className={`w-[1.1rem] h-[1.1rem] rounded-full flex items-center justify-center text-[0.65rem] font-bold shrink-0 ${isActive ? 'bg-[rgba(255,255,255,0.25)] text-white' : isDone ? 'bg-(--color-primary-mid) text-(--color-primary-dark)' : 'bg-(--border-main) text-(--text-muted)'}`}>
              {isDone ? '✓' : step.n}
            </span>
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
