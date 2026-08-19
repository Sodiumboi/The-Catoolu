// ══════════════════════════════════════════════════════════════
// The Catoolu — Dice Expression Engine
// Recursive-descent parser for math expressions containing dice.
// Handles: XdY, + - * /, parentheses, integer constants, unary minus.
// Every die goes through rollDie() → crypto.randomInt(). Never Math.random().
//
// Only reached when the simple XdY parser in dice.js declines the notation,
// so existing rolls (1d100, 2d6+3, 1d100adv) never touch this file.
// ══════════════════════════════════════════════════════════════

const { randomInt } = require('crypto');

// ── Limits ────────────────────────────────────────────────────
const MAX_EXPRESSION_LENGTH = 120;
const MAX_DICE_PER_GROUP    = 20;    // matches the simple parser's cap
const MAX_DICE_GROUPS       = 20;
const MIN_SIDES             = 2;
const MAX_SIDES             = 1000;  // matches the simple parser's cap
const MAX_ABS_TOTAL         = 1_000_000;

// ── User-facing failure ───────────────────────────────────────
// Flagged so callers can tell a bad expression apart from a real bug and
// only forward the former to the player.
function fail(message) {
  const err = new Error(message);
  err.isDiceError = true;
  throw err;
}

function rollDie(sides) {
  return randomInt(1, sides + 1); // min inclusive, max exclusive → 1..sides
}

// ── Tokenizer ─────────────────────────────────────────────────
// '2d10 + 5 * 6' → [dice(2,10), op(+), num(5), op(*), num(6)]
// Dice are matched before bare numbers so '2d10' never splits into 2 and d10.
function tokenize(input) {
  const src    = input.toLowerCase();
  const tokens = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (ch === ' ' || ch === '\t') { i++; continue; }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: ch });
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    const rest = src.slice(i);

    const dice = rest.match(/^(\d*)d(\d+)/);
    if (dice) {
      const count = dice[1] === '' ? 1 : parseInt(dice[1], 10); // bare d20 = 1d20
      const sides = parseInt(dice[2], 10);

      if (count < 1 || count > MAX_DICE_PER_GROUP) {
        fail(`"${dice[0]}" rolls too many dice — the limit is ${MAX_DICE_PER_GROUP} per group.`);
      }
      if (sides < MIN_SIDES || sides > MAX_SIDES) {
        fail(`"${dice[0]}" needs between ${MIN_SIDES} and ${MAX_SIDES} sides.`);
      }

      tokens.push({ type: 'dice', count, sides });
      i += dice[0].length;
      continue;
    }

    const num = rest.match(/^\d+/);
    if (num) {
      tokens.push({ type: 'num', value: parseInt(num[0], 10) });
      i += num[0].length;
      continue;
    }

    if (ch === 'd') fail('Dice notation needs a number of sides, e.g. 1d6.');
    fail(`"${ch}" isn't something the dice roller understands. Use only numbers, dice, + - * / and parentheses.`);
  }

  return tokens;
}

// ── Parser ────────────────────────────────────────────────────
//   expression := term (('+' | '-') term)*
//   term       := factor (('*' | '/') factor)*
//   factor     := ('+' | '-') factor | primary
//   primary    := dice | number | '(' expression ')'
// Precedence falls out of the grammar — * / bind tighter than + -.
function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpression() {
    let node = parseTerm();
    while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = next().value;
      node = { type: 'binary', op, left: node, right: parseTerm() };
    }
    return node;
  }

  function parseTerm() {
    let node = parseFactor();
    while (peek()?.type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = next().value;
      node = { type: 'binary', op, left: node, right: parseFactor() };
    }
    return node;
  }

  function parseFactor() {
    const token = peek();
    if (!token) fail('The expression ends unexpectedly — something is missing after the last operator.');

    if (token.type === 'op' && (token.value === '-' || token.value === '+')) {
      next();
      const operand = parseFactor();
      return token.value === '-' ? { type: 'unary', operand } : operand;
    }

    return parsePrimary();
  }

  function parsePrimary() {
    const token = next();
    if (!token) fail('The expression ends unexpectedly.');

    if (token.type === 'num')  return { type: 'number', value: token.value };
    if (token.type === 'dice') return { type: 'dice', count: token.count, sides: token.sides };

    if (token.type === '(') {
      const inner = parseExpression();
      const close = next();
      if (!close || close.type !== ')') fail('Unmatched parenthesis — every ( needs a matching ).');
      inner.paren = true; // remembered so the result string keeps the grouping the player typed
      return inner;
    }

    if (token.type === ')') fail('Unmatched parenthesis — every ) needs a matching (.');
    fail(`Unexpected "${token.value}" in the expression.`);
  }

  if (tokens.length === 0) fail('Nothing to roll.');

  const ast = parseExpression();
  if (pos < tokens.length) {
    const stray = peek();
    fail(stray.type === ')'
      ? 'Unmatched parenthesis — every ) needs a matching (.'
      : 'The expression has leftover parts the roller could not read.');
  }
  return ast;
}

