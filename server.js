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
import cookieParser from 'cookie-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env BEFORE importing the API handlers.
dotenv.config({ path: join(__dirname, '.env.local') });

const app = express();
app.use(express.json());
app.use(cookieParser());

// Load API handlers defensively so a problem here can never blank the site.
let guestsHandler, guestHandler, authHandler, isAuthenticated;
try {
  ({ default: guestsHandler } = await import('./api/guests.js'));
  ({ default: guestHandler } = await import('./api/guest.js'));
  ({ default: authHandler, isAuthenticated } = await import('./api/auth.js'));
} catch (err) {
  console.error('Failed to load API handlers:', err);
}

const apiGuard = (h) => (req, res) =>
  h ? h(req, res) : res.status(500).json({ error: 'API handler failed to load' });

app.all('/api/guests', apiGuard(guestsHandler));
app.all('/api/guest', apiGuard(guestHandler));

// ── Auth API routes ──────────────────────────────────────
app.all('/api/auth/:action', (req, res) => {
  // Patch req.url so the handler can parse the action from the path
  req.url = `/api/auth/${req.params.action}`;
  apiGuard(authHandler)(req, res);
});

// ── Auth-guarded admin route ─────────────────────────────
app.get('/admin', (req, res) => {
  if (isAuthenticated && !isAuthenticated(req)) {
    return res.redirect('/login');
  }
  res.sendFile(join(__dirname, 'admin.html'));
});

// ── Login page ───────────────────────────────────────────
app.get('/login', (req, res) => {
  res.sendFile(join(__dirname, 'login.html'));
});

// Friendly routes
app.get('/', (req, res) => res.sendFile(join(__dirname, 'index.html')));

// Short invitation links:  /123456  ->  invitation page (reads the code)
app.get(/^\/\d{6}$/, (req, res) => res.sendFile(join(__dirname, 'index.html')));

// Static files (css, js, components, images, *.html)
app.use(express.static(__dirname));

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`\n  Commencement — running locally`);
  console.log(`  Invitation : http://localhost:${port}/`);
  console.log(`  Login      : http://localhost:${port}/login`);
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
