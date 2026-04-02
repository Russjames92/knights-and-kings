import type { CardStats, PillarValues, HeirResult, HeirQuality, LegacyEcho } from '@knights/shared';

const MEDIEVAL_NAMES = [
  'Aldric', 'Baldwin', 'Cedric', 'Darius', 'Edmund',
  'Frederick', 'Geoffrey', 'Harold', 'Ivar', 'Julian',
  'Kenneth', 'Leopold', 'Magnus', 'Norbert', 'Oswald',
  'Percival', 'Quentin', 'Reginald', 'Sigmund', 'Theodoric',
  'Ulric', 'Valerian', 'Wolfgang', 'Yvain', 'Alaric',
  'Beatrice', 'Constance', 'Eleanor', 'Genevieve', 'Helena',
  'Isabella', 'Juliana', 'Katherine', 'Lisette', 'Matilda',
  'Rosalind', 'Seraphina', 'Theodora', 'Vivienne', 'Winifred'
];

const EPITHETS = [
  'the Bold', 'the Wise', 'the Fair', 'the Brave', 'the Just',
  'the Pious', 'the Stern', 'the Gentle', 'the Fierce', 'the Cunning',
  'the Young', 'the Elder', 'the Red', 'the Black', 'the Golden'
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMedievalName(): string {
  return `${pickRandom(MEDIEVAL_NAMES)} ${pickRandom(EPITHETS)}`;
}

function getQualityWeights(stability: number): Record<HeirQuality, number> {
  if (stability >= 70) {
    return { promising: 0.6, average: 0.3, stinker: 0.1 };
  }
  if (stability >= 40) {
    return { promising: 0.3, average: 0.4, stinker: 0.3 };
  }
  return { promising: 0.1, average: 0.3, stinker: 0.6 };
}

function pickQuality(stability: number): HeirQuality {
  const weights = getQualityWeights(stability);
  const roll = Math.random();
  if (roll < weights.promising) return 'promising';
  if (roll < weights.promising + weights.average) return 'average';
  return 'stinker';
}

function generateHiddenStats(quality: HeirQuality): CardStats {
  switch (quality) {
    case 'promising':
      return {
        benefitPillars: { Institutions: 20, Culture: 10, Faith: 5 },
        downsidePillars: { Wealth: -3 },
        pressures: {},
        installCost: 0,
        termModifier: 15
      };
    case 'average':
      return {
        benefitPillars: { Institutions: 10, Culture: 5 },
        downsidePillars: { Wealth: -5, Victory: -3 },
        pressures: {},
        installCost: 0,
        termModifier: 5
      };
    case 'stinker':
      return {
        benefitPillars: { Institutions: 3 },
        downsidePillars: { Wealth: -10, Culture: -5, Faith: -5 },
        pressures: {},
        installCost: 0,
        termModifier: -10
      };
  }
}

/**
 * Generate an heir based on the stability of the ending reign.
 * Legendary kings never produce heirs.
 */
export function generateHeir(reignStability: number, isLegendary: boolean): HeirResult | null {
  if (isLegendary) return null;

  const quality = pickQuality(reignStability);
  return {
    quality,
    hiddenStats: generateHiddenStats(quality),
    revealedName: generateMedievalName()
  };
}

/**
 * Generate a legacy echo from a legendary king's stats.
 * These are persistent probabilistic influences on future kings.
 */
export function generateLegacyEcho(legendaryCardStats: CardStats): LegacyEcho {
  const pillarBiases: Partial<PillarValues> = {};
  const strength = 0.1 + Math.random() * 0.2; // 0.1 - 0.3

  // Derive biases from the legendary card's benefit pillars
  for (const [pillar, value] of Object.entries(legendaryCardStats.benefitPillars)) {
    if (value && value > 0) {
      // Scale the bias: stronger card effects produce stronger echoes
      pillarBiases[pillar as keyof PillarValues] = Math.min(10, value * 0.3);
    }
  }

  return { pillarBiases, strength };
}

const ECHO_CAP_PER_PILLAR = 15;

/**
 * Modify card stats based on accumulated legacy echoes.
 * Echoes add (bias * strength) to benefit pillars, capped so they never dominate.
 */
export function applyLegacyEchoToCard(cardStats: CardStats, echoes: LegacyEcho[]): CardStats {
  if (echoes.length === 0) return cardStats;

  const modifiedBenefits = { ...cardStats.benefitPillars };

  for (const echo of echoes) {
    for (const [pillar, bias] of Object.entries(echo.pillarBiases)) {
      if (bias === undefined) continue;
      const key = pillar as keyof PillarValues;
      const current = modifiedBenefits[key] ?? 0;
      const addition = bias * echo.strength;
      // Cap per-pillar echo contribution
      modifiedBenefits[key] = Math.min(current + addition, (cardStats.benefitPillars[key] ?? 0) + ECHO_CAP_PER_PILLAR);
    }
  }

  return {
    ...cardStats,
    benefitPillars: modifiedBenefits
  };
}
