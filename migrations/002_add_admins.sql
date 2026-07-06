-- ════════════════════════════════════════════════════════════
-- Migration 002 — add `admins` table (Neon / PostgreSQL)
--   Supports multiple admin logins instead of a single
--   ADMIN_USER / ADMIN_PASSWORD_HASH pair in env vars.
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admins (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,          -- bcrypt hash, see scripts/hash-password.js
    is_active     BOOLEAN     NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usernames are matched case-insensitively; enforce that at the DB level too.
CREATE UNIQUE INDEX IF NOT EXISTS admins_username_lower_key
    ON admins (lower(username));

-- Reuses the set_updated_at() trigger function already defined in schema.sql.
DROP TRIGGER IF EXISTS admins_set_updated_at ON admins;
CREATE TRIGGER admins_set_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ── Seed the first admin from the old env-based credentials ──
-- Optional: if you were using ADMIN_USER / ADMIN_PASSWORD_HASH before,
-- migrate that one account into the table so nobody gets locked out.
-- Replace the values below with your existing env values, or skip this
-- and use scripts/add-admin.js to create admins going forward.
--
-- INSERT INTO admins (username, password_hash)
-- VALUES ('admin', '$2b$12$...paste-existing-ADMIN_PASSWORD_HASH-here...')
-- ON CONFLICT (lower(username)) DO NOTHING;
