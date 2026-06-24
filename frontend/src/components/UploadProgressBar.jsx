// Shared thin upload progress indicator.
// Renders a 3px accent-colored bar that fills from 0 to 100%.
// When `progress` is null (idle), nothing renders.
export default function UploadProgressBar({ progress }) {
  if (progress === null || progress === undefined) return null;

  const pct = Math.max(0, Math.min(100, progress));

  return (
    <div
      style={{
        width: '100%',
        height: 3,
        borderRadius: 2,
        background: 'var(--bg-card)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--accent)',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
}
