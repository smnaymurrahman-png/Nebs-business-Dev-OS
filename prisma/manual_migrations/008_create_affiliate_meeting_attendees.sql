-- =============================================================================
-- 008_create_affiliate_meeting_attendees.sql
-- Junction table: who attends each affiliate meeting.
-- Each row is either a meeting_person OR an affiliate attendee (never both).
-- The owning affiliate is always added as an attendee when a meeting is
-- scheduled; additional attendees are selected from meeting_persons.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS affiliate_meeting_attendees (
  id                  TEXT        PRIMARY KEY,
  meeting_id          TEXT        NOT NULL REFERENCES affiliate_meetings(id) ON DELETE CASCADE,
  -- Exactly one of the two FK columns below must be non-null per row.
  meeting_person_id   TEXT        REFERENCES meeting_persons(id) ON DELETE CASCADE,
  affiliate_id        TEXT        REFERENCES affiliates(id)      ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce that exactly one side of the polymorphic attendee is set
  CONSTRAINT attendee_one_type_only CHECK (
    (meeting_person_id IS NOT NULL AND affiliate_id IS NULL)
    OR
    (meeting_person_id IS NULL AND affiliate_id IS NOT NULL)
  ),

  -- A meeting_person can only appear once per meeting
  CONSTRAINT unique_meeting_person_per_meeting
    UNIQUE (meeting_id, meeting_person_id),

  -- An affiliate can only appear once per meeting
  CONSTRAINT unique_affiliate_per_meeting
    UNIQUE (meeting_id, affiliate_id)
);

COMMIT;
