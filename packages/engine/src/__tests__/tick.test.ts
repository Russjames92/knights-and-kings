import { describe, it, expect } from 'vitest';
import { computeRealmTick, getTickWindow } from '../index.js';
import type { RealmTickInput } from '../index.js';

describe('computeRealmTick', () => {
  const baseInput: RealmTickInput = {
    realmId: 'realm-1',
    lastTickAt: new Date('2025-01-01T10:00:00Z'),
    wealth: 100,
  };

  it('adds hourly income of 10 wealth', () => {
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(baseInput, now);

    expect(result.nextWealth).toBe(110);
    expect(result.notes).toContain('wealth +10');
  });

  it('handles initial tick when lastTickAt is null', () => {
    const input: RealmTickInput = {
      ...baseInput,
      lastTickAt: null,
    };
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(input, now);

    expect(result.nextWealth).toBe(110);
    expect(result.notes).toContain('initial tick');
    expect(result.notes).toContain('wealth +10');
  });

  it('returns notes as an array', () => {
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(baseInput, now);

    expect(Array.isArray(result.notes)).toBe(true);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it('preserves existing wealth and adds income', () => {
    const input: RealmTickInput = {
      ...baseInput,
      wealth: 500,
    };
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(input, now);

    expect(result.nextWealth).toBe(510);
  });

  it('works with zero wealth', () => {
    const input: RealmTickInput = {
      ...baseInput,
      wealth: 0,
    };
    const now = new Date('2025-01-01T11:00:00Z');
    const result = computeRealmTick(input, now);

    expect(result.nextWealth).toBe(10);
  });

  it('is pure — same input produces same output', () => {
    const now = new Date('2025-01-01T11:00:00Z');
    const result1 = computeRealmTick(baseInput, now);
    const result2 = computeRealmTick(baseInput, now);

    expect(result1).toEqual(result2);
  });
});

describe('getTickWindow', () => {
  it('truncates to the start of the current hour', () => {
    const now = new Date('2025-01-01T14:37:22.500Z');
    const tick = getTickWindow(now);

    expect(tick.getHours()).toBe(14);
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

    expect(tick.getHours()).toBe(0);
    expect(tick.getMinutes()).toBe(0);
    expect(tick.getSeconds()).toBe(0);
  });

  it('handles end of day correctly', () => {
    const now = new Date('2025-01-01T23:59:59.999Z');
    const tick = getTickWindow(now);

    expect(tick.getHours()).toBe(23);
    expect(tick.getMinutes()).toBe(0);
  });
});
