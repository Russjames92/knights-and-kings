import type { RealmState, RaidResult } from '@knights/shared';

export function computeRaidOutcome(attackerState: RealmState, defenderState: RealmState): RaidResult {
  let attackPower = 10;
  const knightSlot = attackerState.institutions.find(s => s.type === 'Knight' && s.cardStats);
  if (knightSlot?.cardStats) {
    attackPower += knightSlot.cardStats.benefitPillars.Victory ?? 0;
  }

  let defensePower = 10;
  const rookSlot = defenderState.institutions.find(s => s.type === 'Rook' && s.cardStats);
  if (rookSlot?.cardStats) {
    defensePower += rookSlot.cardStats.benefitPillars.Institutions ?? 0;
  }

  // Deterministic comparison with threshold
  const success = attackPower > defensePower * 0.7;
  const lootGained = success ? Math.min(Math.round(defenderState.wealth * 0.3), 200) : 0;

  return {
    lootGained,
    attackerStabilityHit: success ? 5 : 10,
    defenderStabilityHit: success ? 15 : 5,
    success
  };
}
