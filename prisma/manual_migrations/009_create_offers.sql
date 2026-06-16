-- =============================================================================
-- 009_create_offers.sql
-- Offers published by the admin team; displayed read-only to affiliates.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS offers (
  id            TEXT          PRIMARY KEY,
  service_name  TEXT          NOT NULL,
  details       TEXT          NOT NULL,
  price         NUMERIC(12,2) NOT NULL,
  -- Human-readable duration string e.g. "3 months", "1 year", "One-time"
  duration      TEXT          NOT NULL,
  -- Admin/BD user who created this offer
  author_id     TEXT          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMIT;
