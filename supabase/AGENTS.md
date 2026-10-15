# Supabase

## Overview

The Postgres database behind the app, plus the one Edge Function. Clerk is the only sign in:
Supabase trusts Clerk's session token (third party auth), so the phone reads and writes directly
and row level security decides who sees which rows. Decided in
`docs/specs/0001-ai-search-and-trust/0004-supabase-database-and-clerk-link.md`.

## Key files

| File | Owns |
|---|---|
| `migrations/20261015000000_catalog.sql` | Catalog tables (airports, flights, hotels, car_rentals, destinations, deals), the two price views, read only grants, `private.roll_sample_dates()` and its daily `pg_cron` job |
| `migrations/20261015000100_account.sql` | The seven account tables (profiles, saved_destinations, trips, alerts, activity_log, recent_searches, push_tokens), their policies, `delete_user_data()` |
| `migrations/20261015000200_policy_initplan.sql` | Policies rewritten as `(select auth.jwt()) ->> 'sub'` so the advisor stays clean |
| `seed.sql` | The sample catalog, safe to run twice; ends by calling the date function |
| `tests/isolation.sql` | Two user test of the policies, grants, constraints and `delete_user_data`; wrapped in a transaction that rolls back |
| `functions/clerk-webhook/index.ts` | Deno Edge Function for Clerk's `user.deleted` event |
| `functions/_shared/clerk_webhook.ts` | The webhook's logic with the signature check and delete passed in, so Node can test it |
| `config.toml` | Local config; `[functions.clerk-webhook] verify_jwt = false` |

## Commands

```bash
supabase db push --include-seed          # apply migrations (remote project is linked)
supabase db query --linked -f supabase/tests/isolation.sql   # must end with: isolation ok
supabase db advisors --linked            # must return no results
supabase gen types typescript --linked > src/types/database.ts
supabase functions deploy clerk-webhook --no-verify-jwt --use-api   # --use-api: no Docker needed
supabase secrets set CLERK_WEBHOOK_SIGNING_SECRET=whsec_...         # once, never in .env
```

Docker is not required: run tests and queries against the linked project with `db query --linked`.

## Conventions

- Never edit a migration that is already applied. Add a new file with a later timestamp.
- Every table has row level security on. Grants start from `revoke all`, then explicit `select` or
  owner grants. Catalog tables: read only for `anon` and `authenticated`, no write policy at all.
- Account tables use `user_id text default (auth.jwt() ->> 'sub')` (Clerk ids are not UUIDs, so
  never `auth.uid()`). Policies check `(select auth.jwt()) ->> 'sub' = user_id`, update policies
  have both `using` and `with check`, and every table with an update policy also has a select policy.
- `activity_log` is append only: no delete, and only `undone_at` can be updated (column grant).
- Views use `security_invoker = true`. No `security definer` functions.
- Prices are stored once, on flights, hotels and car_rentals. Deals and destinations get theirs
  from the `deals_with_price` and `destinations_with_price` views. `source` stays `'sample'`
  until a real feed exists.
- After any schema change: regenerate `src/types/database.ts`, run the isolation test and the advisors.

## Gotchas

- Supabase's default grants on new `public` tables are wide. A new migration must revoke them
  explicitly, or `anon` can read or write the new table.
- A policy written as `(select auth.jwt() ->> 'sub')` triggers the advisor's initplan warning;
  the form that passes is `(select auth.jwt()) ->> 'sub'`.
- The Edge Function reads its secret key from the runtime (`SUPABASE_SECRET_KEYS`, falling back to
  `SUPABASE_SERVICE_ROLE_KEY`). The key must never be in the app, `.env` or an `EXPO_PUBLIC_` variable.
- `delete_user_data()` runs as `service_role` and is executable by nobody else. `service_role` has
  its own explicit grants on the account tables because default grants may be off.
- Sample flight dates move: the daily job sets `depart_date` to today plus `sample_depart_offset`
  (UTC day). Anything comparing against the sample set must not hardcode dates.
- The Deno code under `functions/clerk-webhook` is excluded from the app's `tsc` in `tsconfig.json`.
- The Clerk integration and the Supabase third party auth provider were set up in the two
  dashboards by hand; they are not in any file here.

## Related specs

- [0004 Supabase database and Clerk link](../docs/specs/0001-ai-search-and-trust/0004-supabase-database-and-clerk-link.md)
- [0001 umbrella index](../docs/specs/0001-ai-search-and-trust/index.md), shared rules for every slice

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
