-- =============================================================================
-- 013_create_notifications.sql
-- In-app notification inbox for affiliates and internal admins.
--
-- recipient_type / recipient_id are a POLYMORPHIC pair:
--   AFFILIATE → recipient_id references affiliates(id)
--   ADMIN     → recipient_id references users(id)
-- No DB-level FK is set on recipient_id because Postgres cannot express
-- polymorphic foreign keys. Referential integrity is enforced by the app.
--
-- The "type" column is a free-form event key (string), not an enum,
-- so new event types can be added without a schema migration.
-- Suggested type values (from spec A8):
--   "lead.accepted"          — affiliate whose lead was accepted
--   "lead.rejected"          — affiliate whose lead was rejected
--   "payout.approved"        — affiliate whose payout was approved
--   "payout.paid"            — affiliate whose payout was marked paid
--   "offer.published"        — all active affiliates
--   "lead.submitted"         — admin: new affiliate lead needs review
-- =============================================================================

BEGIN;

CREATE TYPE "NotificationRecipientType" AS ENUM (
  'AFFILIATE',
  'ADMIN'
);

CREATE TABLE IF NOT EXISTS notifications (
  id              TEXT                          NOT NULL PRIMARY KEY,
  recipient_type  "NotificationRecipientType"   NOT NULL,
  -- Points to affiliates.id (if AFFILIATE) or users.id (if ADMIN).
  -- No FK constraint — see header note on polymorphic associations.
  recipient_id    TEXT                          NOT NULL,
  type            TEXT                          NOT NULL,
  -- Arbitrary JSON payload: { "lead_id": "...", "message": "..." } etc.
  payload         JSONB                         NOT NULL DEFAULT '{}',
  -- null = unread; non-null = read (timestamp of when it was read)
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ                   NOT NULL DEFAULT NOW()
  -- No updated_at: notifications are immutable once created
);

-- Fast retrieval of unread notifications for a recipient
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON notifications (recipient_type, recipient_id, created_at DESC)
  WHERE read_at IS NULL;

-- Full inbox retrieval for a recipient (read + unread)
CREATE INDEX IF NOT EXISTS notifications_recipient_all_idx
  ON notifications (recipient_type, recipient_id, created_at DESC);

COMMIT;
