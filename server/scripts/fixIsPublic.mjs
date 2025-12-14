import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  // Update any teams where isPublic IS NULL to true
  const result = await prisma.team.updateMany({
    where: { isPublic: null },
    data: { isPublic: true }
  }).catch((err) => {
    console.error('Failed to update teams:', err.message || err);
    process.exitCode = 2;
  });

  console.log('Update result:', result);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
