import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreateRealmRequestSchema,
  DevLoginRequestSchema,
  EstablishInstitutionRequestSchema,
  InstallInstitutionRequestSchema,
  InstitutionTypeEnum
} from '@knights/shared';
import type { RealmState, InstitutionSlotState, CardStats, PillarValues } from '@knights/shared';
import {
  getInstallCost,
  computeRaidOutcome,
  getLegitimacyTier,
  getPillarContributions,
  getDefaultTermDays,
  computeTermEnd,
  canReappoint,
  validateInstallation
} from '@knights/engine';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// CORS for localhost:3000
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-user-id');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

const parseInstitutionType = (value: string) => {
  const parsed = InstitutionTypeEnum.safeParse(value);
  if (!parsed.success) return null;
  return parsed.data;
};

// --- Auth ---
app.post('/auth/dev-login', async (req, res) => {
  const parsed = DevLoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { externalId, displayName } = parsed.data;
  const user = await prisma.user.upsert({
    where: { externalId },
    update: { displayName },
    create: { externalId, displayName }
  });

  return res.json({ userId: user.id });
});

// --- Auth middleware ---
app.use(async (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();

  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ error: 'Missing x-user-id header' });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ error: 'User not found' });

  res.locals.user = user;
  return next();
});

// --- Helper to build RealmState from DB ---
function buildRealmState(realm: {
  id: string;
  wealth: number;
  population: number;
  legitimacyScore: number;
  pillarInstitutions: number;
  pillarWealth: number;
  pillarPopulation: number;
  pillarCulture: number;
  pillarFaith: number;
  pillarVictory: number;
  pillarTime: number;
  isInterregnum: boolean;
  interregnumStartedAt: Date | null;
  lastTickAt: Date | null;
  institutionSlots: Array<{
    type: string;
    installedCardId: string | null;
    installedAt: Date | null;
    termEndsAt: Date | null;
    consecutiveTerms: number;
    installedCard: {
      template: {
        benefitPillars: unknown;
        downsidePillars: unknown;
        pressures: unknown;
        rarity: string;
        termModifier: number;
        installCostOverride: number | null;
      };
    } | null;
  }>;
}): RealmState {
  const institutions: InstitutionSlotState[] = realm.institutionSlots.map(slot => {
    let cardStats: CardStats | null = null;
    if (slot.installedCard) {
      const t = slot.installedCard.template;
      cardStats = {
        benefitPillars: (t.benefitPillars as Partial<PillarValues>) ?? {},
        downsidePillars: (t.downsidePillars as Partial<PillarValues>) ?? {},
        pressures: (t.pressures as Partial<PillarValues>) ?? {},
        installCost: t.installCostOverride ?? getInstallCost(t.rarity as 'Common' | 'Uncommon' | 'Rare' | 'UltraRare' | 'Legendary'),
        termModifier: t.termModifier
      };
    }
    return {
      type: slot.type as InstitutionSlotState['type'],
      installedCardId: slot.installedCardId,
      cardStats,
      installedAt: slot.installedAt,
      termEndsAt: slot.termEndsAt,
      consecutiveTerms: slot.consecutiveTerms
    };
  });

  return {
    realmId: realm.id,
    wealth: realm.wealth,
    population: realm.population,
    legitimacyScore: realm.legitimacyScore,
    pillars: {
      Institutions: realm.pillarInstitutions,
      Wealth: realm.pillarWealth,
      Population: realm.pillarPopulation,
      Culture: realm.pillarCulture,
      Faith: realm.pillarFaith,
      Victory: realm.pillarVictory,
      Time: realm.pillarTime
    },
    institutions,
    isInterregnum: realm.isInterregnum,
    interregnumStartedAt: realm.interregnumStartedAt,
    lastTickAt: realm.lastTickAt,
    currentReignStartedAt: null,
    currentReignEndsAt: null
  };
}

const realmInclude = {
  institutionSlots: {
    include: {
      installedCard: {
        include: { template: true }
      }
    }
  }
} as const;

// --- Realm endpoints ---
app.post('/realms', async (req, res) => {
  const parsed = CreateRealmRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = res.locals.user as { id: string };
  const { name, originLat, originLng, regionId } = parsed.data;

  const realm = await prisma.realm.create({
    data: {
      name,
      originLat,
      originLng,
      regionId,
      userId: user.id,
      wealth: 500
    }
  });

  return res.status(201).json({ realm });
});

