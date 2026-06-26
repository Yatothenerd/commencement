/* ═══════════════════════════════════════════════════════════
   PIU Commencement 2026 — Guest lookup API
   GET /api/guest?c=######  ->  { name, role, company }
   Reads the Neon connection string from the DATABASE_URL env var.
   NEVER hard-code the connection string here.
   ═══════════════════════════════════════════════════════════ */
import { neon } from '@neondatabase/serverless';

// Lazy Neon client (created on first use, never at import time).
let _sql;
function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

export default async function handler(req, res) {
  const code = String(req.query.c || '').trim();

  // Only allow a 6-digit code.
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  try {
    const rows = await db()`
      SELECT name, role, company
      FROM guests
      WHERE url_code = ${code}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('guest lookup failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
