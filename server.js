/* ═══════════════════════════════════════════════════════════
   Local dev server for Commencement 2026.
   Serves the static site AND the /api routes against Neon.

   Run:  npm install   then   npm run dev
   Open: http://localhost:3000/admin   (or /admin.html)
   ═══════════════════════════════════════════════════════════ */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env BEFORE importing the API handlers.
dotenv.config({ path: join(__dirname, '.env.local') });

const app = express();
app.use(express.json());

// Load API handlers defensively so a problem here can never blank the site.
let guestsHandler, guestHandler;
try {
  ({ default: guestsHandler } = await import('./api/guests.js'));
  ({ default: guestHandler } = await import('./api/guest.js'));
} catch (err) {
  console.error('Failed to load API handlers:', err);
}

const apiGuard = (h) => (req, res) =>
  h ? h(req, res) : res.status(500).json({ error: 'API handler failed to load' });

app.all('/api/guests', apiGuard(guestsHandler));
app.all('/api/guest', apiGuard(guestHandler));

// Friendly routes
app.get('/', (req, res) => res.sendFile(join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(join(__dirname, 'admin.html')));

// Short invitation links:  /123456  ->  invitation page (reads the code)
app.get(/^\/\d{6}$/, (req, res) => res.sendFile(join(__dirname, 'index.html')));

// Static files (css, js, components, images, *.html)
app.use(express.static(__dirname));

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`\n  Commencement — running locally`);
  console.log(`  Invitation : http://localhost:${port}/`);
  console.log(`  Admin      : http://localhost:${port}/admin\n`);

  // ── Neon health check ──────────────────────────────
  if (!process.env.DATABASE_URL) {
    console.warn('  ⚠  DATABASE_URL is not set — check .env.local in this folder.\n');
    return;
  }
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT count(*)::int AS n FROM guests`;
    console.log(`  ✓ Neon connected — ${rows[0].n} guest(s) in the database.\n`);
  } catch (err) {
    console.error('  ✗ Neon check failed:', err.message);
    if (/relation .*guests.* does not exist/i.test(err.message)) {
      console.error('    → The "guests" table is missing. Run schema.sql in the Neon SQL editor.\n');
    } else {
      console.error('    → Verify your DATABASE_URL in .env.local.\n');
    }
  }
});
