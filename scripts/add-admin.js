#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   Add (or update) an admin in the `admins` table.
   Usage:  node scripts/add-admin.js <username> <password>

   Requires DATABASE_URL — loads it from .env.local automatically.
   ═══════════════════════════════════════════════════════════ */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error('\n  Usage:  node scripts/add-admin.js <username> <password>\n');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('\n  DATABASE_URL is not set — check .env.local.\n');
  process.exit(1);
}

const SALT_ROUNDS = 12;
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  INSERT INTO admins (username, password_hash)
  VALUES (${username}, ${passwordHash})
  ON CONFLICT (lower(username))
  DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()
  RETURNING id, username, created_at`;

console.log(`\n  ✓ Admin "${rows[0].username}" saved (id ${rows[0].id}).\n`);
