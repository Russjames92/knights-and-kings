import type { InstitutionType, TermModifiers, InstitutionSlotState } from '@knights/shared';

export function getDefaultTermDays(type: InstitutionType): number {
  if (type === 'King' || type === 'Queen') return 60;
  return 30;
}

export function computeTermEnd(installedAt: Date, baseDays: number, modifiers: TermModifiers): Date {
  let adjustedDays = baseDays;

  if (modifiers.legitimacyScore < 30) {
    adjustedDays = Math.max(7, adjustedDays - 10);
  } else if (modifiers.legitimacyScore > 70) {
    adjustedDays += 5;
  }

  if (modifiers.vacancyCount > 3) {
    adjustedDays = Math.max(7, adjustedDays - 5);
  }

  if (modifiers.isInterregnum) {
    adjustedDays = Math.max(7, adjustedDays - 15);
  }

  const end = new Date(installedAt);
  end.setDate(end.getDate() + adjustedDays);
  return end;
}

export function checkTermExpiry(institutions: InstitutionSlotState[], now: Date): InstitutionSlotState[] {
  return institutions.filter(slot =>
    slot.installedCardId !== null &&
    slot.termEndsAt !== null &&
    slot.termEndsAt <= now
  );
}

export function canReappoint(slot: InstitutionSlotState): { allowed: boolean; extraCost: number } {
  if (slot.consecutiveTerms >= 2) {
    return { allowed: false, extraCost: 0 };
  }
  const baseCost = 100;
  const extraCost = Math.round(baseCost * Math.pow(1.5, slot.consecutiveTerms));
  return { allowed: true, extraCost };
}

export function checkObscurity(slot: InstitutionSlotState): boolean {
  return slot.consecutiveTerms >= 2;
}
