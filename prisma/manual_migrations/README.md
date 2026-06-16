# Affiliate OS — Manual Migrations

These SQL files extend the nebs-bd-OS database with the Affiliate Portal schema (Phase 1).
They are raw SQL, not Prisma migration files. Run them manually against the target database
in the numbered order. Do not skip steps — foreign key dependencies make order mandatory.

## How to apply

```bash
# Set your connection string
export DB="postgresql://user:password@host:5432/dbname"

# Run 001–003, 005–013 inside the shell loop (these support transactions)
for f in 001 002 003 005 006 007 008 009 010 011 012 013; do
  echo "── Applying $f ──"
  psql "$DB" -f prisma/manual_migrations/${f}_*.sql
done

# Run 004 separately — CONCURRENTLY indexes cannot run inside a transaction
echo "── Applying 004 (uniqueness indexes) ──"
echo "   First run the pre-check queries in the file and resolve any duplicates."
psql "$DB" -f prisma/manual_migrations/004_leads_uniqueness_indexes.sql
```

Or apply them one at a time via Neon/Supabase SQL editor.

## File list and dependency order

| File | Creates / Alters | Depends on |
|---|---|---|
| 001 | `industries`, `service_types` | — |
| 002 | `affiliates` | `users` (existing) |
| 003 | Alters `leads` (new columns + enum expansion) | `industries`, `service_types`, `affiliates`, `users` |
| 004 | Unique indexes on `leads` (email, phone) | `leads` |
| 005 | `lead_activity` | `leads`, `users` |
| 006 | `meeting_persons` | — |
| 007 | `affiliate_meetings` | `leads`, `affiliates`, `users` |
| 008 | `affiliate_meeting_attendees` | `affiliate_meetings`, `meeting_persons`, `affiliates` |
| 009 | `offers` | `users` |
| 010 | `payout_methods` | `affiliates` |
| 011 | `payouts` | `affiliates`, `payout_methods`, `users` |
| 012 | `commissions` | `leads`, `affiliates`, `payouts` |
| 013 | `notifications` | — (polymorphic; no FK constraint) |

## After applying

1. Update `prisma/schema.prisma` with the new models (Phase 2 prompt).
2. Run `npm run db:generate` to regenerate the Prisma client.
   Do NOT run `prisma db push` — it will try to reconcile and may alter columns.
3. Update `meeting_persons` seed email addresses with real values before Phase 5.

## Key decisions documented in the migration files

- **`lead_intent` vs `lead_type`** — see 003 header. The spec field named `lead_type`
  (need_quotation / interested / urgent) is stored as `lead_intent` to avoid
  collision with the existing `lead_type` column (COLD / HOT / WARM).
- **`affiliate_meetings` vs `meetings`** — see 007 header. The existing internal
  `meetings` table is untouched.
- **`lead_status` column kept** — the spec's `status` field maps to the existing
  `lead_status` column, now expanded with 8 new enum values.
