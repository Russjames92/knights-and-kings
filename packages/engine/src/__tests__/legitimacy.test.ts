import { describe, it, expect } from 'vitest';
import { computeLegitimacyTarget, applyBalanceCap, driftLegitimacy, getLegitimacyTier, getPillarContributions } from '../legitimacy.js';
import type { PillarValues, RealmState } from '@knights/shared';

const evenPillars: PillarValues = {
  Institutions: 50,
  Wealth: 50,
  Population: 50,
  Culture: 50,
  Faith: 50,
  Victory: 50,
  Time: 50
};

describe('computeLegitimacyTarget', () => {
  it('returns weighted average of pillar values', () => {
    const target = computeLegitimacyTarget(evenPillars);
    expect(target).toBeCloseTo(50, 0);
  });

  it('clamps to 0-100', () => {
    const zeroPillars: PillarValues = { Institutions: 0, Wealth: 0, Population: 0, Culture: 0, Faith: 0, Victory: 0, Time: 0 };
    expect(computeLegitimacyTarget(zeroPillars)).toBe(0);
  });
});

describe('applyBalanceCap', () => {
  it('caps score at weakest pillar + 20', () => {
    const pillars: PillarValues = { ...evenPillars, Victory: 10 };
    const capped = applyBalanceCap(pillars, 60);
    expect(capped).toBe(30); // weakest (10) + 20
  });

  it('does not cap if score is below cap', () => {
    const capped = applyBalanceCap(evenPillars, 40);
    expect(capped).toBe(40);
  });
});

describe('driftLegitimacy', () => {
  it('drifts toward target', () => {
    const result = driftLegitimacy(40, 60, 1);
    expect(result).toBe(42);
  });

  it('does not overshoot target', () => {
    const result = driftLegitimacy(59, 60, 5);
    expect(result).toBe(60);
  });

  it('returns current if no time elapsed', () => {
    expect(driftLegitimacy(50, 100, 0)).toBe(50);
  });
});

describe('getLegitimacyTier', () => {
  it('returns correct tiers', () => {
    expect(getLegitimacyTier(5)).toBe('Illegitimate');
    expect(getLegitimacyTier(20)).toBe('Illegitimate');
    expect(getLegitimacyTier(21)).toBe('Fragile');
    expect(getLegitimacyTier(40)).toBe('Fragile');
    expect(getLegitimacyTier(41)).toBe('Contested');
    expect(getLegitimacyTier(60)).toBe('Contested');
    expect(getLegitimacyTier(61)).toBe('Established');
    expect(getLegitimacyTier(80)).toBe('Established');
    expect(getLegitimacyTier(81)).toBe('Sovereign');
    expect(getLegitimacyTier(100)).toBe('Sovereign');
  });
});

describe('getPillarContributions', () => {
  it('computes institution pillar from staffed slots', () => {
    const state: RealmState = {
      realmId: 'r1',
      wealth: 100,
      population: 100,
      legitimacyScore: 50,
      pillars: evenPillars,
      institutions: [
        { type: 'Pawn', installedCardId: 'c1', cardStats: null, installedAt: new Date(), termEndsAt: new Date('2025-02-01'), consecutiveTerms: 0 },
        { type: 'Knight', installedCardId: 'c2', cardStats: null, installedAt: new Date(), termEndsAt: new Date('2025-02-01'), consecutiveTerms: 0 },
        { type: 'Rook', installedCardId: null, cardStats: null, installedAt: null, termEndsAt: null, consecutiveTerms: 0 }
      ],
      isInterregnum: false,
      interregnumStartedAt: null,
      lastTickAt: new Date(),
      currentReignStartedAt: null,
      currentReignEndsAt: null
    };
    const pillars = getPillarContributions(state);
    // 2/6 * 100 = 33.33
    expect(pillars.Institutions).toBeCloseTo(33.33, 0);
  });
});
