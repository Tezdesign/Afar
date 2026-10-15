# 0004. Supabase database and Clerk link (slice four)

**Build order**: after 0001 and 0002 (0002 is built with a device passport first), before 0003 (live prices). Where 0002 or 0003 name the old `src/data` files or the device passport, this spec replaces them when it is built, and those two specs carry a note saying so.

## Summary

Slice four moves Afar's data out of hardcoded files and into the Supabase Postgres project you created. Clerk stays the only sign in. Supabase trusts Clerk's session token, so every signed in person can read and change only their own rows, and guests can read the catalog but cannot save. The catalog is still sample data, labelled as such, but it is shaped like a future real feed, so importing real flights later changes rows and not columns. Flight search filtering moves into the database, the sample flight dates roll forward every day, and saved destinations, trips, passport, preferences, alerts, the assistant activity log, recent searches and push tokens become account tables.

## Requirements

**User stories**:
- As a traveler, I want my saved destinations, trips, passport and preferences to follow me to a new phone, so that I do not set everything up again.
- As a guest, I want to browse and search without an account and be asked to sign in only when I save something, so that I get value before I give anything.
- As a person, I want nobody else to be able to read or change my data, so that my passport country and trips stay private.
- As the engineer, I want the sample catalog to be replaceable by real API data without changing columns or screens, so that the later import is a data task.
- As someone who deletes their account, I want my data deleted too, so that nothing personal is left behind.

**Acceptance criteria** (the contract, each one independently checkable):
- **AC-1**: Migration files create every table and view in `## Feature design`, with the columns, keys and constraints listed there, and are applied to the linked Supabase project. Listing the live tables and columns from the database matches the design. Row level security is on for every table, and every column has the type, default and allowed values given in `## Feature design`.
- **AC-2**: Supabase accepts Clerk session tokens through its third party auth link. For a signed in request, the token's `sub` claim equals the Clerk user id and the database role is `authenticated`. A request with no token runs as `anon`. Every `user_id` column is text and defaults to that `sub`.
- **AC-3**: `anon` and `authenticated` can read the catalog tables and the two views. No client can change any catalog row: an insert fails with a permission error, and an update or delete changes zero rows.
- **AC-4**: A signed in person can read, insert, update and delete only their own rows in the seven account tables. They cannot read another person's rows, cannot change a row's `user_id`, and `anon` is refused on the account tables (permission denied). A database test with two test users proves each of these.
- **AC-5**: A seed file loads the current sample content with the same ids: 6 airports (each with its ISO country code), 12 flights, the hotels, cars, destinations and deals. Every catalog row has `source = 'sample'`. The files `src/data/{airports,flights,hotels,cars,deals,destinations}.ts` are removed and no screen imports them.
- **AC-6**: A daily database job sets each sample flight's dates to today plus its stored offsets, and `nights` follows. After the job runs, no flight departs before today, and the sample set still has flights departing between 20 and 60 days from today. The job calls one function that takes a base date, so a test can run it as if it were 30 days later.
- **AC-7**: Results and the no results suggestions read flights through database queries that apply the matching rules of spec 0001 (exact destination or anywhere, exact origin, month, within 3 days either side of an exact date (a 7 day span), nights within 1, direct only, strict budget, cheapest first, ties by shorter duration). `parseSearch()` is unchanged. Reason lines are worked out on the device from the returned rows. A suggestion is shown only if its own query returns at least one flight. For the same inputs, the sample set gives the same ordered results as the old on device search, checked against outputs saved from the old search before it is deleted.
- **AC-8**: Airports load once at app start, before the first screen. While they load a loading state shows. If the load fails an error state with a Retry button shows, and no screen renders with an empty airport list. `parseSearch()`, the chips and the pickers use the loaded airports.
- **AC-9**: Home ideas, the destination cards, the deal cards and flight detail read from the database. A deal's price and a destination's "from" price come from the views, so no price is typed into the app or stored twice. A city with no flight shows no "from" price.
- **AC-10**: When a guest taps the heart on a destination, the app opens the existing sign in screen and saves nothing. Any later action that saves for an account (a trip, an alert) uses the same gate. Saved, Trips and Profile keep their current guest redirect. (Select flight has no action today, and spec 0003 replaces it with an Open on Google Flights button, so it is not gated here.)
- **AC-11**: For a signed in person, a heart toggle changes the screen at once and is written to `saved_destinations`. If the write fails the heart returns to its old state and a message says so. On sign in the saved list loads from the database, and on sign out it is cleared from memory. A second device shows the same hearts after a reload. The saved and trips stores no longer use device storage. Their old device keys are removed once, and the data in them is dropped on purpose (your choice: start fresh). Fast repeated taps, and a sign out in the middle of a write, never leave a heart in the wrong state (see Key invariants).
- **AC-12**: The trips accessor creates one `trips` row, even when called twice with the same device made id, with at most one link to a catalog flight, hotel or car (none for a live flight from spec 0003, because live flights are never stored in the catalog) plus a snapshot (title, price, currency, details). After the catalog row is deleted the trip still reads correctly from its snapshot and its link is empty. No screen creates a trip yet, because Afar does not book. The Trips tab keeps its empty state until a later slice adds a way to record a trip.
- **AC-13**: The profile row holds `passport_country` (a two letter ISO code), `language` and `currency`. Spec 0002's passport store writes through to it. On sign in the profile loads and replaces the device values. If the person has no profile row, one is created from the device values and any guest passport (see Key invariants). Guests keep device values. Changing a value signed in writes it to the profile, and a failed write rolls back and says so. Creating the profile and copying the passport are safe to repeat and to run on two devices at once.
- **AC-14**: Typed accessors exist for alerts, the activity log, recent searches and push tokens, with no new screens. Alerts never hold both a destination and `anywhere`, and always set `is_demo` true. Recent searches store parsed fields only, never the typed text, and keep the newest 10 per person. A person's push token row is removed before sign out completes, while their token still works.
- **AC-15**: A Clerk webhook route verifies the raw request with Clerk's `verifyWebhook` (from `@clerk/backend/webhooks`, already installed). For a `user.deleted` event it calls one database function, `delete_user_data(user_id)`, with the Supabase secret key, which deletes that user's rows in every account table in one transaction. A failure answers 500 so Clerk retries. Running it twice is harmless. Any other event type answers 200 and does nothing. A bad signature answers 400 and deletes nothing. The secret key exists only on the server.
- **AC-16**: Any failed catalog read shows an error state with Retry (startup, Results, Home ideas, flight detail). Any failed write rolls back and says so. No screen is left blank on error. These states are built from the Figma frames. Each failure sends a `supabase_error` event with the table and the operation, and never row data or typed text.
- **AC-17**: The Supabase URL and publishable key are public config. The secret key and the Clerk webhook secret are server only. `.env.example` lists every new variable. The app stops at startup with a clear message if the URL or key is missing.

