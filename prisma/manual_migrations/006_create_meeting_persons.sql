-- =============================================================================
-- 006_create_meeting_persons.sql
-- Admin-managed list of people who can be added to meetings.
-- These people do NOT have a login. They receive email invites only.
-- Spec seed list: SM Naymur Rahman Nabil, Aminul Haq Sayem,
-- Tawhid Ur Rahman, Ashfaquzzaman Nayem, MD Mohosin Mallik,
-- Rokunul Islam Joy, Shahariyar Nafis, Eren Zaman.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS meeting_persons (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the initial list from the spec.
-- IDs are stable slugs so re-running with ON CONFLICT is safe.
INSERT INTO meeting_persons (id, name, email, active) VALUES
  ('mp_nabil',    'SM Naymur Rahman Nabil',  'nabil@nebs.com',   true),
  ('mp_sayem',    'Aminul Haq Sayem',         'sayem@nebs.com',   true),
  ('mp_tawhid',   'Tawhid Ur Rahman',         'tawhid@nebs.com',  true),
  ('mp_nayem',    'Ashfaquzzaman Nayem',      'nayem@nebs.com',   true),
  ('mp_mohosin',  'MD Mohosin Mallik',        'mohosin@nebs.com', true),
  ('mp_joy',      'Rokunul Islam Joy',        'joy@nebs.com',     true),
  ('mp_nafis',    'Shahariyar Nafis',         'nafis@nebs.com',   true),
  ('mp_eren',     'Eren Zaman',               'eren@nebs.com',    true)
ON CONFLICT (id) DO UPDATE SET
  name   = EXCLUDED.name,
  email  = EXCLUDED.email,
  active = EXCLUDED.active;

-- Update the placeholder emails above with real addresses before running.
-- The email column is used for meeting invite delivery.

COMMIT;
