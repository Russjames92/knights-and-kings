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
