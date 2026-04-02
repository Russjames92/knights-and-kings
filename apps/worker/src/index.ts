import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { computeRealmTick, getTickWindow } from '@knights/engine';
import type { RealmState, InstitutionSlotState, CardStats, PillarValues } from '@knights/shared';
import { getInstallCost } from '@knights/engine';

const prisma = new PrismaClient();
const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const queueName = 'realm-ticks';
const tickQueue = new Queue(queueName, { connection });

async function enqueueRepeatableTick() {
  await tickQueue.add(
    'hourly-tick',
    {},
    {
      jobId: 'hourly-tick',
      repeat: { pattern: '0 * * * *' },
      removeOnComplete: true,
      removeOnFail: 100
    }
  );
}

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

async function processTicks() {
  const tickTime = getTickWindow(new Date());
  const batchSize = 100;
  let cursor: string | null = null;

  while (true) {
    const realmInclude = {
      institutionSlots: {
        include: {
          installedCard: {
            include: { template: true }
          }
        }
      }
    } as const;

    type RealmWithSlots = Awaited<ReturnType<typeof prisma.realm.findMany<{ include: typeof realmInclude }>>>[number];
    let realms: RealmWithSlots[];
    if (cursor) {
      realms = await prisma.realm.findMany({
        where: { OR: [{ lastTickAt: null }, { lastTickAt: { lt: tickTime } }] },
        include: realmInclude,
        orderBy: { id: 'asc' },
        take: batchSize,
        skip: 1,
        cursor: { id: cursor }
      });
    } else {
      realms = await prisma.realm.findMany({
        where: { OR: [{ lastTickAt: null }, { lastTickAt: { lt: tickTime } }] },
        include: realmInclude,
        orderBy: { id: 'asc' },
        take: batchSize
      });
    }

    if (realms.length === 0) break;

    for (const realm of realms) {
      try {
        const state = buildRealmState(realm);
        const result = computeRealmTick(state, tickTime);

        await prisma.$transaction(async (tx) => {
          // Update realm with tick results
          const updated = await tx.realm.updateMany({
            where: {
              id: realm.id,
              OR: [{ lastTickAt: null }, { lastTickAt: { lt: tickTime } }]
            },
            data: {
              wealth: result.wealth,
              population: result.population,
              legitimacyScore: result.legitimacyScore,
              pillarInstitutions: result.pillars.Institutions,
              pillarWealth: result.pillars.Wealth,
              pillarPopulation: result.pillars.Population,
              pillarCulture: result.pillars.Culture,
              pillarFaith: result.pillars.Faith,
              pillarVictory: result.pillars.Victory,
              pillarTime: result.pillars.Time,
              isInterregnum: result.isInterregnum,
              interregnumStartedAt: result.interregnumStartedAt,
              lastTickAt: tickTime
            }
          });

          if (updated.count === 0) return;

          // Process expired slots - vacate them
          for (const slotType of result.expiredSlotTypes) {
            const slot = realm.institutionSlots.find((s: { type: string; installedCardId: string | null; id: string }) => s.type === slotType);
            if (slot?.installedCardId) {
              await tx.cardInstance.update({
                where: { id: slot.installedCardId },
                data: { realmId: null }
              });
              await tx.institutionSlot.update({
                where: { id: slot.id },
                data: {
                  installedCardId: null,
                  installedAt: null,
                  termEndsAt: null,
                  consecutiveTerms: 0
                }
              });
            }
          }

          // King-fall collapse: vacate ALL slots
          if (result.kingFell) {
            for (const slot of realm.institutionSlots) {
              if (slot.installedCardId && !result.expiredSlotTypes.includes(slot.type)) {
                await tx.cardInstance.update({
                  where: { id: slot.installedCardId },
                  data: { realmId: null }
                });
                await tx.institutionSlot.update({
                  where: { id: slot.id },
                  data: {
                    installedCardId: null,
                    installedAt: null,
                    termEndsAt: null,
                    consecutiveTerms: 0
                  }
                });
              }
            }
          }

          // Log events
          if (result.events.length > 0) {
            await tx.gameEventLog.createMany({
              data: result.events.map(e => ({
                realmId: e.realmId,
                eventType: e.type,
                data: e.data as object,
                occurredAt: e.occurredAt
              }))
            });
          }
        });
      } catch (error) {
        console.error(`Tick failed for realm ${realm.id}:`, error);
      }
    }

    cursor = realms[realms.length - 1]?.id ?? null;
    if (!cursor) break;
  }
}

const worker = new Worker(
  queueName,
  async () => {
    await processTicks();
  },
  { connection }
);

worker.on('failed', (job, error) => {
  console.error('Tick job failed', job?.id, error);
});

(async () => {
  await enqueueRepeatableTick();
  console.log('Worker running, repeatable tick scheduled.');
})();
