-- =============================================================================
-- 012_create_commissions.sql
-- One commission record per onboarded lead.
-- Must run after 011 (payouts) because of the payout_id FK.
--
-- Commission lifecycle (spec A7):
--   1. Lead status → ONBOARDED: app creates this record with status PENDING.
--   2. After release_date (= onboarded_at + 25 days): status moves to AVAILABLE.
--      Implement as a cron job OR compute on read using:
--        CASE WHEN NOW() >= release_date AND status = 'PENDING'
--             THEN 'AVAILABLE' ELSE status END
--   3. Affiliate requests a payout (≥ min, ≤ available balance).
--   4. Admin approves → marks paid → payout_id is set here, status → PAID.
-- =============================================================================

BEGIN;

CREATE TYPE "CommissionStatus" AS ENUM (
  'PENDING',    -- within the 25-day hold window
  'AVAILABLE',  -- hold period passed; affiliate can request withdrawal
  'PAID'        -- covered by a completed payout
);

CREATE TABLE IF NOT EXISTS commissions (
  id            TEXT                NOT NULL PRIMARY KEY,
  lead_id       TEXT                NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  affiliate_id  TEXT                NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  -- Snapshot of deal_value at the moment of onboarding (immutable thereafter)
  deal_value    NUMERIC(12, 2)      NOT NULL,
  -- Stored explicitly (currently always 0.15) so historical records are stable
  -- if the rate ever changes for future leads
  rate          NUMERIC(5, 4)       NOT NULL DEFAULT 0.15,
  -- Derived: deal_value × rate; stored for reporting without re-computation
  amount        NUMERIC(12, 2)      NOT NULL,
  status        "CommissionStatus"  NOT NULL DEFAULT 'PENDING',
  onboarded_at  TIMESTAMPTZ         NOT NULL,
  -- release_date = onboarded_at + INTERVAL '25 days'
  -- Stored explicitly so it survives any future policy changes
  release_date  TIMESTAMPTZ         NOT NULL,
  -- Set when admin marks the covering payout as PAID
  payout_id     TEXT                REFERENCES payouts(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  -- One commission per lead (a lead can only be onboarded once)
  CONSTRAINT commissions_lead_unique UNIQUE (lead_id),

  CONSTRAINT commission_amount_positive   CHECK (amount    > 0),
  CONSTRAINT commission_deal_value_positive CHECK (deal_value > 0),
  CONSTRAINT commission_rate_positive     CHECK (rate      > 0)
);

-- For computing available balance across an affiliate's commissions
CREATE INDEX IF NOT EXISTS commissions_affiliate_status_idx
  ON commissions (affiliate_id, status);

-- For the scheduled job that flips PENDING → AVAILABLE
CREATE INDEX IF NOT EXISTS commissions_release_date_idx
  ON commissions (release_date)
  WHERE status = 'PENDING';

COMMIT;
