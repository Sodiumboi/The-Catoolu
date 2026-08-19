// Nat 1 / Nat 100 detection for the confetti + wojak easter egg.
//
// Simple rolls: a 1d100 roll IS its total, so the total is the die face.
// Expression rolls: the total is maths ('1d100 + 5' can total 100 without a
// nat 100), so the actual d100 faces have to be inspected instead.
//
// Returns 1, 100, or null.
export default function natD100(raw) {
  if (!raw) return null;

  if (raw.isExpression) {
    for (const group of raw.diceGroups || []) {
      if (!/^\d+d100$/.test(group.notation)) continue;
      if (group.rolls.includes(100)) return 100;
      if (group.rolls.includes(1))   return 1;
    }
    return null;
  }

  if (!raw.notation?.toLowerCase().includes('d100')) return null;
  return (raw.total === 1 || raw.total === 100) ? raw.total : null;
}
