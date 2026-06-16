-- =============================================================================
-- 001_create_industries_service_types.sql
-- Admin-managed lookup tables for industries and affiliate service types.
--
-- NOTE: "service_types" here is a managed TABLE (admin adds/removes rows).
--       It is completely distinct from the existing "ServiceType" Postgres
--       ENUM used by the proposals module. No naming conflict at DB level
--       (one is a TYPE, the other is a TABLE), but keep this distinction in
--       mind when writing Prisma models.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS industries (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_types (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial service types mirroring the existing ServiceType enum values
-- so the affiliate dropdown stays consistent with the BD team's proposals.
-- Admin can add more rows or deactivate these later.
INSERT INTO service_types (id, name) VALUES
  ('st_wordpress',   'WordPress'),
  ('st_fullstack',   'Full Stack'),
  ('st_uiux',        'UI/UX'),
  ('st_webflow',     'Webflow'),
  ('st_shopify',     'Shopify'),
  ('st_digmkt',      'Digital Marketing'),
  ('st_other',       'Other')
ON CONFLICT (id) DO NOTHING;

COMMIT;
