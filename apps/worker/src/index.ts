import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';
import { computeRealmTick, getTickWindow } from '@knights/engine';

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');

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

async function processTicks() {
  const tickTime = getTickWindow(new Date());
  const batchSize = 100;
  let cursor: string | null = null;

  while (true) {
    const realms = await prisma.realm.findMany({
      where: {
        OR: [{ lastTickAt: null }, { lastTickAt: { lt: tickTime } }]
      },
      orderBy: { id: 'asc' },
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    });

    if (realms.length === 0) {
      break;
    }

    for (const realm of realms) {
      const { nextWealth } = computeRealmTick(
        { realmId: realm.id, lastTickAt: realm.lastTickAt, wealth: realm.wealth },
        tickTime
      );

      const updated = await prisma.realm.updateMany({
        where: {
          id: realm.id,
          OR: [{ lastTickAt: null }, { lastTickAt: { lt: tickTime } }]
        },
        data: {
          wealth: nextWealth,
          lastTickAt: tickTime
        }
      });

      if (updated.count === 0) {
        continue;
      }
    }

    cursor = realms[realms.length - 1]?.id ?? null;
    if (!cursor) {
      break;
    }
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
