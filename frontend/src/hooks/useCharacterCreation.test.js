import { describe, it, expect } from 'vitest';
import { getAgeUpdates } from './useCharacterCreation';

describe('getAgeUpdates', () => {
  it('handles age 15-19 correctly', () => {
    const res = getAgeUpdates(15);
    expect(res).toEqual({
      eduRolls: 0,
      deductionTotal: 5,
      eligibleStats: ['STR', 'SIZ'],
      eduPenalty: 5,
    });
  });

  it('handles age 20-39 correctly', () => {
    const res = getAgeUpdates(25);
    expect(res).toEqual({
      eduRolls: 1,
      deductionTotal: 0,
      eligibleStats: [],
      eduPenalty: 0,
    });
  });

  it('handles age 40-49 correctly', () => {
    const res = getAgeUpdates(45);
    expect(res).toEqual({
      eduRolls: 2,
      deductionTotal: 5,
      eligibleStats: ['STR', 'CON', 'DEX', 'APP'],
      eduPenalty: 0,
    });
  });

  it('handles age 50-59 correctly', () => {
    const res = getAgeUpdates(55);
    expect(res).toEqual({
      eduRolls: 3,
      deductionTotal: 10,
      eligibleStats: ['STR', 'CON', 'DEX', 'APP'],
      eduPenalty: 0,
    });
  });

  it('handles age 60-69 correctly', () => {
    const res = getAgeUpdates(65);
    expect(res).toEqual({
      eduRolls: 4,
      deductionTotal: 20,
      eligibleStats: ['STR', 'CON', 'DEX', 'APP'],
      eduPenalty: 0,
    });
  });

  it('handles age 70-79 correctly', () => {
    const res = getAgeUpdates(75);
    expect(res).toEqual({
      eduRolls: 4,
      deductionTotal: 40,
      eligibleStats: ['STR', 'CON', 'DEX', 'APP'],
      eduPenalty: 0,
    });
  });

  it('handles age 80+ correctly', () => {
    const res = getAgeUpdates(85);
    expect(res).toEqual({
      eduRolls: 4,
      deductionTotal: 80,
      eligibleStats: ['STR', 'CON', 'DEX', 'APP'],
      eduPenalty: 0,
    });
  });
});
