/* ═══════════════════════════════════════════════════════════
   PIU Commencement 2026 — Authentication API
     POST /api/auth/login   → verify credentials, set cookie
     POST /api/auth/logout  → clear cookie
     GET  /api/auth/check   → return { authenticated: bool }

   Credentials come from the `admins` table in Neon (see
   migrations/002_add_admins.sql). Manage admins with
   scripts/add-admin.js.

     SESSION_SECRET   (cookie signing secret, env var)
   ═══════════════════════════════════════════════════════════ */
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

// Lazy Neon client — created on first use so a missing DATABASE_URL
// can never crash the server at import time.
let _sql;
function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

// ── Session store (in-memory for local dev) ──────────────
// For Vercel (serverless) we use a signed cookie approach instead.
const sessions = new Map();

const COOKIE_NAME   = 'piu_session';
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours

function getSecret() {
  return process.env.SESSION_SECRET || 'piu-commencement-2026-default-secret';
}

// Create an HMAC signature for a value
function sign(value) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(value)
    .digest('base64url');
}

// Verify a signed cookie value — returns the original value or null
function unsign(signedValue) {
  if (!signedValue || !signedValue.includes('.')) return null;
  const idx = signedValue.lastIndexOf('.');
  const value = signedValue.slice(0, idx);
  const sig   = signedValue.slice(idx + 1);
  const expected = sign(value);
  // Timing-safe comparison
  if (sig.length !== expected.length) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (!crypto.timingSafeEqual(a, b)) return null;
  return value;
}

// ── Cookie helpers ───────────────────────────────────────
function setSessionCookie(res, token) {
  const signed = `${token}.${sign(token)}`;
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${signed}; ` +
    `HttpOnly; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE / 1000}` +
    (process.env.NODE_ENV === 'production' ? '; Secure' : '')
  ]);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  ]);
}

function getCookieValue(req) {
  // Works with both cookie-parser (req.cookies) and raw header parsing
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  const header = req.headers.cookie || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Public: check if a request is authenticated ──────────
export function isAuthenticated(req) {
  const raw = getCookieValue(req);
  if (!raw) return false;
  const token = unsign(raw);
  if (!token) return false;
  // Check the token exists in our in-memory store
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

// ── Handler ──────────────────────────────────────────────
export default async function handler(req, res) {
  // Determine the action from the URL path
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.pathname.replace(/^\/api\/auth\/?/, '').replace(/\/$/, '');

  try {
    // ── LOGIN ──────────────────────────────────────────
    if (action === 'login' && req.method === 'POST') {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Look up the admin by username (case-insensitive).
      const rows = await db()`
        SELECT id, username, password_hash, is_active
        FROM admins
        WHERE lower(username) = lower(${username})
        LIMIT 1`;

      const admin = rows[0];

      // Always run bcrypt.compare, even with no matching row, against a
      // dummy hash — keeps response time consistent so an attacker can't
      // tell "unknown user" from "wrong password" via timing.
      const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO1ynlNM3.EhTgkm.QCFYS0.Tm.6NwXCa';
      const passwordMatch = await bcrypt.compare(password, admin?.password_hash || DUMMY_HASH);

      if (!admin || !admin.is_active || !passwordMatch) {
        // Small delay to prevent timing attacks
        await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Create session
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, {
        user: admin.username,
        adminId: admin.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + COOKIE_MAX_AGE,
      });

      setSessionCookie(res, token);
      return res.status(200).json({ success: true, user: admin.username });
    }

    // ── LOGOUT ─────────────────────────────────────────
    if (action === 'logout' && req.method === 'POST') {
      const raw = getCookieValue(req);
      if (raw) {
        const token = unsign(raw);
        if (token) sessions.delete(token);
      }
      clearSessionCookie(res);
      return res.status(200).json({ success: true });
    }

    // ── CHECK ──────────────────────────────────────────
    if (action === 'check' && req.method === 'GET') {
      return res.status(200).json({ authenticated: isAuthenticated(req) });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Auth API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
