// scripts/importHackathons.js
// Usage: node scripts/importHackathons.js

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use absolute path directly since your CSV is not relative
const csvPath = 'c:/Users/Shubham/Downloads/hackathon_fixed_host_cleaned.csv';

function parseMaybeJSON(val) {
  if (!val || val === '[]' || val === '{}') return Array.isArray(val) ? [] : {};
  try {
    return JSON.parse(val.replace(/''/g, '"').replace(/""/g, '"'));
  } catch {
    try {
      return eval('(' + val + ')'); // fallback for weird CSV JSON
    } catch {
      return val;
    }
  }
}

(async () => {
  const file = fs.readFileSync(csvPath, 'utf8');
  const records = parse(file, { columns: true, skip_empty_lines: true });

  for (const row of records) {
    try {
      await prisma.hackathon.create({
        data: {
          id: Number(row.id),
          title: row.title,
          description: row.description,
          overview: row.overview,
          rules: parseMaybeJSON(row.rules),
          criteria: row.criteria,
          timeline: parseMaybeJSON(row.timeline),
          rounds: parseMaybeJSON(row.rounds),
          prizes: parseMaybeJSON(row.prizes),
          faqs: parseMaybeJSON(row.faqs),
          updates: parseMaybeJSON(row.updates),
          helpContact: parseMaybeJSON(row.helpContact),
          mode: row.mode,
          teamSize: row.teamSize ? Number(row.teamSize) : null,
          domain: row.domain,
          skillsRequired: parseMaybeJSON(row.skillsRequired),
          startDate: new Date(row.startDate),
          endDate: new Date(row.endDate),
          location: row.location || null,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
          hostId: Number(row.hostId),
        }
      });
      console.log(`Imported: ${row.title}`);
    } catch (err) {
      console.error(`Failed to import row with id ${row.id}:`, err.message);
    }
  }
  await prisma.$disconnect();
})();
