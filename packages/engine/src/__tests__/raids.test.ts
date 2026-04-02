import { describe, it, expect } from 'vitest';
import { computeRaidOutcome } from '../raids.js';
import type { RealmState, PillarValues } from '@knights/shared';

const basePillars: PillarValues = { Institutions: 50, Wealth: 50, Population: 50, Culture: 30, Faith: 30, Victory: 0, Time: 0 };

function makeState(overrides?: Partial<RealmState>): RealmState {
  return {
    realmId: 'r1', wealth: 500, population: 100, legitimacyScore: 50,
    pillars: basePillars, institutions: [],
    isInterregnum: false, interregnumStartedAt: null, lastTickAt: new Date(),
    currentReignStartedAt: null, currentReignEndsAt: null,
    ...overrides
  };
}

describe('computeRaidOutcome', () => {
  it('succeeds when attacker has knight bonus', () => {
    const attacker = makeState({
      institutions: [{
        type: 'Knight',
        installedCardId: 'k1',
        cardStats: { benefitPillars: { Victory: 20 }, downsidePillars: {}, pressures: {}, installCost: 100, termModifier: 0 },
        installedAt: new Date(),
        termEndsAt: new Date('2025-02-01'),
        consecutiveTerms: 0
      }]
    });
    const defender = makeState();
    const result = computeRaidOutcome(attacker, defender);
    expect(result.success).toBe(true);
    expect(result.lootGained).toBeGreaterThan(0);
  });

  it('loot is capped at 200', () => {
    const attacker = makeState({
      institutions: [{
        type: 'Knight',
        installedCardId: 'k1',
        cardStats: { benefitPillars: { Victory: 50 }, downsidePillars: {}, pressures: {}, installCost: 100, termModifier: 0 },
        installedAt: new Date(),
        termEndsAt: new Date('2025-02-01'),
        consecutiveTerms: 0
      }]
    });
    const defender = makeState({ wealth: 10000 });
    const result = computeRaidOutcome(attacker, defender);
    expect(result.lootGained).toBeLessThanOrEqual(200);
  });

  it('base attack beats base defense (10 > 10 * 0.7)', () => {
    const attacker = makeState();
    const defender = makeState();
    const result = computeRaidOutcome(attacker, defender);
    expect(result.success).toBe(true);
  });
});
