export type RealmTickInput = {
  realmId: string;
  lastTickAt: Date | null;
  wealth: number;
};

export type RealmTickResult = {
  nextWealth: number;
  notes: string[];
};

export function computeRealmTick(input: RealmTickInput, now: Date): RealmTickResult {
  const notes: string[] = [];
  let nextWealth = input.wealth;

  if (!input.lastTickAt) {
    notes.push('initial tick');
  }

  const hourlyIncome = 10;
  nextWealth += hourlyIncome;
  notes.push(`wealth +${hourlyIncome}`);

  return { nextWealth, notes };
}

export function getTickWindow(now: Date): Date {
  const tick = new Date(now);
  tick.setMinutes(0, 0, 0);
  return tick;
}
