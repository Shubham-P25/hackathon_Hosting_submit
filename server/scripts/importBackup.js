import fs from 'node:fs/promises';
import path from 'node:path';
import prisma from '../src/utils/prismaClient.js';

const TABLES_DELETE_ORDER = [
  'teamJoinRequest',
  'teamMember',
  'registration',
  'hackathon',
  'hostProfile',
  'userProfile',
  'user'
];

const TABLES_INSERT_ORDER = [
  'user',
  'userProfile',
  'hostProfile',
  'hackathon',
  'registration',
  'team',
  'teamMember',
  'teamJoinRequest'
];

const SERIAL_TABLES = [
  { table: '"User"', column: 'id' },
  { table: '"UserProfile"', column: 'id' },
  { table: '"HostProfile"', column: 'id' },
  { table: '"Hackathon"', column: 'id' },
  { table: '"Registration"', column: 'id' },
  { table: '"Team"', column: 'id' },
  { table: '"TeamMember"', column: 'id' },
  { table: '"TeamJoinRequest"', column: 'id' }
];

function resolveInputPath(argPath) {
  if (!argPath) {
    return path.resolve(process.cwd(), 'backup.json');
  }
  return path.resolve(process.cwd(), argPath);
}

async function loadBackup(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function resetSequences(tx) {
  for (const { table, column } of SERIAL_TABLES) {
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', '${column}'), coalesce((SELECT max("${column}") FROM ${table}), 0) + 1, false);`
    );
  }
}

export async function main() {
  const filePath = resolveInputPath(process.argv[2]);

  try {
    const payload = await loadBackup(filePath);

    await prisma.$transaction(async (tx) => {
      for (const table of TABLES_DELETE_ORDER) {
        if (tx[table]?.deleteMany) {
          await tx[table].deleteMany();
        }
      }

      for (const table of TABLES_INSERT_ORDER) {
        const rows = payload[table];
        if (!rows?.length) continue;
        if (!tx[table]?.createMany) {
          throw new Error(`Missing Prisma model for ${table}`);
        }
        await tx[table].createMany({ data: rows });
      }

      await resetSequences(tx);
    });

    console.log(`✅ Data restored from ${filePath}`);
  } catch (error) {
    console.error('❌ Failed to import data:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
