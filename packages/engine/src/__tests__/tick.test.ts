import { describe, it, expect } from 'vitest';
import { computeRealmTick, getTickWindow } from '../index.js';
import type { RealmState, PillarValues } from '@knights/shared';

const basePillars: PillarValues = {
  Institutions: 50,
  Wealth: 50,
  Population: 50,
  Culture: 30,
  Faith: 30,
  Victory: 0,
  Time: 0
};

function makeState(overrides?: Partial<RealmState>): RealmState {
  return {
    realmId: 'realm-1',
    wealth: 100,
    population: 100,
    legitimacyScore: 50,
    pillars: { ...basePillars },
    institutions: [],
    isInterregnum: false,
    interregnumStartedAt: null,
    lastTickAt: new Date('2025-01-01T10:00:00Z'),
    currentReignStartedAt: null,
    currentReignEndsAt: null,
    ...overrides
  };
}

describe('computeRealmTick', () => {
  it('adds base wealth income of 10', () => {
    const state = makeState();
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(state, now);

    expect(result.wealth).toBe(110);
  });

  it('adds extra wealth per staffed institution', () => {
    const state = makeState({
      institutions: [
        { type: 'Pawn', installedCardId: 'card-1', cardStats: null, installedAt: new Date(), termEndsAt: new Date('2025-02-01'), consecutiveTerms: 0 },
        { type: 'Knight', installedCardId: 'card-2', cardStats: null, installedAt: new Date(), termEndsAt: new Date('2025-02-01'), consecutiveTerms: 0 }
      ]
    });
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(state, now);

    // 10 base + 2 * 5 = 20
    expect(result.wealth).toBe(120);
  });

  it('handles initial tick when lastTickAt is null', () => {
    const state = makeState({ lastTickAt: null });
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(state, now);

    expect(result.wealth).toBe(110);
  });

  it('returns pillar values', () => {
    const state = makeState();
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(state, now);

    expect(result.pillars).toBeDefined();
    expect(typeof result.pillars.Institutions).toBe('number');
    expect(typeof result.pillars.Wealth).toBe('number');
  });

  it('generates term expired events', () => {
    const state = makeState({
      institutions: [{
        type: 'Pawn',
        installedCardId: 'card-1',
        cardStats: null,
        installedAt: new Date('2024-12-01'),
        termEndsAt: new Date('2025-01-01T09:00:00Z'),
        consecutiveTerms: 0
      }]
    });
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(state, now);

    expect(result.expiredSlotTypes).toContain('Pawn');
    expect(result.events.some(e => e.type === 'TermExpired')).toBe(true);
  });

  it('increases population with pawn installed', () => {
    const state = makeState({
      institutions: [{
        type: 'Pawn',
        installedCardId: 'card-1',
        cardStats: null,
        installedAt: new Date(),
        termEndsAt: new Date('2025-02-01'),
        consecutiveTerms: 0
      }]
    });
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(state, now);

    expect(result.population).toBe(101);
  });

  it('decreases population without pawn', () => {
    const state = makeState();
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(state, now);

    expect(result.population).toBe(99);
  });

  it('is pure — same input produces same output', () => {
    const state = makeState();
    const now = new Date('2025-01-01T11:00:00Z');
    const result1 = computeRealmTick(state, now);
    const result2 = computeRealmTick(state, now);

    expect(result1).toEqual(result2);
  });

  it('triggers king-fall when legitimacy is very low with king installed', () => {
    const state = makeState({
      legitimacyScore: 5,
      institutions: [{
        type: 'King',
        installedCardId: 'king-1',
        cardStats: null,
        installedAt: new Date('2024-12-01'),
        termEndsAt: new Date('2025-02-01'),
        consecutiveTerms: 0
      }]
    });
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(state, now);

    expect(result.kingFell).toBe(true);
    expect(result.isInterregnum).toBe(true);
    expect(result.events.some(e => e.type === 'KingFall')).toBe(true);
  });
});

describe('getTickWindow', () => {
  it('truncates to the start of the current hour', () => {
    const now = new Date('2025-01-01T14:37:22.500Z');
    const tick = getTickWindow(now);

    expect(tick.getUTCHours()).toBe(14);
    expect(tick.getMinutes()).toBe(0);
    expect(tick.getSeconds()).toBe(0);
    expect(tick.getMilliseconds()).toBe(0);
  });

  it('does not mutate the input date', () => {
    const now = new Date('2025-01-01T14:37:22.500Z');
    const original = now.getTime();
    getTickWindow(now);

    expect(now.getTime()).toBe(original);
  });

  it('returns exact hour for on-the-hour times', () => {
    const now = new Date('2025-01-01T10:00:00.000Z');
    const tick = getTickWindow(now);

    expect(tick.getTime()).toBe(now.getTime());
  });

  it('handles midnight correctly', () => {
    const now = new Date('2025-01-01T00:45:30.000Z');
    const tick = getTickWindow(now);

    expect(tick.getUTCHours()).toBe(0);
    expect(tick.getMinutes()).toBe(0);
    expect(tick.getSeconds()).toBe(0);
  });
});
