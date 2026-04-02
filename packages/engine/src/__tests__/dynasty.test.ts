import { describe, it, expect, vi } from 'vitest';
import { generateHeir, generateLegacyEcho, applyLegacyEchoToCard } from '../dynasty.js';
import type { CardStats, LegacyEcho } from '@knights/shared';

describe('generateHeir', () => {
  it('returns null for legendary kings', () => {
    const result = generateHeir(80, true);
    expect(result).toBeNull();
  });

  it('returns an heir for non-legendary kings', () => {
    const result = generateHeir(50, false);
    expect(result).not.toBeNull();
    expect(result!.revealedName).toBeTruthy();
    expect(['promising', 'average', 'stinker']).toContain(result!.quality);
    expect(result!.hiddenStats).toBeDefined();
    expect(result!.hiddenStats.benefitPillars).toBeDefined();
  });

  it('generates a name with a name and epithet', () => {
    const result = generateHeir(50, false);
    expect(result).not.toBeNull();
    // Name should contain "the " from epithet
    expect(result!.revealedName).toMatch(/\w+ the \w+/);
  });

  it('high stability biases toward promising heirs', () => {
    // Run many trials to verify statistical tendency
    let promisingCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const result = generateHeir(90, false);
      if (result?.quality === 'promising') promisingCount++;
    }
    // With 60% chance, expect at least 40% over 500 trials
    expect(promisingCount / trials).toBeGreaterThan(0.4);
  });

  it('low stability biases toward stinker heirs', () => {
    let stinkerCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const result = generateHeir(10, false);
      if (result?.quality === 'stinker') stinkerCount++;
    }
    // With 60% chance, expect at least 40% over 500 trials
    expect(stinkerCount / trials).toBeGreaterThan(0.4);
  });

  it('promising heirs have strong benefits', () => {
    // Force a promising result by mocking
    vi.spyOn(Math, 'random').mockReturnValue(0.01); // Will hit promising
    const result = generateHeir(90, false);
    expect(result).not.toBeNull();
    expect(result!.quality).toBe('promising');
    expect(result!.hiddenStats.benefitPillars.Institutions).toBe(20);
    expect(result!.hiddenStats.termModifier).toBe(15);
    vi.restoreAllMocks();
  });

  it('stinker heirs have weak benefits and harsh downsides', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // Will hit stinker
    const result = generateHeir(90, false);
    expect(result).not.toBeNull();
    expect(result!.quality).toBe('stinker');
    expect(result!.hiddenStats.benefitPillars.Institutions).toBe(3);
    expect(result!.hiddenStats.downsidePillars.Wealth).toBe(-10);
    expect(result!.hiddenStats.termModifier).toBe(-10);
    vi.restoreAllMocks();
  });
});

describe('generateLegacyEcho', () => {
  it('creates an echo from legendary card stats', () => {
    const stats: CardStats = {
      benefitPillars: { Victory: 35, Institutions: 20, Culture: 15 },
      downsidePillars: { Wealth: -15 },
      pressures: {},
      installCost: 2000,
      termModifier: 30
    };

    const echo = generateLegacyEcho(stats);
    expect(echo.strength).toBeGreaterThanOrEqual(0.1);
    expect(echo.strength).toBeLessThanOrEqual(0.3);
    expect(echo.pillarBiases).toBeDefined();
    // Should have biases for benefit pillars only
    expect(echo.pillarBiases.Victory).toBeGreaterThan(0);
    expect(echo.pillarBiases.Institutions).toBeGreaterThan(0);
    expect(echo.pillarBiases.Culture).toBeGreaterThan(0);
    // Should not have biases for non-benefit pillars
    expect(echo.pillarBiases.Wealth).toBeUndefined();
  });

  it('caps pillar biases at 10', () => {
    const stats: CardStats = {
      benefitPillars: { Victory: 50 },
      downsidePillars: {},
      pressures: {},
      installCost: 2000,
      termModifier: 30
    };

    const echo = generateLegacyEcho(stats);
    expect(echo.pillarBiases.Victory).toBeLessThanOrEqual(10);
  });

  it('strength is between 0.1 and 0.3', () => {
    const stats: CardStats = {
      benefitPillars: { Institutions: 10 },
      downsidePillars: {},
      pressures: {},
      installCost: 100,
      termModifier: 0
    };

    for (let i = 0; i < 50; i++) {
      const echo = generateLegacyEcho(stats);
      expect(echo.strength).toBeGreaterThanOrEqual(0.1);
      expect(echo.strength).toBeLessThanOrEqual(0.3);
    }
  });
});

describe('applyLegacyEchoToCard', () => {
  const baseStats: CardStats = {
    benefitPillars: { Institutions: 10, Culture: 5 },
    downsidePillars: { Wealth: -3 },
    pressures: {},
    installCost: 50,
    termModifier: 0
  };

  it('returns original stats when no echoes', () => {
    const result = applyLegacyEchoToCard(baseStats, []);
    expect(result).toEqual(baseStats);
  });

  it('applies echo biases to benefit pillars', () => {
    const echoes: LegacyEcho[] = [{
      pillarBiases: { Institutions: 5 },
      strength: 0.2
    }];

    const result = applyLegacyEchoToCard(baseStats, echoes);
    // 10 + (5 * 0.2) = 11
    expect(result.benefitPillars.Institutions).toBe(11);
  });

  it('adds new pillar biases not in original', () => {
    const echoes: LegacyEcho[] = [{
      pillarBiases: { Victory: 8 },
      strength: 0.2
    }];

    const result = applyLegacyEchoToCard(baseStats, echoes);
    // 0 + (8 * 0.2) = 1.6
    expect(result.benefitPillars.Victory).toBeCloseTo(1.6);
  });

  it('caps echo contribution per pillar', () => {
    const echoes: LegacyEcho[] = [
      { pillarBiases: { Institutions: 10 }, strength: 0.3 },
      { pillarBiases: { Institutions: 10 }, strength: 0.3 },
      { pillarBiases: { Institutions: 10 }, strength: 0.3 },
      { pillarBiases: { Institutions: 10 }, strength: 0.3 },
      { pillarBiases: { Institutions: 10 }, strength: 0.3 },
      { pillarBiases: { Institutions: 10 }, strength: 0.3 }
    ];

    const result = applyLegacyEchoToCard(baseStats, echoes);
    // Cap is original (10) + 15 = 25
    expect(result.benefitPillars.Institutions).toBeLessThanOrEqual(25);
  });

  it('does not modify downsides or pressures', () => {
    const echoes: LegacyEcho[] = [{
      pillarBiases: { Wealth: 10 },
      strength: 0.3
    }];

    const result = applyLegacyEchoToCard(baseStats, echoes);
    expect(result.downsidePillars).toEqual(baseStats.downsidePillars);
    expect(result.pressures).toEqual(baseStats.pressures);
  });

  it('accumulates multiple echoes', () => {
    const echoes: LegacyEcho[] = [
      { pillarBiases: { Culture: 4 }, strength: 0.2 },
      { pillarBiases: { Culture: 3 }, strength: 0.1 }
    ];

    const result = applyLegacyEchoToCard(baseStats, echoes);
    // 5 + (4 * 0.2) + (3 * 0.1) = 5 + 0.8 + 0.3 = 6.1
    expect(result.benefitPillars.Culture).toBeCloseTo(6.1);
  });
});