## Decision

**Chosen option**: Supabase as a direct, row level security protected data layer behind Clerk, with Zustand kept as the in app copy.

The app talks to Supabase directly with the publishable key plus the Clerk session token, rules in the database decide who sees which rows, and the only server code is one Clerk webhook route that cleans up deleted accounts.

**Implementation skills**: `supabase` (`supabase/agent-skills`, `.agents/skills/supabase/`) · `supabase-postgres-best-practices` (`supabase/agent-skills`, `.agents/skills/supabase-postgres-best-practices/`) · `clerk-expo` (`clerk/skills`, `.agents/skills/clerk-expo/`) · `clerk-webhooks` (`clerk/skills`, `.agents/skills/clerk-webhooks/`) · `expo-data-fetching` (`.agents/skills/expo-data-fetching/`)

**Calls made on your behalf** (each with its runner up):
- **Clerk link**: Supabase's native third party auth for Clerk. Runner up: Clerk's JWT template, which Clerk deprecated on 1 April 2025.
- **User id**: `user_id text` filled from the token's `sub`, with policies written on `auth.jwt()->>'sub'`. `auth.uid()` is not used, because Clerk ids such as `user_2abc` are not UUIDs. Runner up: a mapping table, which adds a join to every policy.
- **Migrations**: imperative SQL files with the Supabase CLI. Runner up: declarative schemas, which suit a larger team.
- **Client setup**: `@supabase/supabase-js` with the `accessToken` option and `react-native-url-polyfill`, no Supabase Auth session, no storage adapter. Runner up: the Supabase Auth quickstart, which would bring a second auth system.
- **Types**: generated with `supabase gen types typescript` into `src/types/database.ts` and committed. Runner up: hand written types.
- **Keys**: the publishable key in the app, the secret key only in the webhook route. The legacy `anon` and `service_role` keys are not used.
- **Passport and visa**: the passport is account data and lives in the profile. The visa rules are the public Passport Index dataset that spec 0002 loads through its own API route, so they stay out of the database. Runner up: load the dataset into a table too, which would mean about 39,000 rows and a sync job for no gain today.
- **Passport for guests**: a setting, not a saved item. A guest's passport stays on the device as spec 0002 says, and is copied into the profile once at first sign in if the profile has none. The guest bucket is left as it was. The "guests cannot save" rule covers saved destinations and trips.
- **Preferences conflict**: the account wins. On sign in the profile replaces the device values. With no profile row, the device values create it.

