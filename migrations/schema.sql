-- ════════════════════════════════════════════════════════════
-- Commencement 2026 — Database Schema (Neon / PostgreSQL)
-- Scope: Guests only (mirrors the current localStorage model)
-- ════════════════════════════════════════════════════════════

-- RSVP status values used by the admin dashboard.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rsvp_status') THEN
    CREATE TYPE rsvp_status AS ENUM ('pending', 'confirmed', 'declined');
  END IF;
END$$;

-- Random 6-digit code ('000000'–'999999') for invite links.
CREATE OR REPLACE FUNCTION gen_url_code()
RETURNS CHAR(6) AS $$
    SELECT lpad((floor(random() * 1000000))::int::text, 6, '0');
$$ LANGUAGE sql VOLATILE;

CREATE TABLE IF NOT EXISTS guests (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT        NOT NULL,
    role        TEXT,                              -- guest's position/title (optional)
    company     TEXT,                              -- shown under the position on the card
    url_code    CHAR(6)     NOT NULL DEFAULT gen_url_code(),
    status      rsvp_status NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate guests (the app blocks same-name entries, case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS guests_name_lower_key
    ON guests (lower(name));

-- Fast filtering by RSVP status (the dashboard filters/segments by status).
CREATE INDEX IF NOT EXISTS guests_status_idx
    ON guests (status);

-- Unique invite code per guest.
CREATE UNIQUE INDEX IF NOT EXISTS guests_url_code_key
    ON guests (url_code);

-- Keep updated_at current on every change.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guests_set_updated_at ON guests;
CREATE TRIGGER guests_set_updated_at
    BEFORE UPDATE ON guests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
