-- =============================================================================
-- 004_leads_uniqueness_indexes.sql
-- Uniqueness guard on normalized email and phone for the leads table.
--
-- ⚠ MANDATORY: Run this file OUTSIDE any transaction block.
--   CREATE INDEX CONCURRENTLY cannot run inside BEGIN/COMMIT.
--   If you wrap this in a transaction, Postgres will error.
--
-- ⚠ MANDATORY: Run the pre-check queries below FIRST.
--   If existing rows contain duplicate emails or phones (after normalization),
--   the index creation will fail with "could not create unique index".
--   Resolve duplicates before running this migration.
--
-- PRE-CHECK QUERIES (run these manually, fix any rows returned):
-- ─────────────────────────────────────────────────────────────────────────────
--   -- Duplicate normalized emails (leads table uses camelCase columns):
--   SELECT lower("emailAddress") AS normalized_email, count(*), array_agg(id)
--   FROM leads
--   GROUP BY lower("emailAddress")
--   HAVING count(*) > 1;
--
--   -- Duplicate normalized phones:
--   SELECT regexp_replace("phoneNumber", '\D', '', 'g') AS normalized_phone, count(*), array_agg(id)
--   FROM leads
--   GROUP BY regexp_replace("phoneNumber", '\D', '', 'g')
--   HAVING count(*) > 1;
-- ─────────────────────────────────────────────────────────────────────────────
--
-- NORMALIZATION RULES (leads table uses Prisma camelCase column names):
--   email   → lower("emailAddress")                               e.g. "User@NEBS.com" = "user@nebs.com"
--   phone   → regexp_replace("phoneNumber", '\D', '', 'g')        strips all non-digit chars
--             e.g. "+880 1711-123456" = "8801711123456"
--
-- CONCURRENTLY means the index builds without holding a table lock.
-- On a small dev database this is instant; on a large table it may take minutes.
-- The database remains fully readable/writable while the index builds.
--
-- IF NOT EXISTS makes this safe to re-run.
-- =============================================================================

-- DO NOT WRAP IN BEGIN/COMMIT.

-- Partial index: only enforce uniqueness where emailAddress looks like a real email
-- (contains '@'). Rows with placeholder values like 'n/a', 'none', '-' are excluded.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS leads_email_normalized_unique
  ON leads (lower("emailAddress"))
  WHERE "emailAddress" LIKE '%@%';

-- Partial index: only enforce uniqueness where phoneNumber has ≥ 7 digits.
-- Placeholder values like '0', 'n/a', or short strings are excluded.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS leads_phone_normalized_unique
  ON leads (regexp_replace("phoneNumber", '\D', '', 'g'))
  WHERE length(regexp_replace("phoneNumber", '\D', '', 'g')) >= 7;