## Feature design

**Data model sketch**: all tables are in the `public` schema. Money is `numeric(10,2)`. Dates are `date`. Ids of catalog rows stay the current text slugs. `currency` columns allow 'EUR', 'USD' or 'GBP'. `source` is text, 'sample' for every seeded row. `star_rating` is 1 to 5, `rating` and `review_score` are 0 to 5, `price`, `price_per_night` and `price_per_day` are not negative. Every account table has an index on `user_id`, and `saved_destinations` and `trips` also on `(user_id, created_at)` or `(user_id, booked_at)`.

Catalog (anyone can read, nobody writes from the app):

| Table | Columns | Keys and rules |
|---|---|---|
| `airports` | `code` PK, `city`, `country_code` (ISO 2, check two letters) | Spec 0002 reads `country_code` to find the destination's country |
| `flights` | `id` PK, `origin_code`, `destination_code`, `depart_date`, `return_date` null, `nights` (generated: `return_date - depart_date`, stored), `airline`, `price`, `currency` default 'EUR', `duration_minutes`, `stops` check >= 0, `source` default 'sample', `external_id` null, `sample_depart_offset` null, `sample_return_offset` null | FK to `airports` twice. `return_date` null for one way. Indexes on `(destination_code, depart_date)`, `origin_code` and `price` |
| `hotels` | `id` PK, `name`, `city`, `country`, `neighborhood`, `star_rating`, `review_score`, `review_count`, `price_per_night`, `currency`, `source`, `external_id` null | Standalone |
| `car_rentals` | `id` PK, `company`, `car_type`, `pickup_city`, `price_per_day`, `currency`, `source`, `external_id` null | Standalone |
| `destinations` | `id` PK, `city`, `country`, `blurb`, `rating`, `image_url`, `airport_code` null | FK to `airports` |
| `deals` | `id` PK, `type` ('flight', 'hotel', 'car'), `title`, `subtitle`, `image_url`, `featured` default false, `flight_id`, `hotel_id`, `car_id` | Exactly one link is set and it matches `type` (check constraint). Links are FKs with `on delete cascade`, so a deleted flight removes its deal |

Views (both `with (security_invoker = true)`): `destinations_with_price` adds `price_from` and `currency` from the cheapest flight to the destination's airport, null when there is none. `deals_with_price` adds `price`, `currency` and `price_unit` ('trip', 'night' or 'day') from the linked flight, hotel or car, plus `destination_code` for flight deals (spec 0002 needs it for the visa badge on Home), so a nightly price is never shown as a trip total. `price_from` is the cheapest flight to that airport from any origin, and the screen says "From". Both views are granted `select` to `anon` and `authenticated` explicitly.

Account (owner only, `user_id text not null default (auth.jwt()->>'sub')`):

| Table | Columns | Keys and rules |
|---|---|---|
| `profiles` | `user_id` PK, `passport_country` null (ISO 2), `language` default 'en', `currency` default 'USD', `updated_at` (set by a trigger) | One row per person. `passport_country` is a two letter ISO code, checked for shape only, because the country list comes from spec 0002's dataset |
| `saved_destinations` | `user_id`, `destination_id`, `created_at` | PK on both ids. FK to `destinations` |
| `trips` | `id` uuid PK, `user_id`, `type`, `flight_id` null, `hotel_id` null, `car_id` null, `snapshot_title`, `snapshot_price`, `snapshot_currency`, `snapshot_details` jsonb, `booked_at` | Links are FKs with `on delete set null`. Check: at most one link is set, and a set link matches `type`. A catalog flight, hotel or car sets one link and a live flight sets none. The snapshot is required. `type` is 'flight', 'hotel' or 'car' |
| `alerts` | `id` uuid PK, `user_id`, `origin` null, `destination` null, `anywhere` default false, `month` null, `nights` null, `max_price` null, `direct_only` default false, `status`, `is_demo` default true, `last_checked_at` null, `created_at` | Origin and destination are FKs to `airports`. Check: not both `destination` and `anywhere`. Check: `nights` between 1 and 30. `status` is `active`, `paused` or `undone`. Check: `is_demo` is true until a live price source decides otherwise |
| `activity_log` | `id` uuid PK, `user_id`, `actor` ('assistant', 'user'), `action`, `summary`, `payload` jsonb, `created_at`, `undone_at` null | Append only. The owner may update only `undone_at` (a column level grant). `actor` is claimed by the client, so it is a label, not proof. `actor` is 'assistant' or 'user' |
| `recent_searches` | `id` uuid PK, `user_id`, `origin`, `destination`, `anywhere`, `month`, `nights`, `depart_date`, `return_date`, `max_price`, `direct_only`, `created_at` | Parsed fields only. The app keeps the newest 10 |
| `push_tokens` | `id` uuid PK, `user_id`, `token`, `platform` ('ios', 'android'), `last_seen_at` | Unique on `(user_id, token)`, so two accounts on one phone never collide. A table only: no push feature exists yet |

