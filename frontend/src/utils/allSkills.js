// Ordered skill display list for Step 7.
// Strings = simple named skills. Objects = free-name group slots.
// Occ skills not in this list are appended at the end.

const ALL_SKILLS = [
  'Accounting',
  'Anthropology',
  'Appraise',
  'Archaeology',
  { group: 'Art/Craft',        slots: 3 },
  'Charm',
  'Climb',
  'Computer Use',
  'Cthulhu Mythos',
  'Disguise',
  'Dodge',
  'Drive Auto',
  'Electrical Repair',
  'Electronics',
  'Fast Talk',
  { group: 'Fighting',         slots: 3 },
  { group: 'Firearms',         slots: 3 },
  'First Aid',
  'History',
  'Intimidate',
  'Jump',
  'Law',
  { group: 'Language (Other)', slots: 3 },
  { group: 'Language (Own)',   slots: 1, defaultName: 'English' },
  'Library Use',
  'Listen',
  'Locksmith',
  'Mechanical Repair',
  'Medicine',
  'Natural World',
  'Navigate',
  'Occult',
  'Operate Hvy Machinery',
  'Persuade',
  { group: 'Pilot',            slots: 2 },
  'Psychology',
  'Psychoanalysis',
  'Ride',
  { group: 'Science',          slots: 3 },
  'Sleight of Hand',
  'Spot Hidden',
  'Stealth',
  { group: 'Survival',         slots: 2 },
  'Swim',
  'Throw',
  'Track',
  { group: 'Misc',             slots: 5 },
];

// Skills only offered in specific game eras. A skill in this map is hidden from the
// Personal Interest picker (Step 7) and the final sheet build when the current era
// doesn't match AND the skill isn't already occupation-granted (isOcc carve-out).
export const SKILL_ERAS = {
  'Computer Use': ['modern'],
  'Electronics':  ['modern'],
};

// A flat, searchable catalog for the Free-choice-N picker: every simple skill name plus every
// group name (excluding Misc, which isn't a real skill category). SKILL_ERAS is intentionally NOT
// applied here — compulsory-choice picks are occupation-granted, so the isOcc carve-out already
// used at every ALL_SKILLS consumer makes era-gated skills correctly visible once picked.
// Cthulhu Mythos is excluded: it must always start at 0% and can never be raised during creation
// (Sanity = 99 − Cthulhu Mythos depends on this), so it must never be selectable as a free pick.
export function getSkillCatalog() {
  return ALL_SKILLS
    .filter(e => e !== 'Cthulhu Mythos' && (typeof e === 'string' || e.group !== 'Misc'))
    .map(e => (typeof e === 'string' ? { type: 'simple', name: e } : { type: 'group', name: e.group }));
}

export default ALL_SKILLS;
