# 0003. Live flight prices with SerpApi (price source)

**Build order**: after 0004 (Supabase). Wherever this spec names `src/data/flights.ts` or `src/data/airports.ts`, read it as the catalog loaded from the database by spec 0004, because 0004 removes those files. Live flights are never stored in the catalog tables.

## Summary

This slice gives Afar its first real prices. When a person searches, Results first shows the sample flights at once, then swaps them for live flights from Google Flights, fetched through SerpApi by a new server route that keeps the API key secret. The free SerpApi plan allows about 250 searches a month, so the server caches every exact query for six hours, stops at 200 live searches a month, allows each device 10 a day, and falls back to sample data (with a plain reason) whenever a limit is hit or SerpApi fails. Live results say where the price came from and when it was checked, and booking happens on Google Flights, not in Afar.

## Requirements

**User stories**:
- As a traveler, I want to see real prices for my trip, so that I can trust what Afar shows me enough to act on it.
- As a guest, I want live prices without signing in, so that I get the value before I give anything.
- As any traveler, I want to see where a price came from and when it was checked, so that I know how fresh it is.
- As any traveler, I want to know why I am seeing sample prices when live ones are not available, so that I am never misled.
- As a traveler who found a flight, I want to open it on Google Flights, so that I can book it.

**Acceptance criteria** (the contract, each one independently checkable):
- **AC-1**: `GET /api/flights` takes `from`, `to`, `depart` (ISO date), optional `return` (ISO date), optional `direct` (`1`) and optional `maxPrice` (EUR), plus the header `x-device-id`. It calls SerpApi with `engine=google_flights`, `departure_id`, `arrival_id`, `outbound_date`, `return_date` and `type=1` for a round trip or `type=2` for one way, `currency=EUR`, `hl=en`, `stops=1` when `direct=1`, and `max_price` when given. The `SERPAPI_API_KEY` is read on the server only and never appears in a response, a log line or the client bundle.
- **AC-2**: The route validates input before any SerpApi call: `from` and `to` are 3 upper case letters and differ, `depart` is a valid date not before today and not more than 330 days ahead, `return` (if present) is on or after `depart`, `maxPrice` is a positive integer, and `x-device-id` is 16 to 64 letters, digits or hyphens. Bad input answers `400 { error }` and spends nothing.
- **AC-3**: A successful call answers `200` with `{ status: "live", flights, checkedAt, cached, priceLevel?, typicalRange?, bookingUrl? }`. `flights` maps `best_flights` then `other_flights` (deduplicated, at most 20) into the existing `Flight` shape with `source: "live"`: `id` built from the route, date and flight numbers; `airline` from the first leg; `price`; `currency: "EUR"`; `durationMinutes` from `total_duration`; `stops` from the number of `layovers`; `departDate`; `returnDate` for a round trip. An itinerary with no price is dropped. For a round trip, `price` is the round trip total and only outbound legs are known.
- **AC-4**: The server keeps a cache keyed by the normalised query (all parameters, sorted). A hit younger than 6 hours is returned with `cached: true` and does not count against any limit. Identical requests that arrive while a call for the same query is still running share that one call (an in flight map of promises), so they spend one search, not several. SerpApi's own one hour cache is left on (no `no_cache`), so a repeat inside the hour is free on SerpApi's side too.
- **AC-5**: The server counts live (non cached) SerpApi calls. When the month's count reaches `SERPAPI_MONTHLY_CAP` (default 200), or the device's count for the day (UTC) reaches `SERPAPI_DEVICE_DAILY_CAP` (default 10), it makes no call and answers `200 { status: "fallback", reason: "quota" }` or `{ status: "fallback", reason: "rate_limit" }`. The same `rate_limit` answer applies when the caller's IP (first `x-forwarded-for` value, else the socket address) reaches the same daily cap, or when the whole server reaches `SERPAPI_GLOBAL_PER_MINUTE` (default 5) live calls in the last minute. All counters are incremented before the SerpApi request starts (no `await` between the check and the increment), so parallel requests cannot overshoot a cap. Counters and cache live in server memory and reset when the server restarts.
- **AC-6**: When `SERPAPI_API_KEY` is unset, the route answers `{ status: "fallback", reason: "not_configured" }`. When the HTTP call fails, times out (10 seconds), or the body has an `error` field, it answers `{ status: "fallback", reason: "error" }`. A body with no `error` field and empty `best_flights` and `other_flights` is a real empty result: `{ status: "live", flights: [] }`. A failed call still counts toward the limits, because SerpApi may have charged it.
- **AC-7**: Results shows the sample results as soon as the database returns them (spec 0004), then calls the route automatically and replaces them with live results when they arrive. The call waits 800 ms after the last change to the search, and a newer search cancels the older request, so quick chip edits spend at most one search.
- **AC-8**: Search types map to calls as follows. Exact dates: one call. Month only ("Paris in June"): the app sends the 1st of that month, or tomorrow if the month has already started, and a chip shows that date so the person can change it (contract rule 3). Nights given with a month: `return` is that date plus the nights. "Anywhere": one call per destination airport in the airports loaded from the database (spec 0004) except the origin, run together, results merged and sorted by price; each call counts against the limits. No origin: no live call, sample stays, with the line "Pick a starting airport for live prices". No exact date and no month: no live call, sample stays, with the line "Pick a date for live prices". A past date: no live call.
- **AC-9**: Every live result shows a label with the source and the time it was checked ("Live · Google Flights · 14:05") in place of "Sample data". Every sample result keeps "Sample data". When the response is a fallback, the sample list stays and one line above it says why: `quota` → "Live prices are paused for this month", `rate_limit` → "Live prices are paused for today", `error` → "Live prices are unavailable right now", `not_configured` → nothing extra. While the call runs, a small loading line shows ("Checking live prices"), and the sample results stay usable.
- **AC-10**: When the response has `priceLevel`, Results shows one line under the summary: "Low for this route, per Google", "Typical for this route, per Google" or "High for this route, per Google". It never appears for sample data and never uses Afar's own words for a deal (contract rule 1). Computed reasons like "Cheapest of 6" are computed within the live set only, after it replaces the sample set, never across sample and live flights. Live flights are not filtered again by `searchFlights.matches` (the date window and price filter were applied by the query); only ranking and reasons run on them.
- **AC-11**: Live flights are kept in a memory only `liveFlightsStore` (`byQuery`, `byId`). Flight detail finds a live flight by id there, and a sample flight by reading the flights table through the database layer of spec 0004. A live flight that is no longer in memory (the app was restarted) shows the existing not found state. In this slice, the save action is hidden on flights with `source: "live"`, so no live id is ever persisted in `savedStore`, trips or a link.
- **AC-12**: Flight detail for a live flight shows an "Open on Google Flights" button that opens `bookingUrl` with `expo-web-browser`. If there is no `bookingUrl`, the button opens a Google Flights search URL built from the route and dates. Afar never books, pays or handles card data.
- **AC-13**: The device id is a random string made on first use and saved globally (not scoped per account) in AsyncStorage under `device-id`. It is sent only to `/api/flights`, never to PostHog, and carries no personal data. `liveFlights.ts` awaits it before every request and never sends a request without it.
- **AC-14**: Three analytics events go through the existing `posthog` instance (see the table in `## Feature design`). None carries the device id or the user id.
- **AC-15**: The visa badges from slice 0002 show on live results exactly as on sample results, since both use `destinationCode`.
- **AC-16**: The loading line, the fallback line and the price level line are announced to screen readers (`accessibilityLiveRegion="polite"` on Android, `AccessibilityInfo.announceForAccessibility` on iOS). The Google Flights button is a button with a label that names the airline and price, and is at least 44 points tall.

