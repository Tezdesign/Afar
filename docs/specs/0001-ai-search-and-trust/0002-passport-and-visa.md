# 0002. Passport and visa awareness (slice two)

**Updated**: 2026-10-15. The visa data now comes from the open Passport Index dataset (`imorte/passport-index-data`), fetched through our own API route, not from eight hand written sample rules. See *Change log* at the end.

**Build order**: before 0004 (Supabase). It is built as written, with the passport on the device. Spec 0004 later replaces three things: the account bucket in AC-1 (an account's passport moves to the profile, loaded into memory, with no device copy), the target of the guest copy in AC-2 (the profile, not an account bucket), and the `Airport` source (airports come from the database, with `countryCode` mapped from `country_code`). The guest passport, the visa dataset route and `visaDataStore` do not change.

## Summary

Slice two lets a person say which passport they travel on, then shows what that passport needs to enter each destination. A small badge (`Visa-free`, `Visa on arrival`, `Apply online`, `Visa needed`, `No entry` or `Check visa`) appears on flight results, flight detail and flight deals on Home, and a fuller card on flight detail names the rule, the allowed stay and where the data came from. The rules come from the open Passport Index dataset (about 199 passports, MIT licence), which the app loads through a small API route of our own each time it opens and keeps on the device. The data is real but not official, so every rule says where it came from and when it was updated, and a pair with no data says `Check visa` instead of guessing.

## Requirements

**User stories**:
- As a traveler with visa limits, I want to set my passport once, so that every flight shows what I need before I fall for it.
- As a guest, I want to set my passport without signing in, so that I get the value before I give anything.
- As any traveler, I want to see where a visa rule came from and when it was last updated, so that I know how far to trust it.
- As any traveler, I want to know when a "visa" is only an online form or a stamp at the airport, so that I do not give up on a trip that is easy.
- As any traveler, I want an honest "Check visa" when the app has no data, so that I am never told something it does not know.

**Acceptance criteria** (the contract, each one independently checkable):
- **AC-1**: A new `passportStore` holds `passportCountry` (an ISO 3166 alpha 2 code such as `TN`, or null). It is saved on the device in a bucket named `passport-store:<scope>` and is registered in `applyStorageScope()` in `src/app/_layout.tsx`, so each signed in account and the guest have their own value. Changing it updates every screen that shows a badge or card without a reload.
- **AC-2**: When the scope changes from `guest` to an account and that account has no passport, the guest passport is copied to the account once, after the account bucket has finished loading. It never overwrites an account value, never copies between two accounts, and never copies from an account back to the guest.
- **AC-3**: `getVisaResult(dataset, passportCode, destinationCode)` is pure and never throws. It returns `null` when the passport is the destination's own country. It returns `{ status: "unknown" }` when the dataset is not loaded, the passport is null, or the pair is missing. Otherwise it returns `{ status, days?, kind? }`, mapped from the dataset value: `visa free` → `visa-free`; `visa on arrival` → `visa-on-arrival`; `eta` → `apply-online` with `kind: "eta"`; `e-visa` → `apply-online` with `kind: "e-visa"`; `visa required` → `visa-required`; `no admission` → `no-entry`. `days` is passed through only for `visa-free`, `visa-on-arrival` and `apply-online`. Any other value is `unknown`. Matching uses ISO codes only, and the input codes are upper cased first.
- **AC-4**: `GET /api/visa-data` fetches `passport-index.json` and the header rows of `passport-index-matrix-iso2.csv` and `passport-index-matrix.csv` from `imorte/passport-index-data` at one pinned commit (`VISA_DATA_SHA`, today `9c59780dd0dbaefcbdfa0134d21cd99d0d547509`). It returns `{ source, version, updatedAt, countries, rules }`, where `countries` is `{ code, name }[]` sorted by name and `rules` is the compact form described in *Feature design*. It needs no sign in. It answers with `Cache-Control: public, max-age=86400`. If GitHub fails or the file cannot be parsed, it answers `502` with `{ error }` and never a partial dataset, and it remembers that failure for 60 seconds so repeat calls in that time answer `502` without calling GitHub again. The route also checks that every `countries[].code` is two upper case letters and that the code header and the name header of the matrix files have the same length, and treats any mismatch as a parse failure.
- **AC-5**: A new global `visaDataStore` (not scoped per account, like `preferencesStore`) loads the dataset on every app open. It keeps the last good copy in AsyncStorage under `visa-data` and shows it at once. When the new response has a different `version`, it replaces the saved copy; when the `version` is the same, it keeps the saved copy and writes nothing. A failed fetch keeps the last good copy and never clears it. With no copy and no network, every badge reads `Check visa` and updates in place once data arrives.
- **AC-6**: A `VisaBadge` component shows six states from the Figma frames, each with label, icon and tint: `Visa-free`, `Visa on arrival`, `Apply online`, `Visa needed`, `No entry`, `Check visa`. It never relies on colour alone. Its accessibility label names the status and the passport, or says the passport is not set. It renders nothing when the result is `null`.
- **AC-7**: Flight detail shows a visa card in seven states, matching Figma: passport not set (a "Set passport" button), the five statuses with data, and `Check visa` with a passport set but no data. A state with data shows the badge, the passport name, one sentence built only from the result (see *Card text*), the data line ("Passport Index, updated 1 Mar 2026 · Not official") and a line pointing to the official source. The `Check visa` state with a passport set makes no claim and shows no data line. The card is absent when the result is `null`.
- **AC-8**: A `PassportSheet` bottom sheet shows a "Not set" row first, then every country in the loaded dataset's `countries`, with a search field. Choosing Not set and tapping Done clears the passport (`passportCountry` becomes null). Tapping a row selects it, Done saves and closes, and tapping the scrim, swiping down (iOS) or the system back action (Android) closes without saving. A search with no match says "No countries found". With no dataset yet, the sheet shows the Not set row and the line "Countries are still loading". It opens from Profile, from the flight detail card and from the Results prompt. It is built with React Native `Modal` and a virtualised list.
- **AC-9**: On `/results`, each flight card shows a `VisaBadge` on the row. When the passport is unset, the results are visible and the prompt has not been dismissed this session, a prompt shows above the list with "Set passport" and "Not now". "Not now" hides it for the rest of the session. It returns the next time the app opens, never on every search.
- **AC-10**: On Home, every flight deal card shows a `VisaBadge`, on both the hero card and the Trending rows. On the hero card the badge sits top right on the photo, opposite the "Sample data" price label. On a Trending row it sits right aligned under the price. Hotel and car deals show none. A deal whose flight cannot be found shows none.
- **AC-11**: Profile shows a Passport row above Language, in the same card, with the current country name or "Not set". Tapping it opens the sheet. The row is shown only to signed in users (Profile needs sign in until the guest access slice).
- **AC-12**: Four analytics events go through the existing `posthog` instance (see the table in `## Feature design`). No event carries the passport country or the passport code.
- **AC-13**: Until the saved passport has loaded, badges, the visa card and the Results prompt render nothing, so a returning user never sees a flash of `Check visa`. (A missing dataset is not a reason to wait: AC-5 covers it.)
- **AC-14**: The passport never leaves the device. The visa data request sends no passport, no user id and no query of any kind, so the server cannot learn which passport a person holds. No Clerk call and no new dependency is added. New colours are added to `src/global.css` and `src/theme/colors.ts` before any screen uses them.
- **AC-15**: The sheet rows, the Set passport and Not now buttons, and the Profile row are buttons with `accessibilityRole="button"` and a label that names the field and state (for example "Passport, Tunisia, tap to change"). Touch targets are at least 44 points tall.

## Decision

**Chosen option**: load the open Passport Index dataset through our own API route on every app open, keep the last good copy on the device, and look rules up with a pure `getVisaResult()`. The passport itself stays on the device, scoped per account, and one `VisaBadge` and one `PassportSheet` are used in four places.

**Implementation skills**: `expo-tailwind-setup` (`.agents/skills/expo-tailwind-setup/`) · `ui-layout-master` (`.claude/skills/ui-layout-master/`) · `expo-data-fetching` (`.agents/skills/expo-data-fetching/`, for the fetch and cache)

**Design source** (chosen by the engineer: from Figma): file `Zu9er04NQhDzoHhZirL7LY` (Afar), page Screens. Build to these frames and their spec cards: Profile · passport `154:63`, Passport · picker sheet `154:126` (with the Not set row), Home · visa badges `194:615`, Home · hero and trending badges `202:740`, Deal detail `157:330` (visa needed), Deal detail · visa free `194:713`, Deal detail · set passport `194:783`, Deal detail · check visa `198:662`, Results `157:171` and Results · passport not set `188:571`. Frame Onboarding · passport `154:3` is superseded and is not built. Frame `202:676` (verified) is replaced by the dataset data line. **New frames are required before building** (Figma first): the `Visa on arrival`, `Apply online` and `No entry` badges and their detail cards, the data line with source and date, and the sheet's loading line. Tokens come from `src/global.css`.

## Feature design

**Data model sketch** (confirmed by the engineer):

| Entity | Fields | Rule |
|---|---|---|
| `PassportSetting`, in the new persisted `passportStore` | `passportCountry`: ISO alpha 2 code or null. `ready`: boolean, not persisted, starts false and becomes true only after the first `applyStorageScope()` has finished loading. `promptDismissed`: boolean, not persisted | One passport per account or guest. Stored as `passport-store:<scope>`. Only `passportCountry` is persisted (`partialize`). `ready` is false while a scope is loading |
| `VisaDataset`, in the new global `visaDataStore` | `source` ("Passport Index"), `version` (commit SHA), `updatedAt` (ISO date of that commit), `countries`: `{ code, name }[]`, `rules`: `Record<passportCode, Record<destinationCode, string>>` | Persisted whole under `visa-data`, not scoped. Replaced only by a complete, parsed response |
| Compact rule value | a short string: `vf`, `vf90`, `voa`, `voa30`, `eta`, `eta90`, `ev`, `ev30`, `vr`, `na` | The route builds it from `{ status, days }`, so the payload is about 10 times smaller than the 2.2 MB source. Unknown statuses are dropped by the route |
| `Airport`, changed | add `countryCode` | TUN is `TN`, CDG is `FR`, BCN is `ES`, FCO is `IT`, LHR is `GB`, JFK is `US`. The existing `country` name stays for display |
| `VisaResult`, derived, never stored | `status` (`visa-free`, `visa-on-arrival`, `apply-online`, `visa-required`, `no-entry`, `unknown`), optional `days`, optional `kind` (`eta` or `e-visa`) | `null` when passport and destination are the same country |
| Removed | `src/data/visaRules.ts`, `src/data/passports.ts`, per rule `verified` and `lastChecked` | Source and date live once, on the dataset |

**Relationship**: `Flight.destinationCode` leads to `Airport.countryCode`, which is looked up in `rules[passportCountry]`. A flight whose airport is missing has no result. The dataset omits a passport's own country, so `getVisaResult()` checks `passport === destination` first and returns `null`.

**State transitions**:
- Passport: `unset` → (sheet Done) → `set` → (sheet Done with another country) → `set`. Choosing Not set in the sheet and tapping Done moves it back to `unset`.
- Dataset: `empty` → (fetch ok) → `loaded`; `loaded` (from storage) → (fetch ok) → `loaded` with the new copy; any state → (fetch fails) → unchanged.
- Results prompt: `hidden` while the store is not ready or the passport is set, `shown` when unset and visible, `dismissed` after Not now until the app restarts. Setting a passport also hides it.
- Visa card: `not set`, `visa-free`, `visa-on-arrival`, `apply-online`, `visa-required`, `no-entry`, `unknown`, or absent (domestic). Changing the passport or loading the dataset moves between them at once.

**Card text** (built only from the result):

| Status | Sentence |
|---|---|
| `visa-free` | "No visa needed for stays up to {days} days." Without `days`: "No visa needed." |
| `visa-on-arrival` | "You get a visa at the border on arrival, for up to {days} days." Without `days`, the sentence ends after "arrival". |
| `apply-online` | `eta`: "Apply online for a travel authorisation before you fly." `e-visa`: "Apply online for an e-visa before you fly." With `days`, add " It covers up to {days} days." |
| `visa-required` | "You need a visa before you travel. Apply before you book." |
| `no-entry` | "This passport cannot enter right now, according to our data." |
| `unknown`, passport set | "We have no data for this passport and trip yet." |

Every state with data adds "Check the official source before you book." No text says how long a visa takes or what it costs. The data line reads "{source}, updated {updatedAt as 1 Mar 2026} · Not official".

**Guest to account copy** (AC-2): before `applyStorageScope()` switches, remember the current passport only when the old scope is `guest` and the new scope is an account. Set `ready` to false, await the account bucket's rehydrate, then copy only if the account value is still null. If rehydrate fails, skip the copy and still set `ready` to true.

**API surface**:

| Route | Method | Auth | Input | Output | Errors |
|---|---|---|---|---|---|
| `/api/visa-data` | GET | none (public data, no secret, no personal input) | none | `200` with `VisaDataset`, header `Cache-Control: public, max-age=86400` | `502 { error: "upstream" }` when GitHub fails or parsing fails |

The route keeps the built dataset in module memory for the life of the server process, so repeat calls do not hit GitHub. The app calls it with `getApiBaseUrl()` from `src/lib/apiBaseUrl.ts`.

**Key invariants**:
- A visa claim exists only as a dataset value. Screens never write their own visa text.
- A missing pair is `unknown`. Nothing guesses, and nothing falls back to a similar country.
- Every state with data shows the source and date and the words "Not official".
- `getVisaResult()` is pure (same input, same output, no clock, no store, no React).
- Badge, card and prompt render only when `passportStore.ready` is true.
- A bad or partial response never replaces a good saved copy.
- No analytics event carries the passport country or code. No request carries the passport.

**Security model**: the route serves public data and takes no input, so it needs no `getVerifiedClerkUserId()` (contract rule 7 covers privileged calls, and this one spends no money and reads no user data). The pinned SHA means the content cannot change under us without a code change. The passport country is personal data (nationality), so it stays in the device store and is never logged, sent to PostHog, sent to the server, or put in a URL. Guests and signed in users use the same code path. The cross child contract rules 1, 3, 5 and 6 apply in full. Rule 2 ("Sample data") applies to prices, not to visa rules, which now carry their own source line.

**Configuration required**: `VISA_DATA_SHA` (server, optional, default the SHA above). Colour tokens for the new states, decided in Figma first: `go/50` (`#e5f5ee`) as before, plus tints for `Visa on arrival`, `Apply online` and `No entry`, added to `src/global.css` and `src/theme/colors.ts`.

**Analytics** (existing `posthog` instance; no event carries the country or code):

| Event | Fires when | Properties |
|---|---|---|
| `passport_set` | Done is pressed in the sheet with a changed value, including Not set | `source` (`profile`, `detail` or `results`), `action` (`set` or `cleared`) |
| `passport_prompt_shown` | the Results prompt appears | none |
| `passport_prompt_dismissed` | Not now is pressed | none |
| `visa_badges_viewed` | `/results` or flight detail finishes showing badges, once each time the screen is focused and once more if the passport changes while it is open | `surface` (`results` or `detail`), and counts `visa_free`, `visa_on_arrival`, `apply_online`, `visa_needed`, `no_entry`, `unknown` |

Home sends no event, because it would fire for every card on every scroll.

**Files**:
- New: `src/app/api/visa-data+api.ts`, `src/lib/visaData.ts` (pure: compact encoding and parsing, used by the route and the check), `src/lib/visa.ts`, `src/lib/visa.check.ts`, `src/store/passportStore.ts`, `src/store/visaDataStore.ts`, `src/components/visa-badge.tsx`, `src/components/passport-sheet.tsx`.
- Changed: `src/types/travel.ts`, `src/data/airports.ts` (until spec 0004 moves airports to the database), `src/app/_layout.tsx`, `src/app/(tabs)/profile.tsx`, `src/app/flight/[id].tsx`, `src/app/results.tsx`, `src/app/(tabs)/index.tsx`, `src/global.css`, `src/theme/colors.ts`. Several of these have uncommitted edits from slice one, so build on top of them.
- `visa.ts`, `visaData.ts` and their check import types only with `import type` and relative paths with a `.ts` extension, so `node src/lib/visa.check.ts` runs directly, the same way `parseSearch.check.ts` does.
- `VisaBadge` and `PassportSheet` live in `src/components/` because each is used in three or more places.

**Critical test scenarios** (each maps to an acceptance criterion):
- Mapping: one sample value of each status, with and without days, gives the right `status`, `days` and `kind`; `visa required` with days drops the days; an unknown status is `unknown`, verifies **AC-3**.
- Own country: `TN` to `TN` returns `null` even though the dataset has no such pair, verifies **AC-3**.
- Never throws: null dataset, null passport, unknown destination, empty string and lower case codes all return without throwing, verifies **AC-3**.
- Encoding round trip: every value in the pinned JSON encodes and decodes to the same status and days, and the encoded payload is under 400 KB, verifies **AC-4**.
- Route failure: with GitHub unreachable, the route answers 502 and the app keeps its saved copy; a second call within 60 seconds does not reach GitHub, verifies **AC-4**, **AC-5**.
- Same version: with a saved copy of the current SHA, an app open does not rewrite storage; after the SHA is bumped, the new copy replaces it, verifies **AC-5**.
- Country codes: every code in the built `countries` list is two upper case letters, names map to codes one to one, and Kosovo (`XK`) and Taiwan (`TW`) are present or their absence is noted in `rationale.md`, verifies **AC-4**.
- First launch offline: no saved copy, no network, badges read `Check visa`; turning the network on updates them without leaving the screen, verifies **AC-5**.
- Guest copy: a guest sets `TN`, signs in to an account with none, and the account shows `TN`; an account that already had `FR` keeps `FR`; signing out and into a second account copies nothing; when the account rehydrate fails, the copy is skipped and `ready` still becomes true, verifies **AC-2**, **AC-13**.
- Clearing: with `TN` set, choosing Not set and Done sets `passportCountry` to null, every badge reads `Check visa`, and the event has `action: cleared` and no country, verifies **AC-8**, **AC-12**.
- Scope isolation: account A sets `TN`, account B on the same device sees none, verifies **AC-1**.
- No flash: with a slow passport load, the first frame shows no badge and no prompt, then the right ones, verifies **AC-13**.
- Results prompt: unset passport shows the prompt; Not now hides it; reopening the app shows it again; setting a passport hides it and updates every badge without leaving the screen, verifies **AC-9**.
- Detail states: Tunisia to France shows `Visa needed`, France to Spain shows `Visa-free`, and one pair from the data for each of `Visa on arrival`, `Apply online` and `No entry` shows the right card and sentence; no passport shows the Set passport card; a French passport on a flight to France shows no card, verifies **AC-7**.
- Sheet: about 199 countries scroll smoothly, search "tun" finds Tunisia, "zzz" shows "No countries found", verifies **AC-8**.
- Home: a flight deal shows a badge on the hero card and the Trending row; a hotel deal shows none, verifies **AC-10**.
- Privacy: read the `/api/visa-data` request in the network log; it carries no passport, no token and no query. Read the captured analytics payloads; none contains `TN` or "Tunisia", verifies **AC-12**, **AC-14**.

## Build plan

Build approach is **Tracer Bullet** (the umbrella's default, because `AGENTS.md` still records none): a thin working path from the dataset and a stored passport to one real badge first, then the picker, then each surface.

Every task leaves `npx tsc --noEmit` passing.

0. Figma first: add frames for the `Visa on arrival`, `Apply online` and `No entry` badges and cards, the data line, and the sheet loading line, with their tints. No code until these exist, satisfies **AC-6**, **AC-7** (design).
1. Add the types, `countryCode` on `airports.ts`, the pure `lib/visaData.ts` (encode and decode) and `lib/visa.ts`, and `visa.check.ts` against a small fixture taken from the pinned JSON. Run `node src/lib/visa.check.ts`, satisfies **AC-3**.
2. Add `GET /api/visa-data` with the pinned SHA, the compact encoding, module memory cache and the 502 path. Check the payload size against the real file, satisfies **AC-4**, **AC-14**.
3. Add `visaDataStore` (load saved copy, fetch on app open, keep last good copy) and `passportStore` with `partialize`, `ready` and `promptDismissed`. Register `passportStore` in `applyStorageScope()` and add the guest to account copy, satisfies **AC-1**, **AC-2**, **AC-5**, **AC-13**.
4. Thin path: a basic `passport-sheet.tsx` (list and Done only) opened from the new Profile Passport row, and `visa-badge.tsx` on the flight detail screen, so a passport chosen in Profile shows a real badge end to end, satisfies **AC-6**, **AC-11**.
5. Add the new colour tokens, then finish the sheet to the Figma frame: Not set row, search, "No countries found", the loading line, a virtualised list, scrim, swipe and back cancel without saving, and labels, satisfies **AC-8**, **AC-15**.
6. Build the full visa card on flight detail in its seven states, including the Set passport state that opens the sheet, satisfies **AC-7**.
7. Results: the badge on each card and the passport prompt with Not now, satisfies **AC-9**.
8. Home: the badge on the hero card and the Trending rows for flight deals. Build to Figma frame `202:740`, satisfies **AC-10**.
9. Send the four analytics events, satisfies **AC-12**.
10. Accessibility pass (roles, labels, 44 point targets), then `npm run lint` and a run on the simulator against the Figma frames, online and offline, satisfies **AC-15** and re checks **AC-1** to **AC-14** end to end.

## Consequences

**Positive**:
- Every passport in the world gets an answer, not just Tunisia and France, so the feature is useful from day one.
- The badge now tells easy cases (an online form, a stamp at the airport) apart from a real visa, which is exactly the surprise outcome O-3 is about.
- The source sits behind our own route, so we can move to a better or official source later without an app update.

**Negative / tradeoffs**:
- The data is scraped by a volunteer project from a commercial site. It can be wrong or out of date, and nobody at Afar checks it. The "Not official" line is the only guard.
- The app now needs a network call and our API route to be reachable. A first launch offline shows `Check visa` everywhere until it is.
- Fetching on every app open usually returns a cached copy: the route's `max-age=86400` header lets the phone's HTTP cache answer for a day. So a bumped `VISA_DATA_SHA` reaches people only after that day passes, not at the next app open.
- The route has no auth, so anyone can call it. It only serves public data, but it can be called often; a host level rate limit may be needed once deployed.
- Updating the data is a manual step: someone must bump `VISA_DATA_SHA` and check the format still parses.

**Neutral**:
- The new passport store adds one more bucket per account to `applyStorageScope()`, and the guest copy adds the first cross scope step in that function.
- `Airport` gains `countryCode`, which later slices can reuse for local currency and language.
- `src/data/passports.ts` and `src/data/visaRules.ts` are never created.

## Follow-up

- [ ] Design the three new states, the data line and the sheet loading line in Figma before task 1 (Figma first).
- [ ] Before any public release, compare a sample of pairs (at least the six airport countries against the top passports of Afar users) with official government pages and record the result in `rationale.md`.
- [ ] Decide who bumps `VISA_DATA_SHA` and how often (for example monthly), and add it to the release checklist.
- [ ] Once a host is chosen, add a rate limit or CDN cache in front of `/api/visa-data`.
- [ ] Update `AGENTS.md` (through `/sync`) to mention `passportStore`, `visaDataStore` (global), `/api/visa-data` and `src/components/`, and that visa data is no longer hardcoded.
- [ ] Run the research test "visa badges against none" as an experiment, using the four events above.
- [ ] Hotels and cars have no visa badge, since entry rules depend on the destination country, not the product. Revisit when hotel search exists.
- [ ] Syncing the passport across devices is done by spec 0004 (task 8), which moves an account's passport to the profile. See the build order note at the top.
- [ ] Country names come in English only from the dataset. Slice six (French and Arabic) needs translated names.

## Rationale

- **Open dataset instead of eight sample rules** (runner up: keep the curated list). Eight rules left most people on `Check visa`. The Passport Index dataset covers about 199 passports under MIT, has stay lengths, and splits eTA and e-visa from a real visa. Paid visa APIs give only a few free calls.
- **Five states plus Check visa** (runner up: three states, matching the old Figma). An eTA is a five minute form and a visa on arrival is a stamp; calling both "Visa needed" is the late surprise O-3 exists to prevent. `No entry` is rare but must never look like a normal visa.
- **Fetch through our own route on every app open** (the engineer's pick; my runner up was a bundled compact file updated by a script). The engineer chose runtime fetch so the source can change without a release. The route trims the 2.2 MB file and hides the source from the app. Every app open was picked over weekly to keep data fresh; with a pinned SHA the content only changes on a deploy, so a weekly refresh would serve the same data with less traffic. Worth revisiting if data use matters.
- **Pinned SHA** (runner up: latest on `main`). The format cannot change under us, and the "updated" date is exact without an extra GitHub call.
- **No bundled fallback** (runner up: ship a snapshot too). `Check visa` until data arrives is honest and avoids two copies to keep in sync.
- **Dataset level source and date** (runner up: per rule verified flags). One source means one line of trust, and nobody is checking pairs one by one.
- **Show stay days** (runner up: hide them). The data backs them now, so contract rule 1 holds.
- **Global data store, scoped passport store**. The dataset is the same for everyone and holds no personal data; the passport is account data.
- **Kept from the first version**: ask in context and drop the onboarding step, copy the guest passport to an empty account, ISO codes not names, render nothing until the passport store is ready, status only in analytics, a `Modal` sheet with a Not set row.

## References

**Project sources**: `AGENTS.md` (verify then call shape for API routes, store scoping, design tokens), the umbrella cross child contract in `index.md`, `src/lib/apiBaseUrl.ts`.

**Practices**: pin third party data to an immutable version; keep the last good copy on the device (stale while revalidate).

**Links** (checked during design):
- [imorte/passport-index-data](https://github.com/imorte/passport-index-data), MIT, the 2026 successor dataset
- [ilyankou/passport-index-dataset](https://github.com/ilyankou/passport-index-dataset), the archived original with the value definitions
- [Zyla Labs visa APIs](https://zylalabs.com/api-marketplace/data/global+visa+check+api/5364), paid alternatives with 2 to 3 free calls

## Change log

- **2026-10-15**: the visa source changed from eight hand written sample rules to the Passport Index dataset fetched through `GET /api/visa-data` at a pinned commit. Statuses went from two to five, plus `Check visa`. `verified` and `lastChecked` per rule were replaced by a dataset level source and date. The picker lists every country in the dataset instead of 12. The card shows stay days. The old AC-13 ("no network call") was replaced by AC-14 (the passport never leaves the device). New Figma frames are required for the new states.
