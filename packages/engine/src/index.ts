// Re-export all engine modules
export { computeRealmTick, getTickWindow } from './tick.js';
export {
  computeLegitimacyTarget,
  applyBalanceCap,
  driftLegitimacy,
  getPillarContributions,
  getLegitimacyTier
} from './legitimacy.js';
export {
  getDefaultTermDays,
  computeTermEnd,
  checkTermExpiry,
  canReappoint,
  checkObscurity
} from './terms.js';
export {
  checkKingFall,
  applyGovernmentCollapse,
  computeInterregnumEffects,
  isPeacefulTransfer
} from './collapse.js';
export {
  getInstallCost,
  computeCardEffects,
  validateInstallation
} from './cards.js';
export {
  computeRaidOutcome
} from './raids.js';

// Keep legacy types for backwards compat with existing imports
export type { RealmState as RealmTickInput } from '@knights/shared';
export type { TickResult as RealmTickResult } from '@knights/shared';
