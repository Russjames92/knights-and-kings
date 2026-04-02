import type { PillarValues, RealmState, LegitimacyTier } from '@knights/shared';

const PILLAR_WEIGHTS: Record<keyof PillarValues, number> = {
  Institutions: 1.5,
  Wealth: 1.2,
  Population: 1.0,
  Culture: 0.8,
  Faith: 0.8,
  Victory: 0.7,
  Time: 1.0
};

export function computeLegitimacyTarget(pillars: PillarValues): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [pillar, value] of Object.entries(pillars) as [keyof PillarValues, number][]) {
    const weight = PILLAR_WEIGHTS[pillar];
    weightedSum += value * weight;
    totalWeight += weight;
  }

  return Math.min(100, Math.max(0, weightedSum / totalWeight));
}

export function applyBalanceCap(pillars: PillarValues, rawScore: number): number {
  const weakest = Math.min(...Object.values(pillars));
  const cap = weakest + 20;
  return Math.min(rawScore, cap);
}

export function driftLegitimacy(current: number, target: number, hoursElapsed: number): number {
  if (hoursElapsed <= 0) return current;
  const maxDriftPerHour = 2;
  const diff = target - current;
  const maxDrift = maxDriftPerHour * hoursElapsed;
  const drift = Math.sign(diff) * Math.min(Math.abs(diff), maxDrift);
  return Math.min(100, Math.max(0, current + drift));
}

export function getPillarContributions(state: RealmState): PillarValues {
  const totalSlots = 6;
  const staffedSlots = state.institutions.filter(s => s.installedCardId !== null).length;

  const institutionsPillar = (staffedSlots / totalSlots) * 100;
  const wealthPillar = Math.min(100, Math.log2(state.wealth + 1) * 10);
  const populationPillar = Math.min(100, state.population / 10);

  let culturePillar = 30;
  let faithPillar = 30;
  const bishopSlot = state.institutions.find(s => s.type === 'Bishop' && s.cardStats);
  if (bishopSlot?.cardStats) {
    culturePillar = 30 + (bishopSlot.cardStats.benefitPillars.Culture ?? 0);
    faithPillar = 30 + (bishopSlot.cardStats.benefitPillars.Faith ?? 0);
  }

  const victoryPillar = state.pillars.Victory;

  let timePillar = state.pillars.Time;
  if (!state.isInterregnum && state.institutions.some(s => s.type === 'King' && s.installedCardId)) {
    timePillar = Math.min(100, timePillar + 0.5);
  }

  return {
    Institutions: Math.min(100, Math.max(0, institutionsPillar)),
    Wealth: Math.min(100, Math.max(0, wealthPillar)),
    Population: Math.min(100, Math.max(0, populationPillar)),
    Culture: Math.min(100, Math.max(0, culturePillar)),
    Faith: Math.min(100, Math.max(0, faithPillar)),
    Victory: Math.min(100, Math.max(0, victoryPillar)),
    Time: Math.min(100, Math.max(0, timePillar))
  };
}

export function getLegitimacyTier(score: number): LegitimacyTier {
  if (score <= 20) return 'Illegitimate';
  if (score <= 40) return 'Fragile';
  if (score <= 60) return 'Contested';
  if (score <= 80) return 'Established';
  return 'Sovereign';
}
