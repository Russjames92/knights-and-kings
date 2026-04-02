import type { CardRarity, CardStats, RealmState, InstitutionType, PillarValues } from '@knights/shared';

export function getInstallCost(rarity: CardRarity): number {
  switch (rarity) {
    case 'Common': return 50;
    case 'Uncommon': return 100;
    case 'Rare': return 250;
    case 'UltraRare': return 500;
    case 'Legendary': return 2000;
  }
}

export function computeCardEffects(cardStats: CardStats): Partial<PillarValues> {
  const effects: Partial<PillarValues> = {};
  for (const [pillar, value] of Object.entries(cardStats.benefitPillars)) {
    effects[pillar as keyof PillarValues] = (effects[pillar as keyof PillarValues] ?? 0) + value;
  }
  for (const [pillar, value] of Object.entries(cardStats.downsidePillars)) {
    effects[pillar as keyof PillarValues] = (effects[pillar as keyof PillarValues] ?? 0) + value;
  }
  return effects;
}

export function validateInstallation(
  state: RealmState,
  cardStats: CardStats,
  slotType: InstitutionType
): { valid: boolean; reason?: string } {
  const slot = state.institutions.find(s => s.type === slotType);
  if (!slot) {
    return { valid: false, reason: 'Institution slot not established' };
  }
  if (slot.installedCardId) {
    return { valid: false, reason: 'Slot already occupied' };
  }
  if (state.wealth < cardStats.installCost) {
    return { valid: false, reason: 'Insufficient wealth' };
  }
  return { valid: true };
}
