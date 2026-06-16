-- =============================================================================
-- 003_alter_leads_add_affiliate_columns.sql
-- Extends the existing "leads" table with affiliate-portal columns.
-- DOES NOT drop, rename, or modify any existing column.
-- Existing BD-team leads remain valid throughout; all new columns are nullable.
--
-- ─── WHAT CHANGES AND WHY ────────────────────────────────────────────────────
--
-- 1. LeadStatus enum — EXPANDED (non-destructive ADD VALUE)
--    Existing values kept: INTERESTED, NOT_INTERESTED, NO_RESPONSE,
--    FOLLOW_UP, PENDING_DECISION.
--    New values added:     SUBMITTED, ACCEPTED, QUOTATION_SENT,
--    NOT_RESPONDING, MEETING_PENDING, MEETING_DONE, ONBOARDED, REJECTED.
--
--    • SUBMITTED   — affiliate has submitted; awaiting admin review.
--    • ACCEPTED    — admin has accepted into the active pipeline.
--    • QUOTATION_SENT / NOT_RESPONDING / MEETING_PENDING / MEETING_DONE /
--      FOLLOW_UP (pre-existing) / ONBOARDED / REJECTED — pipeline stages.
--    • NOT_RESPONDING is a new value (spec's "not_responding"). The existing
--      NO_RESPONSE value (used by BD team) is preserved and kept distinct.
--
-- 2. lead_type column collision — RESOLVED WITHOUT RENAMING
--    The existing "lead_type" column stores LeadType (COLD / HOT / WARM).
--    Part B of the spec introduces a field also called "lead_type" but with
--    entirely different values (need_quotation / interested / urgent).
--    These are categorically different: temperature vs. intent.
--
--    Resolution: the spec's field is stored as "lead_intent" with a new
--    "LeadIntent" enum. The existing "lead_type" column is untouched.
--    In the Prisma schema, map this as: leadIntent  LeadIntent?  @map("lead_intent")
--    On the affiliate Add Lead form, the UI label is "Lead Type" per spec;
--    the DB column name is lead_intent.
--
-- 3. Column name discrepancy: spec uses "email"/"phone"; DB has
--    "email_address"/"phone_number". The uniqueness guard (migration 004)
--    targets the actual column names.
--
-- 4. affiliate_id is nullable: NULL = lead came from internal BD team.
--    Non-NULL = affiliate-submitted lead; drives the commission attribution.
--
-- ─────────────────────────────────────────────────────────────────────────────
--
-- ⚠ ALTER TYPE ... ADD VALUE statements CANNOT run inside a transaction
--   block in PostgreSQL < 12. In PG 12+ they can, but only if the value
--   doesn't already exist. The IF NOT EXISTS guard handles re-runs safely.
--   If your database is < PG 12, run the ALTER TYPE lines outside this BEGIN
--   block, then run the rest inside a fresh transaction.
-- =============================================================================

-- ── New enum types ────────────────────────────────────────────────────────────

-- Spec's "lead_type" field (intent). Named LeadIntent here to avoid collision
-- with the existing LeadType enum (COLD/HOT/WARM) on leads.lead_type.
CREATE TYPE "LeadIntent" AS ENUM (
  'NEED_QUOTATION',  -- "Need quotation" in the UI
  'INTERESTED',      -- "Interested in service"
  'URGENT'           -- "Urgently needed service"
);

CREATE TYPE "ProjectStatus" AS ENUM (
  'ONGOING',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "LeadSource" AS ENUM (
  'MANUAL',       -- affiliate added via the portal Add Lead form
  'PUBLIC_FORM'   -- submitted through the affiliate's public /r/<code> link
);

-- ── Expand existing LeadStatus enum ──────────────────────────────────────────
-- Non-destructive. Existing rows keep their current values.
-- Run outside a transaction if on Postgres < 12.

ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'QUOTATION_SENT';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'NOT_RESPONDING';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'MEETING_PENDING';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'MEETING_DONE';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'ONBOARDED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- ── Add new columns to leads ──────────────────────────────────────────────────

BEGIN;

ALTER TABLE leads
  -- Managed reference dropdowns (spec: industry_id, service_type_id)
  ADD COLUMN IF NOT EXISTS industry_id      TEXT          REFERENCES industries(id)   ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_type_id  TEXT          REFERENCES service_types(id) ON DELETE SET NULL,

  -- Optional reference amount from the affiliate's Add Lead form
  ADD COLUMN IF NOT EXISTS reference_amount NUMERIC(12, 2),

  -- Spec's "lead_type" field; stored as lead_intent to avoid collision
  -- with the existing lead_type column (COLD/HOT/WARM). See header above.
  ADD COLUMN IF NOT EXISTS lead_intent      "LeadIntent",

  -- Project status for onboarded leads (admin-controlled only)
  ADD COLUMN IF NOT EXISTS project_status   "ProjectStatus",

  -- Owning affiliate (attribution for commission). NULL = internal BD lead.
  -- Attribution is permanent: never auto-reassigned after first submission.
  ADD COLUMN IF NOT EXISTS affiliate_id     TEXT          REFERENCES affiliates(id) ON DELETE SET NULL,

  -- How the lead entered the system
  ADD COLUMN IF NOT EXISTS source           "LeadSource",

  -- Deal value captured at onboarding; commission = deal_value × 0.15
  ADD COLUMN IF NOT EXISTS deal_value       NUMERIC(12, 2),

  -- Admin who moved the lead from SUBMITTED → ACCEPTED
  ADD COLUMN IF NOT EXISTS accepted_by      TEXT          REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamp when status was set to ONBOARDED (starts the 25-day commission hold)
  ADD COLUMN IF NOT EXISTS onboarded_at     TIMESTAMPTZ;

COMMIT;
