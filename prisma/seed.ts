import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define preset tags
const presetTags = [
  'Major 2-5-1',
  'Minor 2-5-1',
  'Dominant 7th (Mixolydian)',
  'Tonic Major',
  'Tonic Minor',
  'Major 6',
  'Minor 6',
  'Minor 7',
  'Major 7',
  'Lydian',
  'Altered Scale',
  'Diminished',
  'Blues Scale',
  'Bebop Scale',
  'Pentatonic',
  'Modal Interchange',
  'Rhythm Changes',
  'Major Scale',
  'Minor Scale',
  'Dorian',
  'Phrygian',
  'Harmonic Minor',
  'Locrian',
  'Super Locrian',
  'Whole Tone',
  'Major Pentatonic',
  'Minor Pentatonic',
  'Major Blues',
  'Minor Blues',
  'Tritone Substitution',
  'Rhythm Patterns',
  'Chromatic',
  'Augmented'
  // Add more preset tags as needed
];

async function main() {
  console.log(`Start seeding ...`);
  for (const tagName of presetTags) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        type: 'preset', // Mark as a preset tag
        // Preset tags are not associated with a specific user initially
      },
    });
    console.log(`Created or found tag with id: ${tag.id} (${tag.name})`);
  }
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
