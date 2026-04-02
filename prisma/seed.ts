import { PrismaClient, CardRarity, InstitutionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple regions
  const regions = [
    'Central Realm',
    'Northern Wastes',
    'Eastern Shores',
    'Southern Deserts',
    'Western Highlands'
  ];

  for (const name of regions) {
    await prisma.region.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const templates = [
    // Common cards
    { name: 'Common Pawn', type: InstitutionType.Pawn, rarity: CardRarity.Common, benefitPillars: { Population: 5 }, downsidePillars: {}, pressures: {}, termModifier: 0, flavorText: 'A loyal peasant ready to till the fields.' },
    { name: 'Common Knight', type: InstitutionType.Knight, rarity: CardRarity.Common, benefitPillars: { Victory: 5 }, downsidePillars: { Wealth: -2 }, pressures: {}, termModifier: 0, flavorText: 'A squire recently knighted.' },
    { name: 'Common Rook', type: InstitutionType.Rook, rarity: CardRarity.Common, benefitPillars: { Institutions: 5 }, downsidePillars: {}, pressures: {}, termModifier: 0, flavorText: 'A stone watchtower guards the border.' },
    { name: 'Common Bishop', type: InstitutionType.Bishop, rarity: CardRarity.Common, benefitPillars: { Faith: 5, Culture: 3 }, downsidePillars: {}, pressures: {}, termModifier: 0, flavorText: 'A humble cleric spreading the word.' },
    { name: 'Common King', type: InstitutionType.King, rarity: CardRarity.Common, benefitPillars: { Institutions: 5 }, downsidePillars: {}, pressures: {}, termModifier: 0, flavorText: 'A minor lord elevated to rule.' },

    // Uncommon cards
    { name: 'Uncommon Pawn', type: InstitutionType.Pawn, rarity: CardRarity.Uncommon, benefitPillars: { Population: 10, Wealth: 3 }, downsidePillars: {}, pressures: {}, termModifier: 5, flavorText: 'An experienced reeve managing the harvest.' },
    { name: 'Uncommon Knight', type: InstitutionType.Knight, rarity: CardRarity.Uncommon, benefitPillars: { Victory: 10, Institutions: 3 }, downsidePillars: { Wealth: -5 }, pressures: {}, termModifier: 0, flavorText: 'A veteran of many campaigns.' },
    { name: 'Uncommon Rook', type: InstitutionType.Rook, rarity: CardRarity.Uncommon, benefitPillars: { Institutions: 10, Population: 3 }, downsidePillars: {}, pressures: {}, termModifier: 0, flavorText: 'A fortified castle with deep moats.' },
    { name: 'Uncommon Bishop', type: InstitutionType.Bishop, rarity: CardRarity.Uncommon, benefitPillars: { Faith: 10, Culture: 8 }, downsidePillars: { Victory: -2 }, pressures: {}, termModifier: 0, flavorText: 'A scholarly bishop with a grand cathedral.' },
    { name: 'Uncommon King', type: InstitutionType.King, rarity: CardRarity.Uncommon, benefitPillars: { Institutions: 10, Wealth: 5 }, downsidePillars: {}, pressures: {}, termModifier: 10, flavorText: 'A respected noble with a claim to the throne.' },

    // Rare cards
    { name: 'Rare Pawn - Master Farmer', type: InstitutionType.Pawn, rarity: CardRarity.Rare, benefitPillars: { Population: 20, Wealth: 8 }, downsidePillars: {}, pressures: {}, termModifier: 10, flavorText: 'A legendary farmer whose methods transform the land.' },
    { name: 'Rare Knight - War Marshal', type: InstitutionType.Knight, rarity: CardRarity.Rare, benefitPillars: { Victory: 20, Institutions: 5 }, downsidePillars: { Faith: -5 }, pressures: {}, termModifier: 5, flavorText: 'A feared commander who inspires and terrifies.' },
    { name: 'Rare Rook - Iron Fortress', type: InstitutionType.Rook, rarity: CardRarity.Rare, benefitPillars: { Institutions: 20, Victory: 5 }, downsidePillars: { Culture: -3 }, pressures: {}, termModifier: 0, flavorText: 'An impregnable stronghold of iron and stone.' },
    { name: 'Rare Bishop - Grand Inquisitor', type: InstitutionType.Bishop, rarity: CardRarity.Rare, benefitPillars: { Faith: 20, Culture: 15 }, downsidePillars: { Population: -5 }, pressures: {}, termModifier: 0, flavorText: 'A zealous leader who demands absolute devotion.' },
    { name: 'Rare Queen - Lady of the Court', type: InstitutionType.Queen, rarity: CardRarity.Rare, benefitPillars: { Culture: 15, Institutions: 10, Faith: 5 }, downsidePillars: {}, pressures: {}, termModifier: 10, flavorText: 'A diplomatic queen whose court rivals any in the land.' },

    // UltraRare cards
    { name: 'UltraRare King - The Conqueror', type: InstitutionType.King, rarity: CardRarity.UltraRare, benefitPillars: { Victory: 25, Institutions: 15, Wealth: 10 }, downsidePillars: { Faith: -10, Culture: -5 }, pressures: {}, termModifier: 15, flavorText: 'A ruthless ruler who forges an empire through war.' },
    { name: 'UltraRare Knight - Dragon Slayer', type: InstitutionType.Knight, rarity: CardRarity.UltraRare, benefitPillars: { Victory: 30, Culture: 10 }, downsidePillars: { Wealth: -10 }, pressures: {}, termModifier: 10, flavorText: 'A legendary hero whose tales inspire generations.' },

    // Legendary cards
    { name: 'Richard the Lionheart', type: InstitutionType.King, rarity: CardRarity.Legendary, benefitPillars: { Victory: 35, Institutions: 20, Culture: 15 }, downsidePillars: { Wealth: -15, Population: -5 }, pressures: {}, termModifier: 30, flavorText: 'The warrior king whose crusades echoed across continents.' },
    { name: 'Charlemagne', type: InstitutionType.King, rarity: CardRarity.Legendary, benefitPillars: { Institutions: 35, Culture: 25, Faith: 20 }, downsidePillars: { Victory: -5 }, pressures: {}, termModifier: 30, flavorText: 'Father of Europe, unifier of kingdoms.' },
    { name: 'Joan of Arc', type: InstitutionType.Knight, rarity: CardRarity.Legendary, benefitPillars: { Faith: 30, Victory: 25, Culture: 20 }, downsidePillars: {}, pressures: {}, termModifier: 15, flavorText: 'The Maid of Orleans who turned the tide of war.' },
  ];

  for (const template of templates) {
    await prisma.cardTemplate.upsert({
      where: { name: template.name },
      update: {
        benefitPillars: template.benefitPillars,
        downsidePillars: template.downsidePillars,
        pressures: template.pressures,
        termModifier: template.termModifier,
        flavorText: template.flavorText
      },
      create: {
        name: template.name,
        type: template.type,
        rarity: template.rarity,
        benefitPillars: template.benefitPillars,
        downsidePillars: template.downsidePillars,
        pressures: template.pressures,
        termModifier: template.termModifier,
        flavorText: template.flavorText
      }
    });
  }

  console.log('Seed complete: regions and card templates created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
