-- =============================================================================
-- 002_create_affiliates.sql
-- The affiliates table. References the existing "users" table (approved_by FK).
-- Must run after 001 (no dependency there, but enforces run order convention).
-- =============================================================================

BEGIN;

CREATE TYPE "AffiliateStatus" AS ENUM (
  'PENDING',     -- self-registered, awaiting admin approval
  'ACTIVE',      -- approved; can log in and submit leads
  'SUSPENDED',   -- temporarily blocked; existing leads/ownership intact
  'BANNED'       -- permanently blocked; existing leads/ownership intact
);

CREATE TABLE IF NOT EXISTS affiliates (
  id              TEXT             PRIMARY KEY,
  full_name       TEXT             NOT NULL,
  email           TEXT             NOT NULL,
  phone           TEXT             NOT NULL,
  password_hash   TEXT             NOT NULL,
  -- Auto-generated slug used in the public lead-capture URL: /r/<affiliate_code>
  affiliate_code  TEXT             NOT NULL,
  status          "AffiliateStatus" NOT NULL DEFAULT 'PENDING',
  -- FK to internal nebs-bd-OS users table (the admin who approved this account)
  approved_by     TEXT             REFERENCES users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT affiliates_email_unique UNIQUE (email),
  CONSTRAINT affiliates_code_unique  UNIQUE (affiliate_code)
);

COMMIT;
