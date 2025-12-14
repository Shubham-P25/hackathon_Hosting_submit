import fs from 'node:fs/promises';
import path from 'node:path';
import prisma from '../src/utils/prismaClient.js';

const TABLES = [
  'user',
  'userProfile',
  'hostProfile',
  'hackathon',
  'registration',
  'team',
  'teamMember',
  'teamJoinRequest'
];

const OUTPUT_FILE = path.resolve(process.cwd(), 'backup.json');

async function exportTables() {
  const payload = {};

  for (const table of TABLES) {
    if (typeof prisma[table]?.findMany !== 'function') {
      throw new Error(`Prisma model "${table}" is not available. Check the table list.`);
    }

    const rows = await prisma[table].findMany();
    payload[table] = rows;
  }

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  return OUTPUT_FILE;
}

export async function main() {
  try {
    const filePath = await exportTables();
    console.log(`✅ Backup successfully written to ${filePath}`);
  } catch (error) {
    console.error('❌ Failed to export data:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
