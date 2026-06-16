-- =============================================================================
-- 007_create_affiliate_meetings.sql
-- Affiliate-initiated meeting requests and admin-scheduled meetings.
--
-- TABLE NAME: affiliate_meetings (not "meetings")
-- ─────────────────────────────────────────────────────────────────────────────
-- The existing "meetings" table (@@map("meetings") in Prisma) is the internal
-- BD team's standalone meeting scheduler with priorityLevel and assignees.
-- Part B's "meetings" entity is a completely different concept: it ties a
-- meeting to a lead and an affiliate, carries a request/approval workflow,
-- and has an auto-syncing result that drives lead status changes.
--
-- Naming it "affiliate_meetings" avoids the collision and makes the
-- distinction explicit. When adding this to prisma/schema.prisma, use:
--   model AffiliateMeeting { ... @@map("affiliate_meetings") }
-- =============================================================================

BEGIN;

CREATE TYPE "MeetingLocationType" AS ENUM (
  'ONLINE',
  'OFFLINE'
);

CREATE TYPE "MeetingRequestStatus" AS ENUM (
  'REQUESTED',   -- affiliate has submitted a meeting request
  'APPROVED',    -- admin has acknowledged (intermediate step)
  'SCHEDULED',   -- admin has confirmed date/time/attendees; invites sent
  'CANCELLED'
);

CREATE TYPE "MeetingResult" AS ENUM (
  'NOT_INTERESTED',      -- → lead status REJECTED
  'QUOTATION_SENT',      -- → lead status QUOTATION_SENT
  'ONBOARDED',           -- → lead status ONBOARDED + commission event
  'NEED_ANOTHER_MEETING' -- → prompt another meeting; lead stays in pipeline
);

CREATE TABLE IF NOT EXISTS affiliate_meetings (
  id                TEXT                    PRIMARY KEY,
  lead_id           TEXT                    NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  -- The affiliate who owns the lead / requested this meeting
  affiliate_id      TEXT                    NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  topic             TEXT                    NOT NULL,
  scheduled_at      TIMESTAMPTZ,
  location_type     "MeetingLocationType",
  -- One of these will be non-null depending on location_type
  meeting_link      TEXT,
  meeting_location  TEXT,
  request_status    "MeetingRequestStatus"  NOT NULL DEFAULT 'REQUESTED',
  -- Set by admin after the meeting has occurred; triggers lead status auto-sync
  result            "MeetingResult",
  -- Admin who scheduled/confirmed the meeting
  created_by        TEXT                    REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  -- Conditional constraint: online meetings need a link; offline need a location.
  -- Enforced at app level (not DB) since Postgres CHECK constraints on NULLs
  -- require more verbose expressions and location_type may be set after creation.
  CONSTRAINT meeting_link_or_location CHECK (
    location_type IS NULL
    OR (location_type = 'ONLINE'  AND meeting_link     IS NOT NULL)
    OR (location_type = 'OFFLINE' AND meeting_location IS NOT NULL)
  )
);

-- Fast lookup: all meetings for a given lead
CREATE INDEX IF NOT EXISTS affiliate_meetings_lead_id_idx
  ON affiliate_meetings (lead_id);

-- Fast lookup: all meetings for a given affiliate
CREATE INDEX IF NOT EXISTS affiliate_meetings_affiliate_id_idx
  ON affiliate_meetings (affiliate_id);

COMMIT;