app.get('/realms/me', async (req, res) => {
  const user = res.locals.user as { id: string };
  const realms = await prisma.realm.findMany({
    where: { userId: user.id },
    include: realmInclude
  });
  return res.json({ realms });
});

app.get('/realms/nearby', async (req, res) => {
  const user = res.locals.user as { id: string };
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radiusKm = parseFloat(req.query.radiusKm as string) || 500;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng query params required' });
  }

  // Bounding box approximation: 1 degree latitude ≈ 111 km
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const nearbyRealms = await prisma.realm.findMany({
    where: {
      userId: { not: user.id },
      originLat: { gte: lat - latDelta, lte: lat + latDelta },
      originLng: { gte: lng - lngDelta, lte: lng + lngDelta }
    },
    include: { user: { select: { displayName: true } } }
  });

  // Haversine filter for accurate distance
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const filtered = nearbyRealms.filter(r => {
    const dLat = toRad(r.originLat - lat);
    const dLng = toRad(r.originLng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(r.originLat)) * Math.sin(dLng / 2) ** 2;
    const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distKm <= radiusKm;
  });

  const results = filtered.map(r => ({
    id: r.id,
    name: r.name,
    originLat: r.originLat,
    originLng: r.originLng,
    legitimacyScore: r.legitimacyScore,
    legitimacyTier: getLegitimacyTier(r.legitimacyScore),
    ownerDisplayName: r.user?.displayName ?? 'Unknown'
  }));

  return res.json({ realms: results });
});

app.get('/realms/:id', async (req, res) => {
  const user = res.locals.user as { id: string };
  const realm = await prisma.realm.findFirst({
    where: { id: req.params.id, userId: user.id },
    include: {
      ...realmInclude,
      user: { select: { displayName: true } }
    }
  });
  if (!realm) return res.status(404).json({ error: 'Realm not found' });

  const state = buildRealmState(realm);
  const tier = getLegitimacyTier(realm.legitimacyScore);

  return res.json({
    realm: {
      ...realm,
      ownerDisplayName: realm.user?.displayName ?? 'Unknown'
    },
    legitimacy: {
      score: realm.legitimacyScore,
      tier,
      pillars: state.pillars
    }
  });
});

app.get('/realms/:id/legitimacy', async (req, res) => {
  const user = res.locals.user as { id: string };
  const realm = await prisma.realm.findFirst({
    where: { id: req.params.id, userId: user.id },
    include: realmInclude
  });
  if (!realm) return res.status(404).json({ error: 'Realm not found' });

  const state = buildRealmState(realm);
  const pillars = getPillarContributions(state);
  const tier = getLegitimacyTier(realm.legitimacyScore);

  return res.json({
    score: realm.legitimacyScore,
    tier,
    pillars
  });
});

app.get('/realms/:id/events', async (req, res) => {
  const user = res.locals.user as { id: string };
  const realm = await prisma.realm.findFirst({
    where: { id: req.params.id, userId: user.id }
  });
  if (!realm) return res.status(404).json({ error: 'Realm not found' });

  const events = await prisma.gameEventLog.findMany({
    where: { realmId: realm.id },
    orderBy: { occurredAt: 'desc' },
    take: 50
  });

  return res.json({ events });
});

// --- Institution endpoints ---
app.post('/institutions/:type/establish', async (req, res) => {
  const type = parseInstitutionType(req.params.type);
  if (!type) return res.status(400).json({ error: 'Invalid institution type' });

  const parsed = EstablishInstitutionRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = res.locals.user as { id: string };
  const { realmId } = parsed.data;

  const realm = await prisma.realm.findFirst({ where: { id: realmId, userId: user.id } });
  if (!realm) return res.status(404).json({ error: 'Realm not found' });

  const slot = await prisma.institutionSlot.upsert({
    where: { realmId_type: { realmId, type } },
    update: {},
    create: { realmId, type }
  });

  return res.status(201).json({ slot });
});

