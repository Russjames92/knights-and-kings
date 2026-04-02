import { describe, it, expect } from 'vitest';
import { getInstallCost, computeCardEffects, validateInstallation } from '../cards.js';
import type { RealmState, CardStats, PillarValues } from '@knights/shared';

describe('getInstallCost', () => {
  it('returns correct costs by rarity', () => {
    expect(getInstallCost('Common')).toBe(50);
    expect(getInstallCost('Uncommon')).toBe(100);
    expect(getInstallCost('Rare')).toBe(250);
    expect(getInstallCost('UltraRare')).toBe(500);
    expect(getInstallCost('Legendary')).toBe(2000);
  });
});

describe('computeCardEffects', () => {
  it('aggregates benefit and downside pillars', () => {
    const stats: CardStats = {
      benefitPillars: { Institutions: 10, Culture: 5 },
      downsidePillars: { Wealth: -3 },
      pressures: {},
      installCost: 50,
      termModifier: 0
    };
    const effects = computeCardEffects(stats);
    expect(effects.Institutions).toBe(10);
    expect(effects.Culture).toBe(5);
    expect(effects.Wealth).toBe(-3);
  });
});

describe('validateInstallation', () => {
  const basePillars: PillarValues = { Institutions: 50, Wealth: 50, Population: 50, Culture: 30, Faith: 30, Victory: 0, Time: 0 };

  it('validates a valid installation', () => {
    const state: RealmState = {
      realmId: 'r1',
      wealth: 500,
      population: 100,
      legitimacyScore: 50,
      pillars: basePillars,
      institutions: [{ type: 'Pawn', installedCardId: null, cardStats: null, installedAt: null, termEndsAt: null, consecutiveTerms: 0 }],
      isInterregnum: false,
      interregnumStartedAt: null,
      lastTickAt: new Date(),
      currentReignStartedAt: null,
      currentReignEndsAt: null
    };
    const cardStats: CardStats = { benefitPillars: {}, downsidePillars: {}, pressures: {}, installCost: 50, termModifier: 0 };
    expect(validateInstallation(state, cardStats, 'Pawn').valid).toBe(true);
  });

  it('rejects if slot not established', () => {
    const state: RealmState = {
      realmId: 'r1', wealth: 500, population: 100, legitimacyScore: 50, pillars: basePillars,
      institutions: [],
      isInterregnum: false, interregnumStartedAt: null, lastTickAt: new Date(),
      currentReignStartedAt: null, currentReignEndsAt: null
    };
    const cardStats: CardStats = { benefitPillars: {}, downsidePillars: {}, pressures: {}, installCost: 50, termModifier: 0 };
    const result = validateInstallation(state, cardStats, 'Pawn');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not established');
  });

  it('rejects if insufficient wealth', () => {
    const state: RealmState = {
      realmId: 'r1', wealth: 10, population: 100, legitimacyScore: 50, pillars: basePillars,
      institutions: [{ type: 'Pawn', installedCardId: null, cardStats: null, installedAt: null, termEndsAt: null, consecutiveTerms: 0 }],
      isInterregnum: false, interregnumStartedAt: null, lastTickAt: new Date(),
      currentReignStartedAt: null, currentReignEndsAt: null
    };
    const cardStats: CardStats = { benefitPillars: {}, downsidePillars: {}, pressures: {}, installCost: 50, termModifier: 0 };
    expect(validateInstallation(state, cardStats, 'Pawn').valid).toBe(false);
  });
});
