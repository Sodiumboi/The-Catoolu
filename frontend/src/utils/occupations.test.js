import { describe, it, expect } from 'vitest';
import OCCUPATIONS from './occupations';

// Field names below are the ones occupations.js actually uses:
//   erasAvailable (array)  — NOT `era`. An EMPTY array means "usable in every
//                            era"; StepOccupationPicker only flags an occupation
//                            as era-unusual when the array is non-empty, so 60
//                            empty arrays are intentional data, not a gap.
//   skillPointsCalc (fn)   — NOT `skillPoints`. Paired with skillPointsFormula,
//                            the human-readable string shown in the wizard.
describe('occupation data integrity', () => {
  it('all occupations have required fields', () => {
    const missing = [];
    OCCUPATIONS.forEach(occ => {
      const label = occ.name || occ.id || 'unknown';
      if (!occ.name) missing.push(`${occ.id || 'unknown'}: missing name`);
      if (!occ.id) missing.push(`${label}: missing id`);
      if (!Array.isArray(occ.erasAvailable)) missing.push(`${label}: missing erasAvailable array`);
      if (typeof occ.skillPointsCalc !== 'function') missing.push(`${label}: missing skillPointsCalc`);
      if (!occ.skillPointsFormula) missing.push(`${label}: missing skillPointsFormula`);
      if (typeof occ.creditRating?.min !== 'number') missing.push(`${label}: missing creditRating.min`);
      if (typeof occ.creditRating?.max !== 'number') missing.push(`${label}: missing creditRating.max`);
      if (!Array.isArray(occ.compulsorySkills)) missing.push(`${label}: missing compulsorySkills array`);
      if (!Array.isArray(occ.specialtyChoices)) missing.push(`${label}: missing specialtyChoices array`);
      if (typeof occ.cashAndAssets !== 'function') missing.push(`${label}: missing cashAndAssets`);
    });
    expect(missing, missing.join('\n')).toHaveLength(0);
  });

  it('no duplicate occupation ids', () => {
    const ids = OCCUPATIONS.map(o => o.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `Duplicate ids: ${dupes.join(', ')}`).toHaveLength(0);
  });

  it('creditRating min is not above max', () => {
    const bad = OCCUPATIONS
      .filter(o => o.creditRating.min > o.creditRating.max)
      .map(o => `${o.name}: ${o.creditRating.min} > ${o.creditRating.max}`);
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  it('skillPointsCalc returns a positive number for an average investigator', () => {
    const avg = { STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50 };
    const bad = [];
    OCCUPATIONS.forEach(occ => {
      const pts = occ.skillPointsCalc(avg);
      if (typeof pts !== 'number' || !Number.isFinite(pts) || pts <= 0) {
        bad.push(`${occ.name}: skillPointsCalc returned ${pts}`);
      }
    });
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  it('all compulsoryChoices entries have required fields', () => {
    const errors = [];
    OCCUPATIONS.forEach(occ => {
      if (!occ.compulsoryChoices) return;
      occ.compulsoryChoices.forEach((choice, i) => {
        const at = `${occ.name} choice[${i}]`;
        if (!choice.type) {
          errors.push(`${at}: missing type`);
          return;
        }
        // The four types in use: fixed (pick from a named list), free (any
        // skill), open (any specialty within a group), either (one of N groups).
        switch (choice.type) {
          case 'fixed':
            if (!choice.from?.length) errors.push(`${at}: fixed type missing from array`);
            break;
          case 'free':
            if (!choice.pick) errors.push(`${at}: free type missing pick count`);
            break;
          case 'open':
            if (!choice.pick) errors.push(`${at}: open type missing pick count`);
            if (!choice.group) errors.push(`${at}: open type missing group`);
            break;
          case 'either':
            if (!choice.options?.length) errors.push(`${at}: either type missing options array`);
            break;
          default:
            errors.push(`${at}: unknown type "${choice.type}"`);
        }
      });
    });
    expect(errors, errors.join('\n')).toHaveLength(0);
  });

  it('total occupation count is 116', () => {
    expect(OCCUPATIONS).toHaveLength(116);
  });
});
