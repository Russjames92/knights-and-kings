import { PrismaClient, CardRarity, InstitutionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const region = await prisma.region.upsert({
    where: { name: 'Central Realm' },
    update: {},
    create: { name: 'Central Realm' }
  });

  const baseTemplates = [
    { name: 'Common Pawn', type: InstitutionType.Pawn, rarity: CardRarity.Common },
    { name: 'Common Knight', type: InstitutionType.Knight, rarity: CardRarity.Common },
    { name: 'Common Rook', type: InstitutionType.Rook, rarity: CardRarity.Common },
    { name: 'Common Bishop', type: InstitutionType.Bishop, rarity: CardRarity.Common },
    { name: 'Common King', type: InstitutionType.King, rarity: CardRarity.Common },
    { name: 'Uncommon Pawn', type: InstitutionType.Pawn, rarity: CardRarity.Uncommon },
    { name: 'Uncommon Knight', type: InstitutionType.Knight, rarity: CardRarity.Uncommon },
    { name: 'Uncommon Rook', type: InstitutionType.Rook, rarity: CardRarity.Uncommon },
    { name: 'Uncommon Bishop', type: InstitutionType.Bishop, rarity: CardRarity.Uncommon },
    { name: 'Uncommon King', type: InstitutionType.King, rarity: CardRarity.Uncommon }
  ];

  for (const template of baseTemplates) {
    await prisma.cardTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template
    });
  }

  console.log('Seed complete', { regionId: region.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
