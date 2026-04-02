const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userId');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const userId = getUserId();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
      ...options.headers
    }
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `API error ${res.status}`);
  }

  return res.json();
}

export async function devLogin(externalId: string, displayName?: string) {
  return apiFetch<{ userId: string }>('/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify({ externalId, displayName })
  });
}

export async function getMyRealms() {
  return apiFetch<{ realms: Realm[] }>('/realms/me');
}

export async function createRealm(data: { name: string; originLat: number; originLng: number; regionId: string }) {
  return apiFetch<{ realm: Realm }>('/realms', { method: 'POST', body: JSON.stringify(data) });
}

export async function getRealm(id: string) {
  return apiFetch<{ realm: Realm; legitimacy: LegitimacyInfo }>(`/realms/${id}`);
}

export async function getRealmLegitimacy(id: string) {
  return apiFetch<LegitimacyInfo>(`/realms/${id}/legitimacy`);
}

export async function getRealmEvents(id: string) {
  return apiFetch<{ events: GameEvent[] }>(`/realms/${id}/events`);
}

export async function establishInstitution(type: string, realmId: string) {
  return apiFetch<{ slot: InstitutionSlot }>(`/institutions/${type}/establish`, {
    method: 'POST',
    body: JSON.stringify({ realmId })
  });
}

export async function installCard(type: string, realmId: string, cardInstanceId: string) {
  return apiFetch<{ realm: Realm; slot: InstitutionSlot; installCost: number }>(`/institutions/${type}/install`, {
    method: 'POST',
    body: JSON.stringify({ realmId, cardInstanceId })
  });
}

export async function reappointInstitution(type: string, realmId: string) {
  return apiFetch<{ slot: InstitutionSlot; cost: number }>(`/institutions/${type}/reappoint`, {
    method: 'POST',
    body: JSON.stringify({ realmId })
  });
}

export async function removeInstitution(type: string, realmId: string) {
  return apiFetch<{ collapsed: boolean }>(`/institutions/${type}/remove`, {
    method: 'POST',
    body: JSON.stringify({ realmId })
  });
}

export async function getMyCards() {
  return apiFetch<{ cards: CardInstance[] }>('/cards/my');
}

export async function draftCard(realmId: string) {
  return apiFetch<{ card: CardInstance; cost: number }>('/cards/draft', {
    method: 'POST',
    body: JSON.stringify({ realmId })
  });
}

export async function hostBanquet(realmId: string) {
  return apiFetch<{ card: CardInstance; cost: number }>('/cards/banquet', {
    method: 'POST',
    body: JSON.stringify({ realmId })
  });
}

export async function initiateRaid(attackerRealmId: string, defenderRealmId: string) {
  return apiFetch<{ raid: RaidLogEntry; result: RaidResultData }>('/raids', {
    method: 'POST',
    body: JSON.stringify({ attackerRealmId, defenderRealmId })
  });
}

export async function getRaidLog() {
  return apiFetch<{ raids: RaidLogEntry[] }>('/raids/log');
}

export async function getRegions() {
  return apiFetch<{ regions: Region[] }>('/regions');
}

export async function getNearbyRealms(lat: number, lng: number, radiusKm = 500) {
  return apiFetch<{ realms: NearbyRealm[] }>(
    `/realms/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
  );
}

// --- Dynasty ---
export async function createDynasty(realmId: string, name: string) {
  return apiFetch<{ dynasty: Dynasty }>('/dynasties', {
    method: 'POST',
    body: JSON.stringify({ realmId, name })
  });
}

export async function getRealmDynasty(realmId: string) {
  return apiFetch<{ dynasty: Dynasty | null }>(`/realms/${realmId}/dynasty`);
}

export async function crownHeir(heirId: string) {
  return apiFetch<{ heir: Heir; quality: string; revealedStats: Record<string, unknown>; cardInstance: CardInstance }>(`/heirs/${heirId}/crown`, {
    method: 'POST'
  });
}

export async function processTransfer(realmId: string) {
  return apiFetch<{ heir: Heir | null; legacyEcho: Record<string, unknown> | null }>(`/realms/${realmId}/process-transfer`, {
    method: 'POST'
  });
}

// Types
export interface Realm {
  id: string;
  name: string;
  originLat: number;
  originLng: number;
  wealth: number;
  population: number;
  legitimacyScore: number;
  isInterregnum: boolean;
  interregnumStartedAt: string | null;
  pillarInstitutions: number;
  pillarWealth: number;
  pillarPopulation: number;
  pillarCulture: number;
  pillarFaith: number;
  pillarVictory: number;
  pillarTime: number;
  lastTickAt: string | null;
  userId: string;
  regionId: string;
  createdAt: string;
  updatedAt: string;
  institutionSlots?: InstitutionSlot[];
  ownerDisplayName?: string;
}

export interface NearbyRealm {
  id: string;
  name: string;
  originLat: number;
  originLng: number;
  legitimacyScore: number;
  legitimacyTier: string;
  ownerDisplayName: string;
}

export interface InstitutionSlot {
  id: string;
  realmId: string;
  type: string;
  installedCardId: string | null;
  installedAt: string | null;
  termEndsAt: string | null;
  consecutiveTerms: number;
  installedCard?: CardInstance | null;
}

export interface CardInstance {
  id: string;
  templateId: string;
  ownerUserId: string;
  realmId: string | null;
  template: CardTemplate;
  installedSlot?: InstitutionSlot | null;
  createdAt: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  type: string;
  rarity: string;
  benefitPillars: Record<string, number> | null;
  downsidePillars: Record<string, number> | null;
  pressures: Record<string, number> | null;
  termModifier: number;
  flavorText: string | null;
  installCostOverride: number | null;
}

export interface LegitimacyInfo {
  score: number;
  tier: string;
  pillars: Record<string, number>;
}

export interface GameEvent {
  id: string;
  realmId: string;
  eventType: string;
  data: Record<string, unknown>;
  occurredAt: string;
}

export interface Region {
  id: string;
  name: string;
}

export interface RaidLogEntry {
  id: string;
  attackerRealmId: string;
  defenderRealmId: string;
  lootGained: number;
  attackerStabilityHit: number;
  defenderStabilityHit: number;
  success: boolean;
  occurredAt: string;
}

export interface RaidResultData {
  lootGained: number;
  attackerStabilityHit: number;
  defenderStabilityHit: number;
  success: boolean;
}

export interface Dynasty {
  id: string;
  realmId: string;
  name: string;
  foundedAt: string;
  legacyEchoes: LegacyEchoData[] | null;
  heirs: Heir[];
  reigns: ReignData[];
  createdAt: string;
}

export interface Heir {
  id: string;
  dynastyId: string;
  name: string;
  quality: string | null; // null if not revealed
  hiddenStats: Record<string, unknown> | null; // null if not revealed
  isRevealed: boolean;
  isCrowned: boolean;
  generatedFrom: string;
  createdAt: string;
}

export interface LegacyEchoData {
  pillarBiases: Record<string, number>;
  strength: number;
}

export interface ReignData {
  id: string;
  realmId: string;
  kingCardId: string;
  startedAt: string;
  endsAt: string;
  endedEarly: boolean;
  endReason: string | null;
  dynastyId: string | null;
}