app.post('/institutions/:type/install', async (req, res) => {
  const type = parseInstitutionType(req.params.type);
  if (!type) return res.status(400).json({ error: 'Invalid institution type' });

  const parsed = InstallInstitutionRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = res.locals.user as { id: string };
  const { realmId, cardInstanceId } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const realm = await tx.realm.findFirst({
        where: { id: realmId, userId: user.id },
        include: realmInclude
      });
      if (!realm) throw new Error('Realm not found');

      const cardInstance = await tx.cardInstance.findFirst({
        where: { id: cardInstanceId, ownerUserId: user.id, installedSlot: null },
        include: { template: true }
      });
      if (!cardInstance) throw new Error('Card instance not available');
      if (cardInstance.template.type !== type) throw new Error('Card type mismatch');

      const installCost = cardInstance.template.installCostOverride
        ?? getInstallCost(cardInstance.template.rarity as 'Common' | 'Uncommon' | 'Rare' | 'UltraRare' | 'Legendary');

      const state = buildRealmState(realm);
      const cardStats: CardStats = {
        benefitPillars: (cardInstance.template.benefitPillars as Partial<PillarValues>) ?? {},
        downsidePillars: (cardInstance.template.downsidePillars as Partial<PillarValues>) ?? {},
        pressures: (cardInstance.template.pressures as Partial<PillarValues>) ?? {},
        installCost,
        termModifier: cardInstance.template.termModifier
      };

      const validation = validateInstallation(state, cardStats, type);
      if (!validation.valid) throw new Error(validation.reason ?? 'Invalid installation');

      const now = new Date();
      const baseDays = getDefaultTermDays(type) + cardStats.termModifier;
      const termEnd = computeTermEnd(now, baseDays, {
        legitimacyScore: realm.legitimacyScore,
        vacancyCount: realm.institutionSlots.filter(s => !s.installedCardId).length,
        isInterregnum: realm.isInterregnum
      });

      const updatedRealm = await tx.realm.update({
        where: { id: realmId },
        data: { wealth: { decrement: installCost } }
      });

      const slot = await tx.institutionSlot.findUnique({
        where: { realmId_type: { realmId, type } }
      });
      if (!slot) throw new Error('Institution not established');

      const updatedSlot = await tx.institutionSlot.update({
        where: { id: slot.id },
        data: {
          installedCardId: cardInstance.id,
          installedAt: now,
          termEndsAt: termEnd,
          consecutiveTerms: 0
        }
      });

      await tx.cardInstance.update({
        where: { id: cardInstance.id },
        data: { realmId }
      });

      // If installing a King, create a Reign record
      if (type === 'King') {
        await tx.reign.create({
          data: {
            realmId,
            kingCardId: cardInstance.id,
            startedAt: now,
            endsAt: termEnd
          }
        });

        // End interregnum if active
        if (realm.isInterregnum) {
          await tx.realm.update({
            where: { id: realmId },
            data: { isInterregnum: false, interregnumStartedAt: null }
          });
          await tx.gameEventLog.create({
            data: {
              realmId,
              eventType: 'InterregnumEnded',
              data: {},
              occurredAt: now
            }
          });
        }
      }

      return { updatedRealm, updatedSlot, installCost };
    });

    return res.status(201).json({
      realm: result.updatedRealm,
      slot: result.updatedSlot,
      installCost: result.installCost
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
});

app.post('/institutions/:type/reappoint', async (req, res) => {
  const type = parseInstitutionType(req.params.type);
  if (!type) return res.status(400).json({ error: 'Invalid institution type' });

  const parsed = EstablishInstitutionRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = res.locals.user as { id: string };
  const { realmId } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const realm = await tx.realm.findFirst({
        where: { id: realmId, userId: user.id },
        include: realmInclude
      });
      if (!realm) throw new Error('Realm not found');

      const slot = realm.institutionSlots.find(s => s.type === type);
      if (!slot) throw new Error('Institution not established');
      if (!slot.installedCardId) throw new Error('No card installed to reappoint');

      const slotState: InstitutionSlotState = {
        type: slot.type as InstitutionSlotState['type'],
        installedCardId: slot.installedCardId,
        cardStats: null,
        installedAt: slot.installedAt,
        termEndsAt: slot.termEndsAt,
        consecutiveTerms: slot.consecutiveTerms
      };

      const { allowed, extraCost } = canReappoint(slotState);
      if (!allowed) throw new Error('Cannot reappoint: maximum consecutive terms reached');
      if (realm.wealth < extraCost) throw new Error('Insufficient wealth for reappointment');

      const now = new Date();
      const baseDays = getDefaultTermDays(type);
      const termEnd = computeTermEnd(now, baseDays, {
        legitimacyScore: realm.legitimacyScore,
        vacancyCount: realm.institutionSlots.filter(s => !s.installedCardId).length,
        isInterregnum: realm.isInterregnum
      });

      await tx.realm.update({
        where: { id: realmId },
        data: { wealth: { decrement: extraCost } }
      });

      const updatedSlot = await tx.institutionSlot.update({
        where: { id: slot.id },
        data: {
          installedAt: now,
          termEndsAt: termEnd,
          consecutiveTerms: slot.consecutiveTerms + 1
        }
      });

      return { updatedSlot, cost: extraCost };
    });

    return res.json({ slot: result.updatedSlot, cost: result.cost });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
});