**State transitions**: alert `status`: `active` to `paused` to `active`, and `active` or `paused` to `undone`. Only the assistant slice triggers more states later. An activity log row is created once and later only gets `undone_at`.

**Search query rules** (the matching rules of spec 0001, expressed as database filters; results are ordered by `price`, then `duration_minutes`, then `id`, and capped at 100 rows):

| Rule | Filter |
|---|---|
| Destination, unless `anywhere` | `destination_code = x` |
| Origin | `origin_code = x` |
| Month `YYYY-MM` | `depart_date >= first day` and `< first day of next month` |
| Exact date (wins over month) | `depart_date` between the date minus 3 days and plus 3 days |
| Nights | `nights` between `n - 1` and `n + 1` (one way rows have null `nights`, so they drop out) |
| Direct only | `stops = 0` |
| Budget | `price <= max_price` |

Suggestions run the same query with one field relaxed. The "raise budget" value comes from the cheapest row with no budget, rounded up to the next 10. The "Anywhere" suggestion is shown only for a route with no flight at all.

**Daily date job**: one function, `private.roll_sample_dates(base date default current_date)`, in a schema the app cannot reach (execute revoked from `anon` and `authenticated`), runs `update flights set depart_date = base + sample_depart_offset, return_date = case when sample_return_offset is not null then base + sample_return_offset end where sample_depart_offset is not null`. A `pg_cron` job calls it once a day just after midnight UTC, and the seed calls it at the end so the first dates are right. Checks on `flights`: `sample_depart_offset >= 0` and `sample_return_offset > sample_depart_offset`. Tests call it with `current_date + 30`. If the project was paused and skipped a run, dates are stale until the next run, which the risks list notes. Note that the job's day is UTC and the app's day is local, so near midnight they can differ by one day.

**API surface**: no new Supabase endpoints. The app uses Supabase's data API through `supabase-js`. One new Expo Router route:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/clerk-webhook` | POST | Raw Clerk webhook body and its signature headers | `{ ok: true }` | Clerk signature, checked on the raw body before anything else | 400 bad or missing signature, 500 missing server env or a failed delete (Clerk retries) |

**Client structure**: `src/lib/supabase.ts` creates the one client with an `accessToken` function that asks the Clerk client instance for the current session token directly, not through a setter filled in an effect, because child screens run their effects before `SessionEffects` and would otherwise load as `anon`. Account loads start only when Clerk reports loaded and signed in. If a signed in session cannot produce a token, the call fails and shows the error state. It never falls back to `anon`. `src/lib/db/` holds typed functions per area (catalog, account), and maps database rows to the app types (for example `country_code` to `Airport.countryCode`, which spec 0002 reads, and `source` onto `Flight.source`, which spec 0003 reads). `src/lib/searchFlights.ts` keeps only its pure parts (reason lines and suggestion candidates); the matching moves into `src/lib/db/catalog.ts`. The Zustand stores for saved, trips and profile stay as the in app copy: they update at once, write to Supabase, roll back on failure, load after sign in, and clear on sign out. `applyStorageScope()` keeps its guest and per account buckets only for what still lives on the device (the auth store and the guest passport).

