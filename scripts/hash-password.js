#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   Hash a password with bcrypt and print the result.
   Usage:  node scripts/hash-password.js  <password>
   Then paste the output into .env.local as ADMIN_PASSWORD_HASH.
   ═══════════════════════════════════════════════════════════ */
import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('\n  Usage:  node scripts/hash-password.js <password>\n');
  process.exit(1);
}

const SALT_ROUNDS = 12;
const hash = await bcrypt.hash(password, SALT_ROUNDS);

console.log('\n  ✓ Bcrypt hash generated (12 rounds):\n');
console.log(`  ADMIN_PASSWORD_HASH=${hash}\n`);
console.log('  Paste the line above into your .env.local file.\n');
