import { z } from 'zod';

export const InstitutionTypeEnum = z.enum([
  'Pawn',
  'Knight',
  'Rook',
  'Bishop',
  'Queen',
  'King'
]);
export type InstitutionType = z.infer<typeof InstitutionTypeEnum>;

export const CardRarityEnum = z.enum([
  'Common',
  'Uncommon',
  'Rare',
  'UltraRare',
  'Legendary'
]);
export type CardRarity = z.infer<typeof CardRarityEnum>;

export const LegitimacyPillarEnum = z.enum([
  'Institutions',
  'Wealth',
  'Population',
  'Culture',
  'Faith',
  'Victory',
  'Time'
]);
export type LegitimacyPillar = z.infer<typeof LegitimacyPillarEnum>;

export const LegitimacyTierEnum = z.enum([
  'Illegitimate',
  'Fragile',
  'Contested',
  'Established',
  'Sovereign'
]);
export type LegitimacyTier = z.infer<typeof LegitimacyTierEnum>;

export const GameEventTypeEnum = z.enum([
  'TermExpired',
  'KingFall',
  'PeacefulTransfer',
  'LegitimacyWarning',
  'RaidCompleted',
  'InterregnumStarted',
  'InterregnumEnded',
  'CardDrafted',
  'BanquetHeld'
]);
export type GameEventType = z.infer<typeof GameEventTypeEnum>;

export type PillarValues = Record<z.infer<typeof LegitimacyPillarEnum>, number>;

export type CardStats = {
  benefitPillars: Partial<PillarValues>;
  downsidePillars: Partial<PillarValues>;
  pressures: Partial<PillarValues>;
  installCost: number;
  termModifier: number;
};

export type InstitutionSlotState = {
  type: z.infer<typeof InstitutionTypeEnum>;
  installedCardId: string | null;
  cardStats: CardStats | null;
  installedAt: Date | null;
  termEndsAt: Date | null;
  consecutiveTerms: number;
};

export type RealmState = {
  realmId: string;
  wealth: number;
  population: number;
  legitimacyScore: number;
  pillars: PillarValues;
  institutions: InstitutionSlotState[];
  isInterregnum: boolean;
  interregnumStartedAt: Date | null;
  lastTickAt: Date | null;
  currentReignStartedAt: Date | null;
  currentReignEndsAt: Date | null;
};

export type TermState = {
  cardInstanceId: string;
  institutionType: z.infer<typeof InstitutionTypeEnum>;
  installedAt: Date;
  termEndsAt: Date;
  consecutiveTerms: number;
};

export type TermModifiers = {
  legitimacyScore: number;
  vacancyCount: number;
  isInterregnum: boolean;
};

export type GameEvent = {
  type: z.infer<typeof GameEventTypeEnum>;
  realmId: string;
  data: Record<string, unknown>;
  occurredAt: Date;
};

export type TickResult = {
  wealth: number;
  population: number;
  legitimacyScore: number;
  pillars: PillarValues;
  isInterregnum: boolean;
  interregnumStartedAt: Date | null;
  events: GameEvent[];
  expiredSlotTypes: string[];
  kingFell: boolean;
};

export type RaidResult = {
  lootGained: number;
  attackerStabilityHit: number;
  defenderStabilityHit: number;
  success: boolean;
};

// Request schemas
export const DevLoginRequestSchema = z.object({
  externalId: z.string().min(1),
  displayName: z.string().min(1).optional()
});

export const CreateRealmRequestSchema = z.object({
  name: z.string().min(1),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  regionId: z.string().uuid()
});

export const EstablishInstitutionRequestSchema = z.object({
  realmId: z.string().uuid()
});

export const InstallInstitutionRequestSchema = z.object({
  realmId: z.string().uuid(),
  cardInstanceId: z.string().uuid()
});

export type DevLoginRequest = z.infer<typeof DevLoginRequestSchema>;
export type CreateRealmRequest = z.infer<typeof CreateRealmRequestSchema>;
export type EstablishInstitutionRequest = z.infer<typeof EstablishInstitutionRequestSchema>;
export type InstallInstitutionRequest = z.infer<typeof InstallInstitutionRequestSchema>;