**Key invariants**:
- Every table has row level security on. Catalog tables have a select policy `to anon, authenticated using (true)` and no write policy. Account tables have policies `to authenticated` with the ownership check `(select auth.jwt()->>'sub') = user_id`, update policies carry both `using` and `with check`, and every table with an update policy also has a select policy.
- Both views use `security_invoker`. No `security definer` function is added.
- Grants are explicit and start from nothing: `revoke all` on every table and view, then `select` only on the catalog tables and views for `anon` and `authenticated`, and the needed `select`, `insert`, `update`, `delete` on account tables for `authenticated` only. This also covers Supabase's default grants, which are wider. `activity_log` gets update only on `undone_at`. `anon` is refused on account tables.
- Policies: every insert policy has a `with check` on the owner, every update policy has `using` and `with check`, and `profiles` has select, insert and update policies so an upsert works.
- Account tables never use `auth.uid()`, and never read `user_metadata` for any decision.
- `anywhere` and `destination` are never both set, in the app and in the alerts check constraint.
- The secret key is read only in `src/app/api/clerk-webhook+api.ts` and never appears under `EXPO_PUBLIC_`.
- No price exists in two places: deals and destinations read prices from the catalog rows through the views.
- Prices stay labelled "Sample data" while `source = 'sample'`.
- A guest passport is copied into a profile only when that profile has no passport, once, and never overwrites. The copy is one statement, `update profiles set passport_country = x where passport_country is null`, and the profile is created with `insert ... on conflict do nothing`.
- An account's passport and preferences live in memory, loaded from the profile, with no device copy. They are cleared at sign out, so the next account never inherits them. Only the guest passport keeps a device bucket.
- Write through is race safe. Each saved or trip write carries a per key sequence number, and a failed write rolls back only if it is still the latest for that key. Each write also carries a session epoch, and a rollback from an older session is dropped. Saving uses an upsert that ignores duplicates, and a booking uses a uuid made on the device and upserted on `id`, so a double tap makes one row.
- The push token row is deleted before `signOut()` runs, while the token still works.

**Security model**: no compliance standard was named. The data is personal (passport country and travel history), and the project region is EU, so GDPR care applies: the account wins on conflicts, rows are owner only, deletion removes the person's rows, and typed text is never stored. Guests read the catalog only. A signed in person has full control of only their own rows. Nobody writes the catalog from the app. The Clerk webhook is the only place the secret key runs, through one function `delete_user_data(user_id)` that only the secret key can execute, and it verifies the signature first, the same verify then act shape as the existing `getVerifiedClerkUserId()` routes.

**Configuration required**:
- `EXPO_PUBLIC_SUPABASE_URL`: the project URL, no trailing path.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the publishable key (`sb_publishable_...`).
- `SUPABASE_SECRET_KEY`: the secret key (`sb_secret_...`), server only, used by the webhook.
- `CLERK_WEBHOOK_SIGNING_SECRET`: Clerk's signing secret for the webhook endpoint, server only.
- Your one time setup steps: activate the Supabase integration in the Clerk dashboard, then add Clerk as a third party provider in the Supabase dashboard with the Clerk domain, link the CLI to the project (`supabase link`), and confirm the project's Data API settings.

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: sign in, search "Anywhere from Tunis under 300 EUR", see 5 or more cheapest first flights read from the database, heart a destination, and see it again on a second device, verifies **AC-7**, **AC-11**.
- Clerk link: with a real Clerk token the database reports the Clerk user id as `sub` and role `authenticated`, and with no token the role is `anon`, verifies **AC-2**.
- Isolation: user A and user B each insert a saved row. A reads only A's row, a direct update that changes `user_id` fails, and `anon` is refused on every account table, verifies **AC-4**.
- Catalog is read only: an insert on `flights` as `authenticated` fails, and an update or delete changes zero rows, verifies **AC-3**.
- Dates: call `private.roll_sample_dates(current_date + 30)` and no flight departs before that day, and the scheduled job exists, verifies **AC-6**.
- Same results: for 20 sample inputs the database search returns the same ordered ids as outputs saved from the old on device search with a pinned date before it is deleted, verifies **AC-7**.
- Failure: with the network off, Results shows the error state and Retry works when the network returns. A heart tap rolls back and says so, verifies **AC-16**, **AC-11**.
- Guest: signed out, tapping the heart opens sign in and writes nothing, verifies **AC-10**.
- Trip snapshot: create a trip for a flight, delete that flight if no deal links to it, and the trip still reads its title and price with its link empty. A trip for a live flight has no link at all, verifies **AC-12**.
- Webhook: a valid signed `user.deleted` body removes that user's rows in every account table, a replay is harmless, an event of another type answers 200 and changes nothing, a failed delete answers 500, a forged signature deletes nothing, verifies **AC-15**.
- Schema: the live tables, columns, constraints, grants, views and the cron job match this design, and the Supabase advisor reports no missing row level security, verifies **AC-1**.
- Seed: after the seed, the counts are 6 airports and 12 flights, every row has `source = 'sample'`, and no flight departs before today, verifies **AC-5**.
- Home: no price on Home, Results or detail is typed in the app, a nightly hotel price is labelled per night, and a city with no flight shows no "From" price, verifies **AC-9**.
- Profile: a first sign in on two devices at once makes one profile and one passport copy, a second account on the same phone does not inherit the first account's passport, verifies **AC-13**.
- Accessors: an alert with both a destination and `anywhere` is refused, `is_demo` cannot be set false, an activity log row can only have `undone_at` changed, a recent search stores no typed text and keeps 10, two accounts can hold the same push token, verifies **AC-14**.
- Races: tap a heart five times quickly and call the trip accessor twice with one id, and the saved row and the trip each exist once with the right final state; sign out during a write leaves no row on the next account, verifies **AC-11**, **AC-12**.
- Startup: with an empty airport load the app shows Retry, never an empty picker, verifies **AC-8**.
- Config: a missing `EXPO_PUBLIC_SUPABASE_URL` stops startup with a clear message, verifies **AC-17**.

