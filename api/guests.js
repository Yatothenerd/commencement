/* ═══════════════════════════════════════════════════════════
   PIU Commencement 2026 — Guests admin API (CRUD)
     GET    /api/guests            -> [ {id,name,role,company,urlCode,status,createdAt}, ... ]
     POST   /api/guests            -> create  (body: {name, role, company, status})
     PATCH  /api/guests?id=123     -> update  (body: any of name/role/company/status)
     DELETE /api/guests?id=123     -> delete

   Secret comes from the DATABASE_URL env var. Write operations can be
   protected with an optional ADMIN_TOKEN env var (sent as x-admin-token).
   ═══════════════════════════════════════════════════════════ */
import { neon } from '@neondatabase/serverless';

// Lazy Neon client — created on first use so a missing DATABASE_URL
// can never crash the server at import time.
let _sql;
function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

// Returns true if the request is allowed to write.
function authorized(req) {
  const required = process.env.ADMIN_TOKEN;
  if (!required) return true;                 // protection not configured
  return req.headers['x-admin-token'] === required;
}

export default async function handler(req, res) {
  try {
    // ── List ───────────────────────────────────────────────
    if (req.method === 'GET') {
      const rows = await db()`
        SELECT id, name, role, company,
               url_code AS "urlCode", status,
               created_at AS "createdAt"
        FROM guests
        ORDER BY created_at`;
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(rows);
    }

    // ── Writes require authorization ───────────────────────
    if (!authorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ── Create ─────────────────────────────────────────────
    if (req.method === 'POST') {
      const { name, role, company, status } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }
      const rows = await db()`
        INSERT INTO guests (name, role, company, status)
        VALUES (${String(name).trim()},
                ${role || null},
                ${company || null},
                ${status || 'pending'})
        RETURNING id, name, role, company,
                  url_code AS "urlCode", status,
                  created_at AS "createdAt"`;
      return res.status(201).json(rows[0]);
    }

    // ── Update (partial) ───────────────────────────────────
    if (req.method === 'PATCH') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const b = req.body || {};
      // `?? null` keeps '' (clear a field) but turns undefined into null,
      // and COALESCE then leaves untouched fields unchanged.
      const _name    = b.name    ?? null;
      const _role    = b.role    ?? null;
      const _company = b.company ?? null;
      const _status  = b.status  ?? null;

      const rows = await db()`
        UPDATE guests SET
          name    = COALESCE(${_name}, name),
          role    = COALESCE(${_role}, role),
          company = COALESCE(${_company}, company),
          status  = COALESCE(${_status}, status),
          updated_at = now()
        WHERE id = ${id}
        RETURNING id, name, role, company,
                  url_code AS "urlCode", status,
                  created_at AS "createdAt"`;

      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(rows[0]);
    }

    // ── Delete ─────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id is required' });
      await db()`DELETE FROM guests WHERE id = ${id}`;
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    // Unique-violation (duplicate name or code) -> 409.
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Duplicate name' });
    }
    console.error('guests API error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
