// Small, unobtrusive "BETA" pill marking the character-creation flow as beta.
// Reuses the existing creation skill-row pill visual (see
// StepPersonalInterestSkills.jsx — the "occ" / "pre-filled" pills).
// Spacing is caller-owned: pass `className` (e.g. "ml-[0.4rem]") for the gap.
export default function BetaBadge({ className = '' }) {
  return (
    <span className={`inline-block align-middle text-[0.63rem] font-sans font-bold uppercase tracking-[0.04em] text-(--color-primary-dark) bg-(--color-primary-light) py-[0.05rem] px-[0.3rem] rounded-full ${className}`}>
      BETA
    </span>
  );
}