## Migration plan

**Strategy**: strangler. The old data files stay in place, working, until the screen that used each one reads from the database. They are deleted only on the last step, when nothing imports them.

**Phases**:
1. Set up the client, env and Clerk link. Apply the catalog migration, the seed and the date job. The app is unchanged.
2. Thin path: load airports from the database, and read Results from the database with the basic filters, behind the same screens.
3. Move the rest of search (suggestions, exact dates, nights), then Home, destinations, deals and flight detail. Delete the old data files and the old on device `searchFlights` list logic.
4. Apply the account migration with the isolation tests. Move saved, trips and profile (the stores gain write through and the guest gate), then the alerts, activity, recent searches and push token accessors.
5. Add the Clerk webhook and finish the error states and checks.

**Rollback**: each phase is one or a few commits. Reverting the commits restores the old data files, which stay in git until phase 3. Migrations only add tables, so before there are real users a rollback is dropping the new tables. After phase 4, account rows would be lost, so roll forward instead.

**Risks**:
- A wrong policy leaks data: guarded by the AC-4 database test and Supabase's own advisor check, run after every migration.
- Clerk's session token must carry the `authenticated` role claim, or every signed in call runs as `anon`. The Clerk integration setup adds it. AC-2 checks it.
- A new table the Data API does not expose returns "permission denied" or an empty result. Grants are explicit in the migration.
- The date job depends on `pg_cron` being enabled on the project. Check the plan supports it before phase 1 ends.
- A free plan project may pause when unused, which would make the app show its error state and skip the daily date job, so sample dates would be stale until the next run. Check your plan's pause rules.
- The webhook cannot clean up writes made in the last seconds of a deleted person's token life, or deletions that happened before the API routes were deployed. Accepted, and noted.
- The 100 row cap makes "Cheapest of N" inaccurate for a very large result set. It is exact for the sample set (12 flights). Raise or page the query when real data arrives.

## Build plan

Build approach is **Tracer Bullet**, taken from the umbrella spec (no approach is recorded in `AGENTS.md`). The thin path is: Clerk token into Supabase, then catalog read, then Results, then the account tables.

