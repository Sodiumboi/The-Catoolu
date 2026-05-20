// ══════════════════════════════════════════════════════════════
// The Catoolu — Dice Roller Engine
// Uses crypto.randomInt() — OS hardware entropy pool
// CoC 7e notation parser + advantage/disadvantage + success levels
// ══════════════════════════════════════════════════════════════

const { randomInt } = require('crypto');

// ── Roll a single die — hardware entropy ──────────────────────
// randomInt(min, max) — min inclusive, max exclusive
// So randomInt(1, sides + 1) gives 1..sides
function rollDie(sides) {
  return randomInt(1, sides + 1);
}

// ── Dice notation parser ───────────────────────────────────────
// Accepts: 1d100, 2d6, d20, 1d6+2, 2d6-1, 1d100adv, 1d100dis
// Returns: { count, sides, modifier, advantage, disadvantage }
// Returns null if the notation is invalid
function parseNotation(notation) {
  if (!notation || typeof notation !== 'string') return null;

  const cleaned = notation.trim().toLowerCase();

  // Detect and strip advantage / disadvantage suffix first
  let advantage    = false;
  let disadvantage = false;
  let core         = cleaned;

  if (cleaned.endsWith('adv')) {
    advantage = true;
    core      = cleaned.slice(0, -3); // remove 'adv'
  } else if (cleaned.endsWith('dis')) {
    disadvantage = true;
    core         = cleaned.slice(0, -3); // remove 'dis'
  }

  // Parse the core notation: optional_count d sides optional_modifier
  const match = core.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
  if (!match) return null;

  const count    = parseInt(match[1] || '1');
  const sides    = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;

  // Sanity limits
  if (count < 1 || count > 20)   return null;
  if (sides < 2 || sides > 1000) return null;

  return { count, sides, modifier, advantage, disadvantage };
}

// ── Roll dice from parsed notation ────────────────────────────
// Handles normal rolls, advantage, and disadvantage.
// Returns { rolls, advDisRolls, total }
function rollDice(parsed) {
  const rolls = [];
  for (let i = 0; i < parsed.count; i++) {
    rolls.push(rollDie(parsed.sides));
  }

  let total;
  let advDisRolls = null;

  if (parsed.advantage || parsed.disadvantage) {
    // Roll a second set for comparison
    const rolls2 = [];
    for (let i = 0; i < parsed.count; i++) {
      rolls2.push(rollDie(parsed.sides));
    }

    const sum1 = rolls.reduce((a, b) => a + b, 0);
    const sum2 = rolls2.reduce((a, b) => a + b, 0);

    // Store both sets so the UI can show them
    advDisRolls = [rolls, rolls2];

    // Advantage  = take lower  (lower is better in CoC — roll under skill)
    // Disadvantage = take higher (higher is worse in CoC)
    total = parsed.advantage
      ? Math.min(sum1, sum2)
      : Math.max(sum1, sum2);
  } else {
    total = rolls.reduce((a, b) => a + b, 0);
  }

  total += parsed.modifier;
  return { rolls, advDisRolls, total };
}

// ── CoC 7e Success Level Calculator ───────────────────────────
// Only meaningful for 1d100 rolls against a skill value.
function calcSuccessLevel(roll, skillValue) {
  if (!skillValue || skillValue <= 0) return null;

  const skill   = parseInt(skillValue);
  const extreme = Math.floor(skill / 5);
  const hard    = Math.floor(skill / 2);

  // Skills < 50: fumble on 96-100
  // Skills ≥ 50: fumble on 100 only
  const fumbleThreshold = skill < 50 ? 96 : 100;

  if (roll === 1)              return { label: 'Critical Success', severity: 'critical', emoji: '⭐' };
  if (roll >= fumbleThreshold) return { label: 'Fumble',           severity: 'fumble',   emoji: '💀' };
  if (roll >= 96)              return { label: 'Failure',          severity: 'failure',  emoji: '❌' };
  if (roll <= extreme)         return { label: 'Extreme Success',  severity: 'extreme',  emoji: '🟣' };
  if (roll <= hard)            return { label: 'Hard Success',     severity: 'hard',     emoji: '🔵' };
  if (roll <= skill)           return { label: 'Regular Success',  severity: 'regular',  emoji: '🟢' };
  return                              { label: 'Failure',          severity: 'failure',  emoji: '❌' };
}

// ── Main roll function ─────────────────────────────────────────
// Called by the socket handler.
// Returns a complete result object ready to store in messages.
function roll(notation, skillValue = null, skillName = null) {
  const parsed = parseNotation(notation);

  if (!parsed) {
    return {
      error: `Invalid dice notation: "${notation}". Try: 1d100, 2d6+3, d20, 1d100adv, 1d100dis`
    };
  }

  const { rolls, advDisRolls, total } = rollDice(parsed);

  // Success level only applies to 1d100 with a skill value
  const successLevel = (parsed.count === 1 && parsed.sides === 100)
    ? calcSuccessLevel(total, skillValue)
    : null;

  const modStr = parsed.modifier > 0 ? '+' + parsed.modifier
               : parsed.modifier < 0 ? '' + parsed.modifier
               : '';

  const advDisLabel = parsed.advantage    ? ' (Advantage)'
                    : parsed.disadvantage ? ' (Disadvantage)'
                    : '';

  let summary;
  if (successLevel) {
    summary = successLevel.emoji + ' ' + total + advDisLabel + ' — ' + successLevel.label;
  } else if (rolls.length > 1) {
    summary = rolls.join(' + ') + modStr + advDisLabel + ' = ' + total;
  } else {
    summary = total + modStr + advDisLabel;
  }

  return {
    notation:      notation.toLowerCase(),
    rolls,
    advDisRolls,
    modifier:      parsed.modifier,
    total,
    advantage:     parsed.advantage,
    disadvantage:  parsed.disadvantage,
    skillName:     skillName  || null,
    skillValue:    skillValue || null,
    successLevel,
    summary,
  };
}

// ── Parse a /roll command string ──────────────────────────────
// "/roll 1d100adv" → "1d100adv"
// "/roll 2d6+3"    → "2d6+3"
function parseCommand(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed.startsWith('/roll')) return null;
  const notation = trimmed.replace(/^\/roll\s*/i, '').trim();
  return notation || null;
}

module.exports = { roll, parseNotation, parseCommand, calcSuccessLevel };