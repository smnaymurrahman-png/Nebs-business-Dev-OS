-- =============================================================================
-- 005_create_lead_activity.sql
-- Per-lead activity log: admin notes + automatic status-change history.
-- Admin/BD only write here; affiliates read their own lead's log (read-only).
-- =============================================================================

BEGIN;

CREATE TYPE "LeadActivityType" AS ENUM (
  'NOTE',                   -- manual note added by admin
  'STATUS_CHANGE',          -- lead_status changed
  'PROJECT_STATUS_CHANGE'   -- project_status changed
);

CREATE TABLE IF NOT EXISTS lead_activity (
  id             TEXT                NOT NULL PRIMARY KEY,
  lead_id        TEXT                NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type           "LeadActivityType"  NOT NULL,
  -- Populated for STATUS_CHANGE and PROJECT_STATUS_CHANGE; null for NOTE
  from_status    TEXT,
  to_status      TEXT,
  -- Populated for NOTE; null for status changes
  note           TEXT,
  -- Admin/BD user who created this entry
  created_by     TEXT                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Not using updatedAt: activity log entries are immutable
  created_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Index for fast per-lead retrieval (timeline view)
CREATE INDEX IF NOT EXISTS lead_activity_lead_id_idx
  ON lead_activity (lead_id, created_at DESC);

COMMIT;