// ── Evaluator ─────────────────────────────────────────────────
// Depth-first, left-to-right, so diceGroups come out in the order they were
// typed. The rolled group is stashed on the node for the result string.
function evaluate(node, groups) {
  switch (node.type) {
    case 'number':
      return node.value;

    case 'dice': {
      if (groups.length >= MAX_DICE_GROUPS) {
        fail(`Too many dice groups — the limit is ${MAX_DICE_GROUPS}.`);
      }
      const rolls = [];
      for (let i = 0; i < node.count; i++) rolls.push(rollDie(node.sides));
      const group = {
        notation: `${node.count}d${node.sides}`,
        rolls,
        sum: rolls.reduce((a, b) => a + b, 0),
      };
      groups.push(group);
      node.group = group;
      return group.sum;
    }

    case 'unary':
      return -evaluate(node.operand, groups);

    case 'binary': {
      const left  = evaluate(node.left,  groups);
      const right = evaluate(node.right, groups);
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/':
          if (right === 0) fail('Division by zero — that roll has no answer.');
          return Math.floor(left / right);
      }
      return fail('Unsupported operator.');
    }

    default:
      return fail('Unsupported expression.');
  }
}

// ── Result string (Avrae style) ───────────────────────────────
// Each dice group is expanded in place: '2d10 (6, 9) + 5 * 6'
function render(node) {
  let out;
  switch (node.type) {
    case 'number': out = String(node.value); break;
    case 'dice':   out = `${node.group.notation} (${node.group.rolls.join(', ')})`; break;
    case 'unary':  out = '-' + render(node.operand); break;
    case 'binary': out = `${render(node.left)} ${node.op} ${render(node.right)}`; break;
    default:       out = '?';
  }
  return node.paren ? `(${out})` : out;
}

// ── Public entry point ────────────────────────────────────────
// Returns { expression, result, total, diceGroups }.
// Throws an Error with .isDiceError = true for anything the player can fix.
function evaluateExpression(input) {
  const expression = String(input || '').trim();

  if (!expression) fail('Nothing to roll.');
  if (expression.length > MAX_EXPRESSION_LENGTH) {
    fail(`That expression is too long — keep it under ${MAX_EXPRESSION_LENGTH} characters.`);
  }
  if (/(adv|dis)$/i.test(expression)) {
    fail('Advantage and disadvantage only work on a single roll, e.g. 1d100adv — not in a math expression.');
  }

  const tokens = tokenize(expression);
  if (!tokens.some(t => t.type === 'dice')) {
    fail('A roll needs at least one dice term, e.g. 2d6 + 3.');
  }

  const ast    = parse(tokens);
  const groups = [];
  const raw    = evaluate(ast, groups);

  if (!Number.isFinite(raw)) fail('That expression does not produce a number.');

  // Division can yield fractions; keep two decimals rather than silently flooring.
  const total = Math.round(raw * 100) / 100;
  if (Math.abs(total) > MAX_ABS_TOTAL) {
    fail(`That result is out of range — totals must stay within ±${MAX_ABS_TOTAL.toLocaleString('en-US')}.`);
  }

  return {
    expression: expression.toLowerCase(),
    result:     render(ast),
    total,
    diceGroups: groups,
  };
}

module.exports = { evaluateExpression, tokenize, parse, evaluate, render };