## Decision

**Chosen option**: SerpApi's Google Flights engine behind a new public, rate limited Expo API route, called automatically from Results with a debounce, sample data shown first and kept as the fallback, booking handed off to Google Flights.

**Implementation skills**: `expo-data-fetching` (`.agents/skills/expo-data-fetching/`) · `ui-layout-master` (`.claude/skills/ui-layout-master/`) · `expo-tailwind-setup` (`.agents/skills/expo-tailwind-setup/`)

**Design source** (chosen by the engineer: Figma first): file `Zu9er04NQhDzoHhZirL7LY` (Afar), section Results and detail `157:170`. **New frames are required before building**: the live label, the loading line, the three fallback lines, the price level line, the date chip for a month only search, and the "Open on Google Flights" button on detail. Tokens come from `src/global.css`.

## Feature design

**Data model sketch** (confirmed by the engineer):

| Entity | Fields | Rule |
|---|---|---|
| `Flight`, changed | adds `source: "sample" \| "live"` and optional `bookingUrl` | A sample flight takes `source` from the `flights.source` column that 0004 creates ('sample') |
| `LiveSearchResponse`, the route's answer | `{ status: "live", flights: Flight[], checkedAt: ISO time, cached: boolean, priceLevel?: "low" \| "typical" \| "high", typicalRange?: [number, number], bookingUrl?: string }` or `{ status: "fallback", reason: "quota" \| "rate_limit" \| "error" \| "not_configured" }` | Shared type in `src/types/travel.ts` |
| `liveFlightsStore`, memory only | `byQuery: Record<queryKey, LiveSearchResponse>`, `byId: Record<flightId, Flight>`, `status` per query (`idle`, `loading`, `done`) | Not persisted, not scoped. Cleared on app restart |
| Device id | `deviceId: string` | Global AsyncStorage key `device-id`, made once |
| Server memory (in the route module) | `monthCount: { month: "YYYY-MM", count }`, `deviceCounts` and `ipCounts: Map<key + day, count>`, `recentCalls: number[]` (timestamps of the last minute), `cache: Map<queryKey, { at, body }>`, `inFlight: Map<queryKey, Promise>` | Resets on restart. Old days and expired cache entries are dropped on each call |

