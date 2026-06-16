-- =============================================================================
-- 014_leads_created_by_nullable.sql
-- Allow affiliate-submitted leads to have no internal createdById.
--
-- WHY: The leads table was built for the internal BD team where every lead
-- is always created by an internal user. Affiliate-submitted leads have an
-- affiliate_id for attribution but no internal user as creator.
-- Rather than a "system bot" user hack, we simply make createdById nullable.
-- Existing BD-team leads keep their createdById unchanged.
-- =============================================================================

ALTER TABLE leads ALTER COLUMN "createdById" DROP NOT NULL;