0. [ ] Figma first: add the frames for startup loading and error, Results loading and error, Home ideas loading and error, flight detail error, and the sign in prompt at the heart. No UI code for those states until they exist, satisfies **AC-16**, **AC-10** (design).
1. [ ] Set up: install `@supabase/supabase-js` (exact version, lockfile committed) and `react-native-url-polyfill`, add `src/lib/supabase.ts`, env variables and `.env.example`, the startup check, `supabase init` and `supabase link`. Do your one time dashboard steps (Clerk integration, Supabase third party provider), satisfies **AC-2**, **AC-17**.
2. [x] Migration 1: catalog tables, the two views, constraints, indexes, `revoke all` then explicit grants, row level security, the date function and its cron job, and the seed file generated from the current `src/data` content (the seed calls the date function last). Apply with `supabase db push`, confirm the live schema (tables, policies, job), run the advisors, and generate `src/types/database.ts`, satisfies **AC-1**, **AC-3**, **AC-5**, **AC-6**.
3. [ ] Thin path: load airports at startup with the loading and error states from Figma, move `parseSearch()` and the chips to the loaded airports, and read `/results` from the database with the basic filters, satisfies **AC-7**, **AC-8**, **AC-16**.
4. [ ] Save outputs from the old on device search for 20 sample inputs, with a pinned date, as fixtures. Then finish search: month, exact date window, nights, direct only, budget, ordering (price, duration, id), the reason lines on returned rows, and the suggestions with their verifying queries. Compare against the fixtures, satisfies **AC-7**.
5. [ ] Home and detail: the ideas strip, destination cards, deal cards and flight detail read from the database and the views, with their error states. Delete the old data files and update `parseSearch.check.ts` to use its own small airport list, satisfies **AC-9**, **AC-5**, **AC-16**.
6. [ ] Migration 2: the seven account tables, their policies, column level grants, `updated_at` trigger, `user_id` indexes, the `delete_user_data` function and its grants, plus the database test with two users that proves the isolation. Apply, run the advisors, regenerate types, satisfies **AC-1**, **AC-4**.
7. [ ] Saved and trips: write through stores with rollback, load on sign in and clear on sign out, the guest gate on the heart, the trip accessor with its snapshot (no screen creates a trip yet), and removal of the old device keys, satisfies **AC-10**, **AC-11**, **AC-12**.
8. [ ] Profile: move the passport store that spec 0002 built so an account's passport is loaded from the profile and written through to it, with no device copy for accounts, keep the guest bucket, and make the guest copy go into the profile (replacing 0002's account bucket and its copy target). Add language and currency to the profile with the account wins rule on sign in, satisfies **AC-13**.
9. [ ] Accessors for alerts, activity log, recent searches (parsed fields only, newest 10) and push tokens (removed on sign out), satisfies **AC-14**.
10. [ ] The Clerk webhook route: `verifyWebhook` on the raw body, a call to `delete_user_data` through the secret key client, 200 for other event types, 500 on failure, satisfies **AC-15**.
11. [ ] Close out: the `supabase_error` event, a full pass over the failure and guest scenarios, `npx tsc --noEmit`, `npm run lint`, the advisors, and a check that no secret key is in the app bundle, satisfies **AC-16**, **AC-17**.

## Consequences

**Positive**:
- The data model matches what a real price source will give, so the later import is rows and a sync job, not a redesign.
- Account data follows the person across devices, and the database enforces privacy even if app code has a bug.
- There is one source for every price, so Home, Results and detail cannot disagree.
- The only server code is a small webhook, so there is little to operate.

**Negative / tradeoffs**:
- Everything now needs the network. Results, Home and the first screen show an error state when Supabase is unreachable, and there is no offline catalog.
- Guests lose today's ability to save on the device, until the sign in on demand slice improves the prompt.
- Search rules now live in two kinds of place, the parser on the device and the filters in the database, and must be kept in step.
- Two kinds of date logic exist for the sample set (the daily job and the offsets) until real data arrives.
- Anyone with the publishable key can call the data API, so safety rests entirely on the policies being right.
- Live prices (spec 0003) use sample flights as their fallback. With the catalog in the database, that fallback is unavailable when Supabase is down.
- The webhook needs a public URL for the API routes, so it only works once they are deployed, not on a local dev server.

**Neutral**:
- `supabase/` appears in the repo with migrations, the seed and tests.
- `AGENTS.md` should record that data now lives in Supabase and that `src/data` is gone for the catalog (for `/sync` to carry).
- The generated `src/types/database.ts` becomes the typed source for rows and replaces the catalog types in `src/types/travel.ts` over time.

## Follow-up

