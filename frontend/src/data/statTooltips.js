export const STAT_TOOLTIPS = {
  STR: {
    name: "Strength",
    description: "Raw physical power — lifting, carrying, and melee damage.",
    normal: "Average human: 50–65. Most investigators: 40–80.",
  },
  CON: {
    name: "Constitution",
    description: "Physical health and stamina. Determines your max HP.",
    normal: "Average human: 50–65. Affects hit points directly.",
  },
  SIZ: {
    name: "Size",
    description: "Body mass and height. Affects HP and Damage Bonus.",
    normal: "Average human: 50–65. Combined with STR for Damage Bonus.",
  },
  DEX: {
    name: "Dexterity",
    description: "Speed, agility, and hand-eye coordination. Sets your Dodge base.",
    normal: "Average human: 50–65. Base Dodge = half DEX.",
  },
  APP: {
    name: "Appearance",
    description: "Physical attractiveness and first impressions. Decreases with age.",
    normal: "Average human: 50–65. Reduces with age past 40.",
  },
  INT: {
    name: "Intelligence",
    description: "Reasoning, memory, and problem-solving ability.",
    normal: "Average human: 50–65. Affects Idea roll (INT × 5).",
  },
  POW: {
    name: "Power",
    description: "Willpower, psychic potential, and spiritual strength. Sets starting Sanity and Luck.",
    normal: "Average human: 50–65. Starting Sanity = POW. Luck = separate 3D6×5 roll.",
  },
  EDU: {
    name: "Education",
    description: "Formal schooling and accumulated knowledge. Affects occupation skill points.",
    normal: "Average human: 40–60. Investigators often 60–80. Max 99.",
  },
};

export const DERIVED_TOOLTIPS = {
  HP: {
    name: "Hit Points",
    description: "Physical health. Reaches 0 and you're unconscious; negative = dying.",
    normal: "Max HP = (CON + SIZ) ÷ 10, rounded down.",
  },
  MP: {
    name: "Magic Points",
    description: "Used for spells and some special abilities. Recovers with rest.",
    normal: "Max MP = POW ÷ 5.",
  },
  SAN: {
    name: "Sanity",
    description: "Mental stability. Horror, spells, and mythos knowledge erode it.",
    normal: "Starting Sanity = POW. Max Sanity = 99 − Cthulhu Mythos skill.",
  },
  LUCK: {
    name: "Luck",
    description: "Fortune and fate. Can be spent to push rolls or avoid bad outcomes.",
    normal: "Rolled independently: 3D6 × 5. Not derived from any other stat.",
  },
  DB: {
    name: "Damage Bonus",
    description: "Extra damage added to melee and thrown weapon attacks.",
    normal: "Based on STR + SIZ combined. Average = none (0).",
  },
  BUILD: {
    name: "Build",
    description: "Physical presence in combat. Affects combat manoeuvres.",
    normal: "Based on STR + SIZ. Average = 0.",
  },
  DODGE: {
    name: "Dodge",
    description: "Chance to avoid an incoming attack by moving out of the way.",
    normal: "Base = half DEX. Can be improved with skill points.",
  },
  MOV: {
    name: "Move Rate",
    description: "How far you can move in a combat round. Decreases with age.",
    normal: "Typical value: 8 (if DEX or STR < SIZ), 9 (if both ≥ SIZ).",
  },
};
