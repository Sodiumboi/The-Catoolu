-- ════════════════════════════════════════════════════════════
-- UUID Column Migration
-- Promotes sheet_data->Investigator->Header->UUID into a real
-- indexed column so character routes can look up by UUID
-- without scanning the full JSONB on every request.
--
-- Run once on dev and once on production. Idempotent.
-- ════════════════════════════════════════════════════════════

-- 1. Add the column (nullable first so the backfill can run)
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS uuid TEXT;

-- 2. Backfill from the JSONB blob for all existing rows
UPDATE characters
SET uuid = sheet_data->'Investigator'->'Header'->>'UUID'
WHERE uuid IS NULL;

-- 3. Enforce NOT NULL and UNIQUE now that every row has a value
ALTER TABLE characters
  ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE characters
  ADD CONSTRAINT characters_uuid_key UNIQUE (uuid);

-- 4. Index for O(1) lookup by UUID
CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_uuid
  ON characters(uuid);

SELECT 'UUID column migration complete.' AS status;
