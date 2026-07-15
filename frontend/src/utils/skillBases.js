// CoC 7e base skill values. Used in Steps 6 and 7.
// occupationSkills and personalSkills store points ABOVE base.
// Actual displayed value = base + allocated.

import { calcDodge } from './cocCalculations';

const BASES = {
  'Cthulhu Mythos': 0,
  'Accounting': 5,
  'Anthropology': 1,
  'Appraise': 5,
  'Archaeology': 1,
  'Art/Craft': 5,
  'Art/Craft (Acting)': 5,
  'Art/Craft (Farming)': 5,
  'Art/Craft (Photography)': 5,
  'Charm': 15,
  'Climb': 20,
  'Disguise': 5,
  'Drive Auto': 20,
  'Electrical Repair': 10,
  'Fast Talk': 5,
  'Fighting (Brawl)': 25,
  'Fighting (Bayonet)': 15,
  'Fighting (Knife)': 25,
  'Firearms': 20,
  'Firearms (Handgun)': 20,
  'Firearms (Rifle/Shotgun)': 25,
  'Firearms (Machine Gun)': 10,
  'First Aid': 30,
  'History': 5,
  'Intimidate': 15,
  'Jump': 20,
  'Law': 5,
  'Library Use': 20,
  'Listen': 20,
  'Locksmith': 1,
  'Mechanical Repair': 10,
  'Medicine': 1,
  'Natural World': 10,
  'Navigate': 10,
  'Occult': 5,
  'Operate Hvy Machinery': 1,
  'Persuade': 10,
  'Pilot (Aircraft)': 1,
  'Pilot (Boat)': 1,
  'Psychology': 10,
  'Psychoanalysis': 1,
  'Ride': 5,
  'Sleight of Hand': 10,
  'Spot Hidden': 25,
  'Stealth': 20,
  'Survival': 10,
  'Swim': 20,
  'Throw': 20,
  'Track': 10,
};

// Any skill not in BASES gets 1% base, except Own Language = EDU.
export function getSkillBase(skillName, edu, dex) {
  if (skillName === 'Dodge') return calcDodge(dex);
  if (/^Language \(Own\)/.test(skillName) || skillName === 'Own Language' || skillName === 'Language Own') return edu;
  if (BASES[skillName] !== undefined) return BASES[skillName];
  // Pattern matches for generic names
  if (/^Art\/Craft/.test(skillName))       return 5;
  if (/^Fighting/.test(skillName))         return 25;
  if (/^Firearms/.test(skillName))         return 20;
  if (/^Survival/.test(skillName))         return 10;
  if (/^Pilot/.test(skillName))            return 1;
  if (/^Science/.test(skillName))          return 1;
  if (/^Other Language/.test(skillName))   return 1;
  if (/^Language/.test(skillName))         return 1;
  return 1;
}

// Weapon skills that come pre-filled at their base value for the player
// (no allocation needed to reach base). Used to render a "pre-filled" badge.
export const PREFILLED_WEAPON_SKILLS = ['Fighting (Brawl)', 'Firearms (Handgun)', 'Firearms (Rifle/Shotgun)'];
