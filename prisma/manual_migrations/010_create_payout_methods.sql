-- =============================================================================
-- 010_create_payout_methods.sql
-- Stores an affiliate's saved payout destinations.
-- Each method stores type-specific details as JSONB.
--
-- JSONB shape by type:
--   bkash:         { "number": "01XXXXXXXXX" }
--   nagad:         { "number": "01XXXXXXXXX" }
--   bank:          { "bank_name": "...", "account_number": "...",
--                    "account_name": "...", "branch": "...", "district": "..." }
--   international: { "bank_name": "...", "account_name": "...",
--                    "account_number": "...", "routing_number": "...",
--                    "swift_code": "...", "country": "..." }
-- =============================================================================

BEGIN;

CREATE TYPE "PayoutMethodType" AS ENUM (
  'BKASH',
  'NAGAD',
  'BANK',          -- local bank transfer (Bangladesh)
  'INTERNATIONAL'  -- international wire transfer
);

CREATE TABLE IF NOT EXISTS payout_methods (
  id            TEXT                NOT NULL PRIMARY KEY,
  affiliate_id  TEXT                NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  type          "PayoutMethodType"  NOT NULL,
  -- Type-specific fields stored as JSONB for flexibility
  details       JSONB               NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payout_methods_affiliate_id_idx
  ON payout_methods (affiliate_id);

COMMIT;
