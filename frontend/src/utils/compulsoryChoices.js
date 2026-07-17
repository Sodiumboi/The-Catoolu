// occupations.js compulsoryChoices — 4 entry types, each resolves (once the player finishes
// choosing) to one or more plain skill-name strings identical in shape to compulsorySkills
// entries. This lets every existing consumer merge resolved choices in exactly the same way it
// already merges chosenSpecialties — no new grouping/serialization logic anywhere downstream.
//
// { type: 'free',   pick: N, label: string }
//   No fixed list — player picks N skills from anywhere (getSkillCatalog()). Resolved value
//   (chosen[i]) is a string[] of length `pick` once resolved.
//
// { type: 'fixed',  pick: N, from: string[] }
//   Pick N from a pre-flattened, exhaustive list of already-canonical skill-name strings
//   (nesting resolved at data-authoring time, not at runtime). Resolved value is a string[]
//   subset of `from`, length `pick`.
//
// { type: 'open',   pick: N, group: string, examples: (string | { name: string, eras: string[] })[] }
//   Pick N specialties within `group` — suggestion chips from `examples` (may be empty) plus a
//   free-text escape hatch. Each example is either a plain string (era-agnostic, always
//   offered — the common case) or a small `{ name, eras }` object for the rare example
//   genuinely restricted to specific game eras (sparse exception, mirrors allSkills.js's
//   SKILL_ERAS convention for whole skills — most examples need no tag at all). Use the
//   exampleName()/isExampleVisible() helpers below to read an example generically regardless
//   of shape. Era tags only gate which chips are offered before resolution — the resolved
//   value itself is always a plain `${group} (${name})` string with no era metadata attached.
//   Resolved value is a string[] of length `pick`.
//
// { type: 'either', options: [{ group: string }, { group: string }] }
//   Pick exactly one of 2 groups. Picking 'Language (Own)' resolves immediately (no further
//   naming needed — matches CoC 7e "you already know your own language," Phase 2b's Group C
//   precedent). Picking any OTHER group requires the player to also type a specialty name in
//   the modal (identical in shape to the 'open' type's naming step). Resolved value is a single
//   string (not an array): either the fixed 'Own Language' token, or `${group} (${name})`.

// Locked resolution token for the 'Language (Own)' branch — the only branch that resolves to a
// fixed token without further naming. 'Language (Other)' has no fixed token: its resolved value
// is built live from the player's typed specialty name (see CompulsoryChoiceModal.jsx).
const EITHER_GROUP_TOKENS = {
  'Language (Own)': 'Own Language',
};

export function resolveEitherToken(groupName) {
  return EITHER_GROUP_TOKENS[groupName];
}

// Reads an 'open' entry's example generically — plain string or { name, eras } object.
export function exampleName(ex) {
  return typeof ex === 'string' ? ex : ex.name;
}

// True if an example should be offered as a suggestion chip for the given gameEra. Plain
// strings and untagged objects are always visible; a tagged object is visible only when
// gameEra is in its `eras` list.
export function isExampleVisible(ex, gameEra) {
  return typeof ex === 'string' || !ex.eras || ex.eras.includes(gameEra);
}

// Canonical per-group suggestion sets — the SAME content authored directly into occupations.js's
// 'open'-type entries (one canonical set per skill group). The 'open' branch reads each entry's own
// entry.examples; the 'free' branch has no per-entry examples (it resolves an arbitrary catalog
// group the player searched for), so it reuses this shared map keyed by group name. Each element
// follows the same string-or-{ name, eras } shape as entry.examples — read generically via
// exampleName()/isExampleVisible(). A group with no canonical set here simply offers no chips (the
// free-text specialty input is always available regardless).
export const GROUP_EXAMPLES = {
  'Fighting':         ['Axe', 'Garrote', 'Spear', 'Sword', 'Whip'],
  'Firearms':         ['Submachine Gun', 'Machine Gun', 'Flamethrower'],
  'Art/Craft':        ['Painting', 'Sculpture', 'Photography', 'Pottery', 'Woodworking'],
  'Survival':         ['Desert', 'Arctic', 'Jungle', 'Sea', 'Mountain'],
  'Language (Other)': ['French', 'German', 'Spanish', 'Latin', 'Mandarin'],
  'Science':          ['Chemistry', 'Biology', 'Geology', { name: 'Computer Science', eras: ['modern'] }],
};

export function isCompulsoryChoiceEntryResolved(entry, value) {
  if (entry.type === 'either') return typeof value === 'string' && value.length > 0;
  return Array.isArray(value) && value.length >= entry.pick;
}

// Flattens every FULLY resolved compulsoryChoices entry into one array of plain skill-name
// strings, ready to spread into the same [...new Set([...])] merge every consumer already uses
// for compulsorySkills + chosenSpecialties. Partially-resolved or untouched entries contribute
// nothing (same "vacuously incomplete" treatment specialtyChoices already gets before all picks
// are made).
export function resolveCompulsoryChoices(entries, chosen) {
  return (entries ?? []).flatMap((entry, i) => {
    const value = chosen?.[i];
    if (!isCompulsoryChoiceEntryResolved(entry, value)) return [];
    return entry.type === 'either' ? [value] : value;
  });
}

// Human-readable label for the "Occupation Choices" card trigger row + modal header.
// gameEra filters the 'open' branch's "(e.g. ...)" preview to only list era-visible examples —
// both callers (CompulsoryChoiceModal.jsx, StepOccupationSkills.jsx) always pass it.
export function describeCompulsoryChoiceEntry(entry, gameEra) {
  switch (entry.type) {
    case 'free':   return `Pick ${entry.pick} — ${entry.label}`;
    case 'fixed':  return `Pick ${entry.pick} from: ${entry.from.join(' or ')}`;
    case 'open': {
      const visible = (entry.examples ?? []).filter(ex => isExampleVisible(ex, gameEra)).map(exampleName);
      return `Pick ${entry.pick} — ${entry.group}${visible.length ? ` (e.g. ${visible.join(', ')})` : ''}`;
    }
    case 'either': return `Pick — ${entry.options.map(o => o.group).join(' or ')}`;
    default:       return '';
  }
}
