-- =============================================================================
-- 011_create_payouts.sql
-- Affiliate payout requests and their admin-approval lifecycle.
-- Must run after 010 (payout_methods).
--
-- This system TRACKS payout status only. It does NOT move real money.
-- The admin pays manually outside the system, then marks the record Paid.
--
-- Minimum payout: ৳1,000 BDT / $15 USD — enforced at app level.
-- The DB stores the amount but does not enforce currency-aware minimums.
-- =============================================================================

BEGIN;

CREATE TYPE "PayoutStatus" AS ENUM (
  'REQUESTED',  -- affiliate has submitted a withdrawal request
  'APPROVED',   -- admin has approved; pending manual payment
  'PAID',       -- admin has marked as paid; commissions move to PAID
  'REJECTED'    -- admin has rejected the request
);

CREATE TABLE IF NOT EXISTS payouts (
  id                 TEXT            NOT NULL PRIMARY KEY,
  affiliate_id       TEXT            NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  payout_method_id   TEXT            NOT NULL REFERENCES payout_methods(id) ON DELETE RESTRICT,
  amount             NUMERIC(12, 2)  NOT NULL,
  status             "PayoutStatus"  NOT NULL DEFAULT 'REQUESTED',
  reject_reason      TEXT,
  -- Admin who approved or rejected; null until action is taken
  processed_by       TEXT            REFERENCES users(id) ON DELETE SET NULL,
  -- Timestamp when status was set to PAID
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT payout_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS payouts_affiliate_id_idx
  ON payouts (affiliate_id);

CREATE INDEX IF NOT EXISTS payouts_status_idx
  ON payouts (status);

COMMIT;
