import { describe, it, expect } from 'vitest';
import { getDefaultTermDays, computeTermEnd, checkTermExpiry, canReappoint, checkObscurity } from '../terms.js';
import type { InstitutionSlotState } from '@knights/shared';

describe('getDefaultTermDays', () => {
  it('returns 60 for King', () => {
    expect(getDefaultTermDays('King')).toBe(60);
  });

  it('returns 60 for Queen', () => {
    expect(getDefaultTermDays('Queen')).toBe(60);
  });

  it('returns 30 for other types', () => {
    expect(getDefaultTermDays('Pawn')).toBe(30);
    expect(getDefaultTermDays('Knight')).toBe(30);
    expect(getDefaultTermDays('Rook')).toBe(30);
    expect(getDefaultTermDays('Bishop')).toBe(30);
  });
});

describe('computeTermEnd', () => {
  it('computes end date from installed date plus base days', () => {
    const installed = new Date('2025-01-01T00:00:00Z');
    const end = computeTermEnd(installed, 30, { legitimacyScore: 50, vacancyCount: 0, isInterregnum: false });
    expect(end.getTime()).toBeGreaterThan(installed.getTime());
  });

  it('shortens term with low legitimacy', () => {
    const installed = new Date('2025-01-01T00:00:00Z');
    const normal = computeTermEnd(installed, 30, { legitimacyScore: 50, vacancyCount: 0, isInterregnum: false });
    const shortened = computeTermEnd(installed, 30, { legitimacyScore: 20, vacancyCount: 0, isInterregnum: false });
    expect(shortened.getTime()).toBeLessThan(normal.getTime());
  });
});

describe('checkTermExpiry', () => {
  it('returns slots with expired terms', () => {
    const slots: InstitutionSlotState[] = [
      { type: 'Pawn', installedCardId: 'c1', cardStats: null, installedAt: new Date('2024-12-01'), termEndsAt: new Date('2025-01-01'), consecutiveTerms: 0 },
      { type: 'Knight', installedCardId: 'c2', cardStats: null, installedAt: new Date('2024-12-01'), termEndsAt: new Date('2025-02-01'), consecutiveTerms: 0 }
    ];
    const now = new Date('2025-01-15');
    const expired = checkTermExpiry(slots, now);
    expect(expired).toHaveLength(1);
    expect(expired[0].type).toBe('Pawn');
  });

  it('ignores empty slots', () => {
    const slots: InstitutionSlotState[] = [
      { type: 'Pawn', installedCardId: null, cardStats: null, installedAt: null, termEndsAt: null, consecutiveTerms: 0 }
    ];
    expect(checkTermExpiry(slots, new Date())).toHaveLength(0);
  });
});

describe('canReappoint', () => {
  it('allows reappointment with 0 consecutive terms', () => {
    const slot: InstitutionSlotState = { type: 'Pawn', installedCardId: 'c1', cardStats: null, installedAt: new Date(), termEndsAt: new Date(), consecutiveTerms: 0 };
    const result = canReappoint(slot);
    expect(result.allowed).toBe(true);
    expect(result.extraCost).toBe(100);
  });

  it('disallows reappointment at 2 consecutive terms', () => {
    const slot: InstitutionSlotState = { type: 'Pawn', installedCardId: 'c1', cardStats: null, installedAt: new Date(), termEndsAt: new Date(), consecutiveTerms: 2 };
    expect(canReappoint(slot).allowed).toBe(false);
  });

  it('increases cost with consecutive terms', () => {
    const slot1: InstitutionSlotState = { type: 'Pawn', installedCardId: 'c1', cardStats: null, installedAt: new Date(), termEndsAt: new Date(), consecutiveTerms: 1 };
    const result = canReappoint(slot1);
    expect(result.extraCost).toBe(150); // 100 * 1.5^1
  });
});

describe('checkObscurity', () => {
  it('returns true at 2+ consecutive terms', () => {
    const slot: InstitutionSlotState = { type: 'Pawn', installedCardId: 'c1', cardStats: null, installedAt: new Date(), termEndsAt: new Date(), consecutiveTerms: 2 };
    expect(checkObscurity(slot)).toBe(true);
  });

  it('returns false below 2 consecutive terms', () => {
    const slot: InstitutionSlotState = { type: 'Pawn', installedCardId: 'c1', cardStats: null, installedAt: new Date(), termEndsAt: new Date(), consecutiveTerms: 1 };
    expect(checkObscurity(slot)).toBe(false);
  });
});