app.post('/institutions/:type/remove', async (req, res) => {
  const type = parseInstitutionType(req.params.type);
  if (!type) return res.status(400).json({ error: 'Invalid institution type' });

  const parsed = EstablishInstitutionRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = res.locals.user as { id: string };
  const { realmId } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const realm = await tx.realm.findFirst({
        where: { id: realmId, userId: user.id },
        include: realmInclude
      });
      if (!realm) throw new Error('Realm not found');

      const slot = realm.institutionSlots.find(s => s.type === type);
      if (!slot || !slot.installedCardId) throw new Error('No card installed');

      // If removing King, trigger government collapse
      if (type === 'King') {
        // Vacate ALL slots
        for (const s of realm.institutionSlots) {
          if (s.installedCardId) {
            await tx.cardInstance.update({
              where: { id: s.installedCardId },
              data: { realmId: null }
            });
            await tx.institutionSlot.update({
              where: { id: s.id },
              data: {
                installedCardId: null,
                installedAt: null,
                termEndsAt: null,
                consecutiveTerms: 0
              }
            });
          }
        }

        const now = new Date();
        const updatedRealm = await tx.realm.update({
          where: { id: realmId },
          data: {
            isInterregnum: true,
            interregnumStartedAt: now,
            legitimacyScore: Math.max(0, realm.legitimacyScore - 30)
          }
        });

        await tx.gameEventLog.create({
          data: { realmId, eventType: 'KingFall', data: { voluntary: true }, occurredAt: now }
        });
        await tx.gameEventLog.create({
          data: { realmId, eventType: 'InterregnumStarted', data: {}, occurredAt: now }
        });

        return { realm: updatedRealm, collapsed: true };
      }

      // Regular removal
      await tx.cardInstance.update({
        where: { id: slot.installedCardId },
        data: { realmId: null }
      });
      const updatedSlot = await tx.institutionSlot.update({
        where: { id: slot.id },
        data: {
          installedCardId: null,
          installedAt: null,
          termEndsAt: null,
          consecutiveTerms: 0
        }
      });

      return { slot: updatedSlot, collapsed: false };
    });

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
});

// --- Card endpoints ---
app.get('/cards/my', async (req, res) => {
  const user = res.locals.user as { id: string };
  const cards = await prisma.cardInstance.findMany({
    where: { ownerUserId: user.id },
    include: { template: true, installedSlot: true }
  });
  return res.json({ cards });
});

app.post('/cards/draft', async (req, res) => {
  const user = res.locals.user as { id: string };
  const { realmId } = req.body as { realmId?: string };
  if (!realmId) return res.status(400).json({ error: 'realmId required' });

  const draftCost = 30;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const realm = await tx.realm.findFirst({ where: { id: realmId, userId: user.id } });
      if (!realm) throw new Error('Realm not found');
      if (realm.wealth < draftCost) throw new Error('Insufficient wealth');

      // Get Common/Uncommon templates
      const templates = await tx.cardTemplate.findMany({
        where: { rarity: { in: ['Common', 'Uncommon'] } }
      });
      if (templates.length === 0) throw new Error('No templates available');

      const template = templates[Math.floor(Math.random() * templates.length)];

      await tx.realm.update({
        where: { id: realmId },
        data: { wealth: { decrement: draftCost } }
      });

      const card = await tx.cardInstance.create({
        data: {
          templateId: template.id,
          ownerUserId: user.id
        },
        include: { template: true }
      });

      await tx.gameEventLog.create({
        data: {
          realmId,
          eventType: 'CardDrafted',
          data: { cardName: template.name, rarity: template.rarity },
          occurredAt: new Date()
        }
      });

      return { card, cost: draftCost };
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
});

