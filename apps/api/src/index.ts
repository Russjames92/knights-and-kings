import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreateRealmRequestSchema,
  DevLoginRequestSchema,
  EstablishInstitutionRequestSchema,
  InstallInstitutionRequestSchema,
  InstitutionTypeEnum
} from '@knights/shared';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

const parseInstitutionType = (value: string) => {
  const parsed = InstitutionTypeEnum.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
};

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

app.use(async (req, res, next) => {
  if (req.path.startsWith('/auth')) {
    return next();
  }

  const userId = req.header('x-user-id');
  if (!userId) {
    return res.status(401).json({ error: 'Missing x-user-id header' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  res.locals.user = user;
  return next();
});

app.post('/realms', async (req, res) => {
  const parsed = CreateRealmRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

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
    include: { institutionSlots: true }
  });

  return res.json({ realms });
});

app.post('/institutions/:type/establish', async (req, res) => {
  const type = parseInstitutionType(req.params.type);
  if (!type) {
    return res.status(400).json({ error: 'Invalid institution type' });
  }

  const parsed = EstablishInstitutionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = res.locals.user as { id: string };
  const { realmId } = parsed.data;

  const realm = await prisma.realm.findFirst({ where: { id: realmId, userId: user.id } });
  if (!realm) {
    return res.status(404).json({ error: 'Realm not found' });
  }

  const slot = await prisma.institutionSlot.upsert({
    where: { realmId_type: { realmId, type } },
    update: {},
    create: { realmId, type }
  });

  return res.status(201).json({ slot });
});

app.post('/institutions/:type/install', async (req, res) => {
  const type = parseInstitutionType(req.params.type);
  if (!type) {
    return res.status(400).json({ error: 'Invalid institution type' });
  }

  const parsed = InstallInstitutionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = res.locals.user as { id: string };
  const { realmId, cardInstanceId } = parsed.data;
  const installCost = 100;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const realm = await tx.realm.findFirst({ where: { id: realmId, userId: user.id } });
      if (!realm) {
        throw new Error('Realm not found');
      }

      if (realm.wealth < installCost) {
        throw new Error('Insufficient wealth');
      }

      const slot = await tx.institutionSlot.findUnique({
        where: { realmId_type: { realmId, type } }
      });
      if (!slot) {
        throw new Error('Institution not established');
      }

      const cardInstance = await tx.cardInstance.findFirst({
        where: { id: cardInstanceId, ownerUserId: user.id, installedSlot: null },
        include: { template: true }
      });
      if (!cardInstance) {
        throw new Error('Card instance not available');
      }
      if (cardInstance.template.type !== type) {
        throw new Error('Card instance type mismatch');
      }

      const updatedRealm = await tx.realm.update({
        where: { id: realmId },
        data: { wealth: { decrement: installCost } }
      });

      const updatedSlot = await tx.institutionSlot.update({
        where: { id: slot.id },
        data: { installedCardId: cardInstance.id }
      });

      await tx.cardInstance.update({
        where: { id: cardInstance.id },
        data: { realmId }
      });

      return { updatedRealm, updatedSlot };
    });

    return res.status(201).json({
      realm: result.updatedRealm,
      slot: result.updatedSlot,
      installCost
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: message });
  }
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
