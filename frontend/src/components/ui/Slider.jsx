// ── iOS-style custom slider ────────────────────────────────────
// Reusable controlled range input styled to match the Apple/iOS aesthetic:
//   - Thin rounded track (~6px), accent-filled left portion
//   - Round white thumb (~24px) with soft shadow
//   - Cross-browser (Chrome/Safari/Firefox) via .cat-slider pseudo-elements in index.css
//
// Props:
//   value     — controlled value (number)
//   min       — minimum value
//   max       — maximum value
//   step      — step increment
//   onChange  — called with the new numeric value
//   ariaLabel — accessible label string
//
// The fill uses a CSS linear-gradient computed from (value-min)/(max-min) to
// colour the track left-of-thumb with var(--accent) and right with var(--border-input).

export default function Slider({ value, min, max, step, onChange, ariaLabel }) {
  const pct = ((value - min) / (max - min)) * 100;

  const handleChange = (e) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <input
      type="range"
      className="cat-slider"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel}
      // Inline custom property drives the accent-fill gradient in index.css.
      // This avoids JS DOM manipulation while keeping it reactive to the value.
      style={{ '--cat-slider-pct': `${pct}%` }}
    />
  );
}