**Mapping from SerpApi** (`best_flights` then `other_flights`): first leg `airline` → `airline`; `price` → `price`; `total_duration` → `durationMinutes`; `layovers.length` → `stops`; `price_insights.price_level` → `priceLevel`; `price_insights.typical_price_range` → `typicalRange`; `search_metadata.google_flights_url` → `bookingUrl` when present. The route never passes raw SerpApi JSON to the app.

**State transitions** (per Results search):
`sample` → (debounce ends, call starts) → `loading` → (`live`) → `live results` | (`fallback`) → `sample with reason`. A new search during `loading` cancels it and starts again. A search the route cannot serve (no origin) stays `sample with hint`.

**API surface**:

| Route | Method | Auth | Input | Output | Errors |
|---|---|---|---|---|---|
| `/api/flights` | GET | none, guests allowed (engineer's choice), limited per device and per month | query `from`, `to`, `depart`, `return?`, `direct?`, `maxPrice?`; header `x-device-id` | `200 LiveSearchResponse` | `400 { error }` on bad input. Limits and SerpApi failures are `200` fallbacks, so the app has one path |

The app calls it with `getApiBaseUrl()` from `src/lib/apiBaseUrl.ts`, through a small client in `src/lib/liveFlights.ts`.

**Key invariants**:
- The SerpApi key is only ever on the server.
- A cache hit never counts against a limit. A real call always counts, even when it fails.
- The server never makes call 201 in a month or call 11 for a device in a day.
- Every price on screen says whether it is live (with source and time) or sample. There is never an unlabelled price.
- Sample results are never hidden while waiting, and are the fallback for every failure.
- Afar adds no claim of its own about a live price; `priceLevel` text always says "per Google".
- No analytics event carries the device id, the user id or the passport.

**Security model**: this route spends a paid quota, so it is the first public route that is not free to call. The engineer chose guests first over sign in (contract rule 6 over rule 7). The protection is: input validation before any call, a hard monthly cap on the server, a per device daily cap, and the cache. The device id is chosen by the client, so a determined caller can rotate it; the monthly cap is the real ceiling and bounds the cost at zero (the free plan simply stops). Nothing personal is sent to SerpApi beyond the route and dates. The key is never logged.

**Configuration required**:
- `SERPAPI_API_KEY` (server only, required for live prices; unset means `not_configured`)
- `SERPAPI_MONTHLY_CAP` (server, optional, default `200`)
- `SERPAPI_DEVICE_DAILY_CAP` (server, optional, default `10`, applied per device id and per IP)
- `SERPAPI_GLOBAL_PER_MINUTE` (server, optional, default `5`)
- Add all four to `.env.example`. None get the `EXPO_PUBLIC_` prefix.

**Analytics** (existing `posthog` instance):

| Event | Fires when | Properties |
|---|---|---|
| `live_prices_loaded` | a live response is shown | `count`, `cached`, `anywhere` (boolean), `price_level` |
| `live_prices_fallback` | a fallback or no origin hint is shown | `reason` (`quota`, `rate_limit`, `error`, `not_configured`, `no_origin`) |
| `live_booking_opened` | the Google Flights button is pressed | `price_level` |

No route codes are sent, to keep events simple and free of trip details.

**Failure and edge cases**:
- SerpApi slow: 10 second timeout, then `error` fallback. The sample list was visible the whole time.
- The database is down: there are no sample results to show or fall back to. Results shows the error state with Retry from spec 0004, and a live search can still run without a sample list.
- Two identical searches at once on the server: they share one in flight call (AC-4).
- Anywhere with 5 destinations near the daily cap: the route serves calls until the cap, then the rest answer `rate_limit`. The app merges the live answers it got and shows the paused line.
- Search changes while loading: the old request is aborted with `AbortController` and its answer is ignored.
- A past date in the search: the route answers 400; the app does not call it for past dates and keeps sample data.
- Server restart: counters reset, so the real monthly ceiling after restarts is SerpApi's own 250. Marked in code with a `ponytail:` note pointing to Supabase.

**Files**:
- New: `src/app/api/flights+api.ts`, `src/lib/serpApi.ts` (pure: build params, map response; no fetch), `src/lib/serpApi.check.ts`, `src/lib/liveFlights.ts` (client: debounce, abort, merge for anywhere, live date choice), `src/lib/deviceId.ts`, `src/store/liveFlightsStore.ts`.
- Changed: `src/types/travel.ts`, the row mapping in `src/lib/db/catalog.ts` from spec 0004 (`source` and `bookingUrl`), `src/app/results.tsx`, `src/app/flight/[id].tsx`, `src/components/dataLabel.tsx` (a live variant), `.env.example`.
- `serpApi.ts` and its check use `import type` and relative `.ts` paths, so `node src/lib/serpApi.check.ts` runs directly, like `parseSearch.check.ts`, against a saved SerpApi sample response.

**Critical test scenarios**:
- Mapping: a saved SerpApi response maps to `Flight` objects with the right price, duration, stops, airline and `source: "live"`; an itinerary without a price is dropped; duplicates are removed; at most 20, verifies **AC-3**.
- Params: one way, round trip, direct only and max price build the right SerpApi query, verifies **AC-1**.
- Validation: bad codes, same origin and destination, past date, return before depart and a missing device id each give 400 and no SerpApi call, verifies **AC-2**.
- Key safety: search the response body, server logs and the client bundle for the key; it is in none of them, verifies **AC-1**.
- Cache: two identical searches; the second is `cached: true` and the counters do not move, verifies **AC-4**.
- Concurrency: fire 5 identical requests at once with an empty cache; SerpApi is called once and the counters move by one. Fire 5 different requests with a cap of 3; exactly 3 calls are made, verifies **AC-4**, **AC-5**.
- Rotating device id: 12 requests from one IP with 12 different device ids and a daily cap of 10; the eleventh answers `rate_limit`, verifies **AC-5**.
- Error body: a saved SerpApi body with an `error` field gives `error`; one with empty arrays gives a live empty result, verifies **AC-6**.
- No date: a search with no date and no month makes no call and shows "Pick a date for live prices", verifies **AC-8**.
- Caps: with `SERPAPI_DEVICE_DAILY_CAP=2`, the third search answers `rate_limit` and Results shows "paused for today"; with `SERPAPI_MONTHLY_CAP=1`, the second device gets `quota`, verifies **AC-5**, **AC-9**.
- Not configured: no key, Results shows sample data and no extra line, verifies **AC-6**.
- Debounce: change three chips quickly; the network log shows one call, verifies **AC-7**.
- Month only: "Paris in June" sends June 1 (or tomorrow), the date chip shows it, and editing the chip searches again, verifies **AC-8**.
- Anywhere: one call per destination, merged and sorted by price, verifies **AC-8**.
- Labels: every live card shows "Live · Google Flights" and a time; every sample card shows "Sample data", verifies **AC-9**.
- Price level: a response with `price_level: "low"` shows "Low for this route, per Google"; a sample list shows nothing, verifies **AC-10**.
- Detail: open a live flight, see the Google Flights button, open it in the in app browser; restart the app and the same id shows not found; a live flight shows no save action, verifies **AC-11**, **AC-12**.
- Privacy: captured analytics payloads contain no device id or user id; the device id is the same before and after signing in, verifies **AC-13**, **AC-14**.
- Visa: a Tunisian passport shows `Visa needed` on a live flight to Paris, verifies **AC-15**.

## Build plan

Build approach is **Tracer Bullet** (the umbrella's default): one live search for one exact route, end to end, before the limits, the loose search types and the polish.

Every task leaves `npx tsc --noEmit` passing.

0. Figma first: add frames for the live label, loading, the three fallback lines, the price level line, the month date chip and the detail button. No UI code until these exist, satisfies **AC-9**, **AC-10**, **AC-12** (design).
1. Add the types (`source`, `bookingUrl`, `LiveSearchResponse`), map the `flights.source` column onto `Flight.source`, and write the pure `serpApi.ts` (params and mapping) with `serpApi.check.ts` against a saved real response, satisfies **AC-1**, **AC-3**.
2. Add `GET /api/flights` with validation, the SerpApi call with timeout, and the `not_configured` and `error` fallbacks. Add the env vars to `.env.example`, satisfies **AC-1**, **AC-2**, **AC-6**.
3. Thin path: `deviceId.ts`, `liveFlightsStore`, and `liveFlights.ts` for exact dates only; Results swaps sample for live with the live label, satisfies **AC-3**, **AC-9**, **AC-13**.
4. Add the server cache, the in flight map, the device, IP, monthly and per minute caps (incremented before the call), with the `ponytail:` note on the memory store; show the fallback lines in Results, satisfies **AC-4**, **AC-5**, **AC-9**.
5. Add the debounce and abort, then the month only date choice with its chip, and the anywhere fan out, satisfies **AC-7**, **AC-8**.
6. Show the price level line, satisfies **AC-10**.
7. Flight detail for live flights, the Google Flights button, and hide save on live flights, satisfies **AC-11**, **AC-12**, **AC-15**.
8. Send the three analytics events, satisfies **AC-14**.
9. Accessibility pass, `npm run lint`, and a simulator run against the Figma frames with a real key, with the key removed, and with the caps set to 1, satisfies **AC-16** and re checks **AC-1** to **AC-15**.

## Consequences

**Positive**:
- Afar shows real prices for the first time, so the "Sample data" disclaimer stops being the whole story.
- The route hides the provider, so moving to another source later (Ignav, Duffel, an enterprise API) changes one server file and the mapping.
- Sample first means the screen is never slower than today, and every failure has a calm fallback.

**Negative / tradeoffs**:
- 200 live searches a month is tiny. With automatic search and guests allowed, a handful of active users will use it up within days, after which everyone sees "paused for this month". This is the engineer's choice and is honest, but it means live prices are a demo, not a product, until a paid plan or another source is chosen.
- "Anywhere" costs up to 5 searches per tap, so one person can spend half of their daily allowance on one search.
- Counters and cache are in memory: they reset on every server restart and do not work across several serverless instances. On a serverless host the per device cap is close to meaningless; only SerpApi's own plan limit then holds.
- The device id is chosen by the client and is easy to rotate. The per IP cap and the global per minute limit make draining slower, but anyone with several IPs can still use up the month. The monthly cap keeps the cost at zero.
- SerpApi scrapes Google Flights. Results can change shape or break without notice, and Google's terms apply to the data.
- Round trips show outbound legs only. The return flights are chosen on Google Flights.
- Live flights vanish on app restart, so a saved deal or a shared link to a live flight cannot reopen it.

**Neutral**:
- The umbrella's "Price source: undecided" becomes SerpApi for search. Price alerts (slice 5) still need their own decision, since 200 searches a month cannot poll prices.
- `Flight` gains `source`, which every later slice must set.

## Follow-up

- [ ] Design the new states in Figma before task 1 (Figma first).
- [ ] Get a SerpApi key and add `SERPAPI_API_KEY` to `.env` (server only).
- [ ] Before deploying, move counters and cache to a shared store so caps hold across instances and restarts. Supabase exists after spec 0004, so this can be two small tables (usage counters and a query cache) used by this route with the secret key, added in a later migration.
- [ ] Watch `live_prices_fallback` with `reason: quota`; if it fires in the first week of a month, revisit automatic search (a button) or sign in for live prices.
- [ ] Update the umbrella `index.md`: price source is now SerpApi for search (done with this spec).
- [ ] Update `AGENTS.md` (through `/sync`): live prices exist, `/api/flights`, the three env vars, and the "data is hardcoded, no live API" rule now has an exception.
- [ ] Saving a live flight (savedStore) needs the flight stored with the deal, since live ids do not survive a restart. Out of scope here. A trip for a live flight has no catalog link, only a snapshot (spec 0004).
- [ ] Confirm `search_metadata.google_flights_url` is present in real responses; it was not in the docs sample.

## Rationale

- **SerpApi Google Flights** (runner up: Ignav, 1,000 free requests). Amadeus Self Service closed on 17 July 2026 and Kiwi Tequila is invite only. SerpApi has a documented free plan, real Google prices, and a free one hour cache. Duffel's test mode uses a fake airline, so it cannot show real prices.
- **Guests allowed, rate limited** (the engineer's pick; my recommendation was signed in only). The engineer chose guests first (contract rule 6). Based on the 250 search quota, signed in only would protect it far better, because a Clerk id is harder to rotate than a device id. Guests work but the engineer accepts that the quota will often run out and the per device cap is weak.
- **Automatic search** (the engineer's pick; my recommendation was a "Check live prices" button). The engineer chose automatic for the better feel. The debounce and cache cut the waste, but each new search still spends one call, so this choice is the main reason the quota runs out fast.
- **Pick the first date for month only searches** (the engineer's pick; runner up: stay on sample). Visible as a chip, so the person can see and change what the app chose (contract rule 3).
- **Live per destination for anywhere** (the engineer's pick; my runner up was sample only). Up to 5 calls per tap, each counted.
- **Outbound plus round trip total** (runner up: a second call for return legs). Half the quota per trip, and Google Flights handles the return choice.
- **Sample first, live replaces it** (runner up: both lists). The screen is never slower than today and never shows two prices for one route.
- **Booking on Google Flights** (runner up: a `booking_token` call for sellers). No money, no extra quota, no new legal surface.
- **Show Google's price level, sourced** (runner up: hide it). It comes from the data, so contract rule 1 holds as long as the text says "per Google".
- **In memory counters for now** (runner up: Upstash Redis, a new dependency). Fine on Metro and one server process; a ponytail note marks the ceiling and the upgrade path.
- **200 of 250 cap, 10 per device per day, 6 hour cache, 800 ms debounce**. The cap leaves room for testing in the SerpApi playground; the numbers are env vars so they can be tuned without code.

## References

**Project sources**: `AGENTS.md` (secrets only in API routes, `getApiBaseUrl()`, new dependency sign off), the umbrella cross child contract (rules 1, 2, 3, 6, 7), `src/app/api/stream-token+api.ts` (route shape), `src/lib/searchFlights.ts` (computed reasons).

**Practices**: server side secrets, cache before spending a paid quota, hard spending caps, debounce and cancel stale requests, fail to a labelled fallback.

**Links** (checked during design):
- [SerpApi Google Flights API docs](https://serpapi.com/google-flights-api) (parameters, round trip with `departure_token`, cached searches are free, one hour cache)
- [SerpApi pricing](https://serpapi.com/pricing.md) (free plan, 250 searches a month)
- [Amadeus Self Service shutdown](https://airlabs.co/amadeus-self-service-api-shutdown)
- [Free travel APIs in 2026](https://www.tripgic.com/playbook/free-travel-api/) (Duffel test mode, Aviationstack, OpenSky)
- [Ignav migration guide](https://ignav.com/docs/amadeus-self-service-shutdown) (runner up)
