import { describe, it, expect } from 'vitest';
import en from './en.json';
import th from './th.json';

// Flatten nested JSON into dot-notation keys
function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(acc, flattenKeys(value, fullKey));
    } else {
      acc[fullKey] = value;
    }
    return acc;
  }, {});
}

// Extract {{variable}} placeholders from a string
function extractVars(str) {
  return (str.match(/\{\{[^}]+\}\}/g) || []).sort();
}

describe('i18n — key completeness', () => {
  const enFlat = flattenKeys(en);
  const thFlat = flattenKeys(th);
  const enKeys = Object.keys(enFlat);
  const thKeys = Object.keys(thFlat);

  it('every EN key exists in TH', () => {
    const missing = enKeys.filter(k => !Object.hasOwn(thFlat, k));
    expect(missing, `Missing from th.json: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('every TH key exists in EN', () => {
    const extra = thKeys.filter(k => !Object.hasOwn(enFlat, k));
    expect(extra, `Extra in th.json (not in en.json): ${extra.join(', ')}`).toHaveLength(0);
  });

  it('no EN value is an empty string', () => {
    const empty = enKeys.filter(k => enFlat[k] === '');
    expect(empty, `Empty EN values: ${empty.join(', ')}`).toHaveLength(0);
  });

  // SKIPPED ON PURPOSE — do not "fix" this by deleting it.
  // th.json is filled in progressively as the translator delivers copy, so blank
  // TH values are the expected state *during* translation and this test would
  // fail continuously and train everyone to ignore a red suite.
  // Enable it (drop the `.skip`) once translation is complete — from then on a
  // blank TH value is a real regression.
  it.skip('no TH value is an empty string — enable after translation complete', () => {
    const empty = thKeys.filter(k => thFlat[k] === '');
    expect(empty, `${empty.length} TH values still blank: ${empty.join(', ')}`).toHaveLength(0);
  });

  it('interpolation variables match between EN and TH', () => {
    const mismatches = [];
    enKeys.forEach(key => {
      if (!thFlat[key]) return;
      const enVars = extractVars(enFlat[key]);
      const thVars = extractVars(thFlat[key]);
      if (JSON.stringify(enVars) !== JSON.stringify(thVars)) {
        mismatches.push(
          `${key}: EN has ${JSON.stringify(enVars)}, TH has ${JSON.stringify(thVars)}`
        );
      }
    });
    expect(mismatches, `Variable mismatches:\n${mismatches.join('\n')}`).toHaveLength(0);
  });
});