- [ ] Add Figma frames before building: startup loading and error, Results loading and error, Home ideas loading and error, flight detail error, and the sign in prompt a guest sees at the heart. Frames Results, Home and flight detail already exist.
- [ ] Spec 0002 stays as written and is built first, with a device passport. Task 8 here replaces its account bucket and its guest copy target. Its visa dataset route and `visaDataStore` do not change, and 0002 carries a note about this.
- [x] Spec 0003 (live prices) was updated to match: it builds after this spec, reads airports and sample flights from the database, and keeps live flights out of the catalog tables. Still open there: its in memory caps and cache can move to two Supabase tables in a later migration.
- [ ] Deploy the Expo API routes to a public URL (`EXPO_PUBLIC_API_BASE_URL`, see `eas-hosting`) and register the webhook endpoint in Clerk before task 10 can be verified.
- [ ] Connect the official Supabase MCP server (`https://mcp.supabase.com/mcp`) in your MCP settings. Use a scoped access token, not a full account token.
- [ ] `AGENTS.md` should add the `supabase` and `supabase-postgres-best-practices` skills to its Agent skills section, record Supabase and the MCP server, and update the Rules line that says data is hardcoded and no database is allowed.
- [ ] This spec now holds the sign in gate at the heart, so slice 3 (guest access and sign in on demand) builds after it and only improves the prompt and the guest states of Saved and Trips. The umbrella index records the new order.
- [ ] Hotels and Cars have catalog tables and no search. They stay unreachable from Home until they get their own results.
- [ ] Decide the real price and flight data source, then adjust `flights` (replace sample rows, set `source` and `external_id`, retire the offsets and the date job).
- [ ] Recent searches and push tokens are tables only. Decide their screens and delivery in later slices.
- [ ] The 100 row cap and exact counts need a page or count query when the catalog grows.

## Rationale

- **Direct access with row level security over our own API routes** (runner up: every call through `src/app/api/*+api.ts` with the secret key). The data is private only by owner, which a policy expresses in one line per table, guests need to read the catalog without a Clerk token, and the publishable key is meant to be public. The runner up would add a route per query, a network hop, and a secret key on a server we do not yet deploy. The cost is that policies are the only guard, so they get a database test.
- **Native third party auth over the JWT template** (runner up: the template). Clerk deprecated the template on 1 April 2025, and it shared a secret with a third party and added a token fetch to every request.
- **Text `user_id` from the token over a mapping table**. Clerk ids are not UUIDs, and a mapping table would add a join to every policy for no gain at this size.
- **Search filters in the database over matching on the device** (your choice; the recommended pick was the device). It scales to a real feed, at the price of rewriting the matching as queries. The comparison script in task 4 keeps the two honest.
- **Real date columns plus a daily job over day offsets** (runner up: offsets resolved on the device). The table already looks like a real feed, so the later import changes data, not columns, at the cost of one small scheduled job.
- **Zustand stays the in app copy with write through over adding TanStack Query**. No second new library, and screens keep today's selectors. The cost is that rollback and loading logic is ours to write for three stores.
- **Trips table now, no trip screen yet**. Nothing in the app creates a trip today (Afar never books), so only the table, the accessor and its tests are built.
- **Trips link and snapshot over a text id only**. The catalog will be replaced by real data, and a trip must stay readable when its row goes away.
- **Guests cannot save** (your choice over copying guest data once). It removes the merge problem and fits the sign in on demand direction, at the cost of what guests can do today.
- **Imperative CLI migrations over dashboard SQL or an ORM**. They are reviewable in git and repeatable, and the generated types already give typed queries without a second tool.

## References

**Project sources**:
- `AGENTS.md`: Clerk is the only auth, verify then call for API routes, stores scoped per account, no new major dependency without sign off.
- Spec 0001 umbrella `index.md`: cross child contract (guests first, label the source, verify every caller) and the Supabase approval in principle.
- Spec 0001 child (the matching rules), spec 0002 (passport and the visa dataset route), spec 0003 (live prices, which builds after this spec).
- `src/lib/clerkServerAuth.ts` and `src/app/_layout.tsx`: the existing server and session patterns this follows.
- Installed skills: `supabase`, `supabase-postgres-best-practices`, `clerk-expo`, `clerk-webhooks`, `expo-data-fetching`.

**Practices and standards**:
- Row level security with an ownership check on every table, and `with check` on updates.
- Views with `security_invoker` so they respect the caller's rules.
- Strangler pattern for moving data screen by screen.
- Snapshot on write for records that outlive their source.
- Verify the signature before acting on a webhook, and make deletion idempotent.

**Links** (web verified):
- Clerk, Integrate Supabase with Clerk (JWT template deprecated, native integration, `accessToken`): https://clerk.com/docs/guides/development/integrations/databases/supabase
- Supabase, Clerk as a third party auth provider (the `role` claim, row level security on token claims): https://supabase.com/docs/guides/auth/third-party/clerk
- Supabase, API keys (publishable and secret keys, legacy keys deprecated): https://supabase.com/docs/guides/getting-started/api-keys
- Supabase, Expo and React Native quickstart (`supabase-js`, URL polyfill, `EXPO_PUBLIC_` variables): https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- Agent skills used: https://skills.sh/supabase/agent-skills/supabase and https://skills.sh/supabase/agent-skills/supabase-postgres-best-practices