app.post('/cards/banquet', async (req, res) => {
  const user = res.locals.user as { id: string };
  const { realmId } = req.body as { realmId?: string };
  if (!realmId) return res.status(400).json({ error: 'realmId required' });

  const banquetCost = 300;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const realm = await tx.realm.findFirst({ where: { id: realmId, userId: user.id } });
      if (!realm) throw new Error('Realm not found');
      if (realm.wealth < banquetCost) throw new Error('Insufficient wealth');

      // Get Rare/UltraRare templates
      const templates = await tx.cardTemplate.findMany({
        where: { rarity: { in: ['Rare', 'UltraRare'] } }
      });
      if (templates.length === 0) throw new Error('No rare templates available');

      const template = templates[Math.floor(Math.random() * templates.length)];

      await tx.realm.update({
        where: { id: realmId },
        data: { wealth: { decrement: banquetCost } }
      });

      const card = await tx.cardInstance.create({
        data: {
          templateId: template.id,
          ownerUserId: user.id
        },
        include: { template: true }
      });

      await tx.gameEventLog.create({
        data: {
          realmId,
          eventType: 'BanquetHeld',
          data: { cardName: template.name, rarity: template.rarity },
          occurredAt: new Date()
        }
      });

      return { card, cost: banquetCost };
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
});

// --- Raid endpoints ---
app.post('/raids', async (req, res) => {
  const user = res.locals.user as { id: string };
  const { attackerRealmId, defenderRealmId } = req.body as { attackerRealmId?: string; defenderRealmId?: string };
  if (!attackerRealmId || !defenderRealmId) {
    return res.status(400).json({ error: 'attackerRealmId and defenderRealmId required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const attackerRealm = await tx.realm.findFirst({
        where: { id: attackerRealmId, userId: user.id },
        include: realmInclude
      });
      if (!attackerRealm) throw new Error('Attacker realm not found');

      const defenderRealm = await tx.realm.findFirst({
        where: { id: defenderRealmId },
        include: realmInclude
      });
      if (!defenderRealm) throw new Error('Defender realm not found');

      // Require Knight institution
      const knightSlot = attackerRealm.institutionSlots.find(s => s.type === 'Knight' && s.installedCardId);
      if (!knightSlot) throw new Error('Knight institution required for raids');

      const attackerState = buildRealmState(attackerRealm);
      const defenderState = buildRealmState(defenderRealm);
      const raidResult = computeRaidOutcome(attackerState, defenderState);

      // Apply results
      await tx.realm.update({
        where: { id: attackerRealmId },
        data: {
          wealth: { increment: raidResult.lootGained },
          legitimacyScore: Math.max(0, attackerRealm.legitimacyScore - raidResult.attackerStabilityHit),
          pillarVictory: Math.min(100, attackerRealm.pillarVictory + (raidResult.success ? 5 : 0))
        }
      });

      await tx.realm.update({
        where: { id: defenderRealmId },
        data: {
          wealth: { decrement: raidResult.lootGained },
          legitimacyScore: Math.max(0, defenderRealm.legitimacyScore - raidResult.defenderStabilityHit)
        }
      });

      const raid = await tx.raidLog.create({
        data: {
          attackerRealmId,
          defenderRealmId,
          lootGained: raidResult.lootGained,
          attackerStabilityHit: raidResult.attackerStabilityHit,
          defenderStabilityHit: raidResult.defenderStabilityHit,
          success: raidResult.success
        }
      });

      await tx.gameEventLog.create({
        data: {
          realmId: attackerRealmId,
          eventType: 'RaidCompleted',
          data: { success: raidResult.success, loot: raidResult.lootGained, targetRealmId: defenderRealmId },
          occurredAt: new Date()
        }
      });

      return { raid, result: raidResult };
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
});

app.get('/raids/log', async (req, res) => {
  const user = res.locals.user as { id: string };
  const userRealms = await prisma.realm.findMany({
    where: { userId: user.id },
    select: { id: true }
  });
  const realmIds = userRealms.map(r => r.id);

  const raids = await prisma.raidLog.findMany({
    where: {
      OR: [
        { attackerRealmId: { in: realmIds } },
        { defenderRealmId: { in: realmIds } }
      ]
    },
    orderBy: { occurredAt: 'desc' },
    take: 50
  });

  return res.json({ raids });
});

// --- Region endpoints ---
app.get('/regions', async (_req, res) => {
  const regions = await prisma.region.findMany({
    orderBy: { name: 'asc' }
  });
  return res.json({ regions });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
