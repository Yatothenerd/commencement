#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   List admins currently in the `admins` table (no password hashes
   shown). Use this to check why login might be failing.
   Usage:  node scripts/list-admins.js
   ═══════════════════════════════════════════════════════════ */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('\n  DATABASE_URL is not set — check .env.local.\n');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

try {
  const rows = await sql`
    SELECT id, username, is_active, created_at, updated_at
    FROM admins
    ORDER BY id`;

  if (rows.length === 0) {
    console.log('\n  No rows in the admins table yet.');
    console.log('  → Run:  node scripts/add-admin.js <username> <password>\n');
  } else {
    console.log(`\n  ${rows.length} admin(s):\n`);
    for (const r of rows) {
      console.log(`  #${r.id}  ${r.username}  ${r.is_active ? 'active' : 'DISABLED'}  created ${r.created_at.toISOString()}`);
    }
    console.log('');
  }
} catch (err) {
  console.error('\n  Query failed:', err.message);
  console.error('  → Did you run migrations/002_add_admins.sql yet?\n');
}
