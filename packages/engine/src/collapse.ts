import type { RealmState, GameEvent } from '@knights/shared';

export function checkKingFall(state: RealmState, now: Date): boolean {
  const kingSlot = state.institutions.find(s => s.type === 'King');
  if (!kingSlot || !kingSlot.installedCardId) return false;
  if (!kingSlot.termEndsAt) return false;

  // King fall = king term ended early (before termEndsAt) while king IS installed
  // This checks if the king is installed but legitimacy crashed or other trigger
  // For the tick system, king fall is triggered by legitimacy dropping below 10
  if (state.legitimacyScore < 10 && kingSlot.installedCardId) {
    return true;
  }
  return false;
}

export function applyGovernmentCollapse(state: RealmState, now: Date): {
  institutions: typeof state.institutions;
  legitimacyScore: number;
  isInterregnum: boolean;
  interregnumStartedAt: Date;
  events: GameEvent[];
} {
  const vacatedInstitutions = state.institutions.map(slot => ({
    ...slot,
    installedCardId: null,
    cardStats: null,
    installedAt: null,
    termEndsAt: null,
    consecutiveTerms: 0
  }));

  const events: GameEvent[] = [{
    type: 'KingFall',
    realmId: state.realmId,
    data: { previousLegitimacy: state.legitimacyScore },
    occurredAt: now
  }, {
    type: 'InterregnumStarted',
    realmId: state.realmId,
    data: {},
    occurredAt: now
  }];

  return {
    institutions: vacatedInstitutions,
    legitimacyScore: Math.max(0, state.legitimacyScore - 30),
    isInterregnum: true,
    interregnumStartedAt: now,
    events
  };
}

export function computeInterregnumEffects(hoursElapsed: number): number {
  return 2 * hoursElapsed;
}

export function isPeacefulTransfer(state: RealmState, now: Date): boolean {
  const kingSlot = state.institutions.find(s => s.type === 'King');
  if (!kingSlot || !kingSlot.installedCardId) return false;
  if (!kingSlot.termEndsAt) return false;
  return kingSlot.termEndsAt <= now;
}
