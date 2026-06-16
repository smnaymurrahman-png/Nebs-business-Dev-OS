-- 015_affiliate_meetings_preferred_at.sql
-- Adds a preferred_at column so affiliates can express a preferred meeting time
-- separately from the admin-confirmed scheduled_at time.

ALTER TABLE affiliate_meetings
  ADD COLUMN IF NOT EXISTS preferred_at TIMESTAMPTZ;
