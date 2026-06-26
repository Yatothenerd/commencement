-- ════════════════════════════════════════════════════════════
-- Migration 001 — add `company` and `url_code` to guests (Neon / PostgreSQL)
--   • company   : free text shown under the position on the card
--   • url_code  : auto-generated 6-digit code for the invite link
-- ════════════════════════════════════════════════════════════

-- 1. Add the columns.
ALTER TABLE guests
    ADD COLUMN IF NOT EXISTS company  TEXT,
    ADD COLUMN IF NOT EXISTS url_code CHAR(6);

-- 2. Function that returns a random 6-digit code ('000000'–'999999').
CREATE OR REPLACE FUNCTION gen_url_code()
RETURNS CHAR(6) AS $$
    SELECT lpad((floor(random() * 1000000))::int::text, 6, '0');
$$ LANGUAGE sql VOLATILE;

-- 3. Backfill any existing rows with a unique code.
DO $$
DECLARE
    r          RECORD;
    new_code   CHAR(6);
BEGIN
    FOR r IN SELECT id FROM guests WHERE url_code IS NULL LOOP
        LOOP
            new_code := gen_url_code();
            EXIT WHEN NOT EXISTS (SELECT 1 FROM guests WHERE url_code = new_code);
        END LOOP;
        UPDATE guests SET url_code = new_code WHERE id = r.id;
    END LOOP;
END$$;

-- 4. Default + NOT NULL + uniqueness for new rows going forward.
ALTER TABLE guests
    ALTER COLUMN url_code SET DEFAULT gen_url_code(),
    ALTER COLUMN url_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS guests_url_code_key
    ON guests (url_code);
