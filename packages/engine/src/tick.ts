import type { RealmState, TickResult, GameEvent, PillarValues } from '@knights/shared';
import { getPillarContributions, computeLegitimacyTarget, applyBalanceCap, driftLegitimacy } from './legitimacy.js';
import { checkTermExpiry } from './terms.js';
import { checkKingFall, applyGovernmentCollapse, computeInterregnumEffects, isPeacefulTransfer } from './collapse.js';

export function computeRealmTick(state: RealmState, now: Date): TickResult {
  const events: GameEvent[] = [];
  const expiredSlotTypes: string[] = [];
  let kingFell = false;

  let institutions = state.institutions.map(s => ({ ...s }));
  let wealth = state.wealth;
  let population = state.population;
  let legitimacyScore = state.legitimacyScore;
  let isInterregnum = state.isInterregnum;
  let interregnumStartedAt = state.interregnumStartedAt;

  // 1. Check term expiries
  const expired = checkTermExpiry(institutions, now);
  for (const slot of expired) {
    expiredSlotTypes.push(slot.type);
    events.push({
      type: 'TermExpired',
      realmId: state.realmId,
      data: { institutionType: slot.type, cardInstanceId: slot.installedCardId },
      occurredAt: now
    });

    // 2. If king's term expired naturally → peaceful transfer
    if (slot.type === 'King' && isPeacefulTransfer(
      { ...state, institutions },
      now
    )) {
      events.push({
        type: 'PeacefulTransfer',
        realmId: state.realmId,
        data: { previousKingCardId: slot.installedCardId },
        occurredAt: now
      });
    }

    // Clear the expired slot
    const idx = institutions.findIndex(s => s.type === slot.type);
    if (idx !== -1) {
      institutions[idx] = {
        ...institutions[idx],
        installedCardId: null,
        cardStats: null,
        installedAt: null,
        termEndsAt: null,
        consecutiveTerms: 0
      };
    }
  }

  // Check king-fall (legitimacy collapse)
  const currentState: RealmState = {
    ...state,
    institutions,
    wealth,
    population,
    legitimacyScore,
    isInterregnum,
    interregnumStartedAt
  };

  if (checkKingFall(currentState, now)) {
    const collapse = applyGovernmentCollapse(currentState, now);
    institutions = collapse.institutions;
    legitimacyScore = collapse.legitimacyScore;
    isInterregnum = collapse.isInterregnum;
    interregnumStartedAt = collapse.interregnumStartedAt;
    events.push(...collapse.events);
    kingFell = true;
  }

  // 3. Compute pillar values
  const pillarState: RealmState = {
    ...state,
    institutions,
    wealth,
    population,
    legitimacyScore,
    isInterregnum,
    interregnumStartedAt
  };
  const pillars: PillarValues = getPillarContributions(pillarState);

  // 4. Compute legitimacy target with balance cap, drift toward it
  const hoursElapsed = state.lastTickAt
    ? Math.max(0, (now.getTime() - state.lastTickAt.getTime()) / (1000 * 60 * 60))
    : 1;

  const rawTarget = computeLegitimacyTarget(pillars);
  const cappedTarget = applyBalanceCap(pillars, rawTarget);
  legitimacyScore = driftLegitimacy(legitimacyScore, cappedTarget, hoursElapsed);

  // 5. If interregnum: apply erosion
  if (isInterregnum && interregnumStartedAt) {
    const interregnumHours = (now.getTime() - interregnumStartedAt.getTime()) / (1000 * 60 * 60);
    const drain = computeInterregnumEffects(Math.min(hoursElapsed, interregnumHours));
    legitimacyScore = Math.max(0, legitimacyScore - drain);
  }

  // Legitimacy warning
  if (legitimacyScore < 20 && state.legitimacyScore >= 20) {
    events.push({
      type: 'LegitimacyWarning',
      realmId: state.realmId,
      data: { score: legitimacyScore },
      occurredAt: now
    });
  }

  // 6. Wealth income: 10 base + 5 per staffed institution
  const staffedCount = institutions.filter(s => s.installedCardId !== null).length;
  wealth += 10 + staffedCount * 5;

  // 7. Population
  const pawnSlot = institutions.find(s => s.type === 'Pawn' && s.installedCardId);
  if (pawnSlot) {
    population += 1;
  } else {
    population = Math.max(0, population - 1);
  }

  return {
    wealth,
    population,
    legitimacyScore: Math.round(legitimacyScore * 100) / 100,
    pillars,
    isInterregnum,
    interregnumStartedAt,
    events,
    expiredSlotTypes,
    kingFell
  };
}

export function getTickWindow(now: Date): Date {
  const tick = new Date(now);
  tick.setMinutes(0, 0, 0);
  return tick;
}
