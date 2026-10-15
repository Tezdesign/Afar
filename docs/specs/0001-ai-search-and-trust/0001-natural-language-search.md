# 0001. Natural language search and results (slice one)

## Summary

Slice one lets a person type a trip in their own words on Search, see the app's reading of it as editable chips, then see flight results with an honest one line reason and a "Sample data" label. It runs fully on the device, with no database, no new service and no new dependency. It also removes the invented discount claims (the "−18%" badge, the struck through price, "fare drop" titles) because sample data cannot back them. Build it as a thin working path first, then widen it.

## Requirements

**User stories**:
- As a flexible deal hunter, I want to type "Anywhere from Tunis next month under 300" so that I do not have to guess a destination before I can search.
- As any traveler, I want to see how the app read my sentence and fix it in one tap, so that I trust what is being searched.
- As a guest, I want to search and see results without signing in, so that I get value before I give anything.
- As any traveler, I want a clear next step when nothing matches, so that I am never stuck on a dead end.

**Acceptance criteria** (the contract, each one independently checkable):
- **AC-1**: Home matches Figma frame `34:12`. Under the logo and Sign in row, the headline "Where to?" is followed by a "Describe your trip" card as the first control. Tapping the card or its arrow clears any old search (`reset()`) and opens Search with the text line focused; Home never parses text itself. The card's placeholder is the first example prompt, and the other two examples show as chips under it. Tapping a chip clears the old search and opens Search with that sentence already parsed. The card also has an "Ask Afar" link that opens the assistant, and there is no floating assistant button on Home. Home has no greeting row, no filter button and no Flights, Hotels or Cars switch, because only flights work. Below the chips, an "Ideas to start from" strip shows flight deal cards, each with a "Sample data" label. The three examples are "Anywhere from Tunis under 300 EUR" (placeholder), "Tunis to Paris direct" and "Rome from Barcelona under 100 EUR". Each parses with zero unrecognized chips and returns at least one flight for any value of today. Examples contain no month, weekend or relative date phrase, so they cannot go stale, and none promises something the parser cannot read (such as "warm" or "visa free").
- **AC-2**: On Search, a text line (placeholder is an example, not a command) sends its text to `parseSearch()` when the arrow or return is pressed. A submit replaces every parsed field: it clears the old parsed values first, then writes the new ones, so a second sentence never merges with the first. The result fills chips for origin, destination or "Anywhere", month or dates, nights, budget, and direct only. Nothing is searched until the Search button is tapped.
- **AC-3**: `parseSearch()` follows the parser rules in `## Feature design`. Anything it cannot map becomes an Unrecognized chip with the original words (up to 3 chips, then "+N more"). An Unrecognized chip never changes a filter. The parser never throws on any string, including empty text.
- **AC-4**: Search has form rows for Where, When (month or dates, and nights), Budget and From, matching the Figma frames. Where and From list the airports in `airports.ts`. Every chip opens the same picker as its form row and has a × to clear. Direct only has no form row, only a chip set by the text line and cleared with its ×. The text line, the chips and the form rows all read and write the same `searchStore` fields, so they can never disagree.
- **AC-5**: A field with no value shows as a dashed empty chip, never a guessed value. The Search button is enabled once Where is set (a destination or "Anywhere"). Origin is optional and never defaulted.
- **AC-6**: Tapping Search opens `/results`. It lists the sample flights that match the params, cheapest first (ties by shorter duration). Each card shows route, airline, stops, price in EUR, one reason line computed from the result set only, and a "Sample data" label. Flight detail shows the same label next to its price.
- **AC-7**: When no flight matches, `/results` shows the no results state with up to 3 suggestions from `## Feature design`. Each suggestion is verified to return at least one flight before it is shown. Tapping one applies it and re runs. If none qualify, only "Edit search" shows.
- **AC-8**: On `/results` the chips replace the form (they shrink, they are not lost). Editing or clearing a chip updates the store and refreshes the list without leaving the screen.
- **AC-9**: Tapping a flight deal card on Home clears any old search, then opens Search with only the destination chip filled, taken from the deal's flight. Other chips show dashed. Hotel and car deals, and any deal whose flight cannot be found, open an empty Search.
- **AC-10**: No discount or urgency claim remains: the `−N%` badge on both Home deal lists (flight and car deals), `Flight.dealBadge`, `Flight.previousPrice` with its struck through price, `Deal.discountPercent`, "fare drop" wording in deal titles, and the deal id `deal-paris-fare-drop` are all removed from screens, data and types.
- **AC-11**: The sample flights grow to about 12, all priced in EUR, covering all six airports in `airports.ts`. Dates are stored as day offsets from today, spread between 20 and 60 days, and resolved to local calendar dates when the data loads, so results are never in the past.
- **AC-12**: The six events in the analytics table are sent through the existing `posthog` instance. No event carries the typed text.
- **AC-13**: The path works fully as a guest. Search's close button returns to `/` for everyone (it routes signed out users to `/onboarding` today). No Clerk call, no network call and no new env var is added.
- **AC-14**: Chips, form rows, suggestions and the example prompts are buttons with `accessibilityRole="button"` and a label that says the field and state (for example "Origin, not set, tap to add"). Touch targets are at least 44 points tall.

## Decision

**Chosen option**: build slice one entirely on the device. A rules based `parseSearch()` fills chips, `searchStore` is the single source of truth, a pure `searchFlights()` powers a new `/results` route, and the sample data is widened and made honest.

**Implementation skills**: `expo-tailwind-setup` (`.agents/skills/expo-tailwind-setup/`) · `ui-layout-master` (`.claude/skills/ui-layout-master/`)

**Design source** (chosen by the engineer: from Figma): file `Zu9er04NQhDzoHhZirL7LY` (Afar), page Screens. Build to these frames and their spec cards, in this order: Home `34:12`, Search · empty `155:63`, Search · parsed `155:172`, Search · partly understood `155:233`, Search · from a deal `155:370`, Results `157:171`, Results · none `157:268`, Deal detail `157:330`. Tokens come from `src/global.css`, never new values. Frames Search · parsing `155:127` and Search · offline fallback `155:301` are deferred (see Follow-up). Frame Results · passport not set `188:571` and any visa badge belong to a later child.

## Feature design

**Data model sketch** (confirmed by the engineer; all local, nothing persisted):

`searchStore` params (existing store, session only):

| Field | Type | Status | Rule |
|---|---|---|---|
| `origin` | `Airport.code` or null | existing | null shows an empty dashed chip |
| `destination` | `Airport.code` or null | existing | one destination only |
| `anywhere` | boolean, default false | new | true excludes `destination` |
| `month` | `"YYYY-MM"` or null | new | no year typed means the next upcoming one |
| `nights` | integer 1 to 30 or null | new | |
| `departDate`, `returnDate` | ISO date or null | existing | an exact date wins over `month` |
| `maxPrice` | number or null | existing | this is the budget, in EUR. No new `maxBudget` field |
| `adults`, `kids`, `directOnly`, `minPrice` | | existing | `minPrice` stays unused |
| `unrecognized` | string[], default empty | new | display only: the Unrecognized chips from the last submit. It never filters. Cleared by `reset()` and by a new submit |

`ParsedSearch` (new, exported from `parseSearch.ts`, returned by the parser and then written to the store by the Search screen): `{ params: Partial<SearchParams>; unrecognized: string[] }`.

`Flight` (changed): remove `dealBadge` and `previousPrice`. Replace `departDate` and `returnDate` strings in the source data with `departInDays: number` and `returnInDays?: number`; `data/flights.ts` exports the resolved list with ISO `departDate` and `returnDate`, so consumers keep reading the same two fields. `Deal` (changed): remove `discountPercent`.

**State transitions**:
- Search screen: `empty` → (arrow pressed) → `parsed`, or → `partly understood` when `unrecognized` is not empty. Any chip edit keeps the state. Arriving with a destination query param starts in `from a deal`. All states return to `empty` when every chip is cleared.
- Results screen: `results` when the list is not empty, `none` when it is. Editing a chip moves between them.

**Parser rules**. The signature is `parseSearch(text: string, today: Date, airports: Airport[])`. It is pure: it reads no clock and no module state. It works in local calendar dates (year, month, day), never through `toISOString`, so a late evening user does not get tomorrow's date.

Matching is case insensitive, on whole words, and consumes tokens: rules run in the order below, and once a rule uses a span of words, no later rule can use those words. This is what stops "Paris under 400 TND" from setting a 400 budget, "max 5 nights" from setting a budget of 5, and "21 Aug" from also setting a month.

| Order | Field | Understood | Result |
|---|---|---|---|
| 1 | Exact date | "21 Aug", "Aug 21", "2026-08-21" | `departDate`, the next upcoming occurrence. A date that is already past (including a past ISO date) is Unrecognized. Sets no `month` |
| 2 | Length | "N nights", "N days" | `nights` N, or N minus 1 (at least 1) for days |
| 3 | Budget | "under N", "below N", "max N", "budget N", "N EUR", "€N", "N€", with "euro" and "euros" accepted | `maxPrice` N in EUR. A bare number after those words counts as EUR and the chip says "Under 400 EUR". If a currency word other than EUR follows or precedes the number (`$`, `£`, USD, GBP, TND, dollars, pounds and similar), the number and the currency become one Unrecognized chip and no budget is set |
| 4 | Direct | "direct", "nonstop" | `directOnly` true |
| 5 | Anywhere | "anywhere", "somewhere" | `anywhere` true, destination null |
| 6 | Weekend | "weekend", "this weekend" | `departDate` the next Saturday and `returnDate` the Sunday after. If today is a Saturday, it means today. If today is a Sunday, it means next Saturday. Inside a named month ("weekend in March") it means that month's first Saturday that is today or later, and that month is not also set |
| 7 | Relative month | "next month" | `month` is the next calendar month |
| 8 | Month name | full or 3 letter names. "may" counts only right after "in" or next to a day number | `month`. With no year, the next month that still has days left, counting the current one |
| 9 | Airports | city name or IATA code from the `airports` argument | "from X" sets origin; "to X" or a lone city sets destination; "X to Y" sets origin X, destination Y |

Not understood, shown as Unrecognized chips and never filtering: a second destination or origin, number of travelers, a non EUR currency (rule 3), a past date (rule 1), and every leftover word that is not a filler word ("a", "an", "the", "in", "for", "on", "and", "or", "i", "want", "fly", "flight", "flights", "trip", "me", "from", "to" and similar). Adjacent leftover words join into one chip, for example "warm sunny". The parser never throws.

**Matching rules** (documented because they act on sample data, and are the same on every screen):
- Destination: exact `destinationCode`. `anywhere` or no destination matches all.
- Origin: exact `originCode`, or all when null.
- `month`: flights departing in that month. Exact `departDate`: flights departing within 3 days either side. `nights`: round trips whose length is within 1 night of it.
- `directOnly`: `stops` is 0. `maxPrice`: `price` at most the budget (strict, over budget flights are hidden).

**Reason line** (computed from the result set only, never from price history): up to two parts joined by ", ", from this list in order: "Cheapest of N" (the card is the cheapest among results of its own trip type, one way or round trip, and N is the size of that group, at least 2), then "Direct" (stops 0) or "1 stop" or "N stops". Show nothing if no part applies. It must fit one line and truncate with an ellipsis. Each card also says "One way" or "Round trip" so the ranking is not a surprise. There is no "within budget" line, since the strict filter makes it true for every card.

**No results suggestions** (in this order, up to 3, each verified to return at least one flight, and skipped when its field is already empty):
1. "Raise budget to N EUR", N is the smallest value rounded up to the next 10 that gives at least one flight.
2. "Any dates" (clears month, dates, nights).
3. "Any starting airport" (clears origin).
4. "Allow stops" (clears direct only).
5. "Anywhere" (clears the destination and sets `anywhere`), for a route with no flight at all.

**API surface**: none. No new route handler, no network call, no secret.

**Key invariants**:
- Chips map one to one to `searchStore` fields. `parseSearch()` returns data; only the Search screen writes it to the store.
- `anywhere` and `destination` are never both set. `setSearchParams` enforces it in the store, not in screens.
- Nothing is searched, and `/results` is never shown, until the Search button is tapped.
- Every price on Results and Flight detail carries the "Sample data" label until a live source exists.
- No screen shows a discount, a previous price, or urgency wording.
- `parseSearch()` and `searchFlights()` are pure (same input, same output, no clock and no module state) and import no React. Today and the airport list are passed in.
- A text submit replaces every parsed field, and every entry point into Search (Home pill, example prompt, deal card) calls `reset()` first, so old chips never leak into a new search.
- A flight's dates are resolved once at load from day offsets, in local calendar dates.

**Security model**: no secret and no privileged call, so there is no server verification to add. Free text stays on the device and is never logged or sent anywhere. Guests and signed in users use the same code path.

**Configuration required**: none.

**Analytics** (existing `posthog` instance; properties never include typed text):

| Event | Fires when | Properties |
|---|---|---|
| `search_text_submitted` | arrow or return pressed with text | `chip_count`, `unrecognized_count` |
| `search_chip_edited` | a chip changes through its picker | `field` |
| `search_chip_removed` | a chip is cleared | `field` |
| `results_viewed` | `/results` appears or refreshes | `result_count`, `has_budget`, `has_unrecognized` |
| `deal_opened` | a result card is tapped | `flight_id`, `position` |
| `suggestion_applied` | a no results suggestion is tapped | `kind` |

**Files**:
- New: `src/lib/parseSearch.ts`, `src/lib/parseSearch.check.ts`, `src/lib/searchFlights.ts`, `src/components/chip.tsx`, `src/app/results.tsx`.
- Changed: `src/store/searchStore.ts`, `src/types/travel.ts`, `src/data/flights.ts`, `src/data/deals.ts`, `src/app/search.tsx`, `src/app/(tabs)/index.tsx`, `src/app/flight/[id].tsx` (it has uncommitted edits, build on top of them), and `tsconfig.json` (add `allowImportingTsExtensions`, allowed because `expo/tsconfig.base.json` already sets `noEmit`).
- `parseSearch.ts` imports nothing at runtime except by relative path with a `.ts` extension, and uses only `import type` for types, so Node can run `parseSearch.check.ts` directly.
- `Chip` moves to `src/components/` because Search and Results both use it. `ResultCard` and the banner stay inline, they are used once. `src/lib/` holds the two pure helpers because it is the nearest existing home, although `AGENTS.md` describes it for external service helpers.

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: type "Anywhere from Tunis next month under 300", press the arrow, see four chips, tap Search, see cheaper than 300 flights from Tunis, cheapest first with reasons and the label, verifies **AC-2**, **AC-5**, **AC-6**.
- Partly understood: "Rome in March somewhere warm" gives a Rome chip, a March chip and an Unrecognized chip reading "warm", and the unrecognized chip changes no result, verifies **AC-3**.
- Unsupported currency: "Paris under 400 TND" gives an Unrecognized "400 TND" chip and no budget filter, verifies **AC-3**.
- Parser safety: empty string, only spaces, emoji, 5000 characters and "ParisRomeParis" never throw, verifies **AC-3**.
- Token use: "Paris under 400 TND", "max 5 nights", "21 Aug", "weekend in March", "under 400 and direct" and "Rome to Paris in March" each parse to exactly one reading with no word counted twice, verifies **AC-3**.
- Replace, not merge: typing a second sentence leaves none of the first sentence's chips, verifies **AC-2**.
- Examples: each of the three Home example prompts (the placeholder and the two chips) parses with `unrecognized` empty and returns at least one flight, checked for 365 different values of today, verifies **AC-1**, **AC-11**.
- No results: a search with no match shows only suggestions that each return a flight when applied, verifies **AC-7**.
- Chips and form agree: editing the Where chip changes the Where form row and the reverse, verifies **AC-4**.
- Guest: signed out, the whole path works and Search close goes to `/`, verifies **AC-13**.
- Dates: with the clock set 400 days ahead the sample flights still depart after today, verifies **AC-11**.
- Claims removed: a search of `src/` (not the specs) finds no `dealBadge`, `previousPrice`, `discountPercent`, "fare drop" or `deal-paris-fare-drop`, verifies **AC-10**.
- Ranking: with a one way and a round trip in the same result set, "Cheapest of N" ranks within each trip type only, verifies **AC-6**.

## Build plan

Build approach is **Tracer Bullet**: a thin working path from the Search button to a flight detail first (tasks 1 to 3), then input, then polish.

Every task leaves `npx tsc --noEmit` passing.

1. [x] Clean the data, types and every screen that reads them, in one step so nothing breaks in between. Remove `dealBadge`, `previousPrice` and `discountPercent` from the types and data, the `−N%` badges from both Home lists, and the badge and struck through price from Flight detail. Reword the "fare drop" deal title and rename its id. Expand the sample set to about 12 EUR flights covering all six airports, dates as day offsets (20 to 60 days) resolved at load in local dates, satisfies **AC-10**, **AC-11**.
2. [x] Extend `searchStore` with `anywhere`, `month`, `nights` and `unrecognized`, with the `anywhere` versus `destination` rule inside `setSearchParams`. Write `searchFlights()` with matching, sort, per trip type reason lines and suggestions, satisfies **AC-6**, **AC-7**.
3. [x] Thin path: a plain `/results` route showing the sorted list with reasons and the "Sample data" label, a Search button on the existing form that writes the store and opens it, and Search close returning to `/`. Add the "Sample data" label to Flight detail, satisfies **AC-6**, **AC-13**.
4. [x] Add `allowImportingTsExtensions` to `tsconfig.json`. Write `parseSearch()` and `parseSearch.check.ts` covering every row of the parser table, the token use cases and the safety cases. Run it with `node src/lib/parseSearch.check.ts`, satisfies **AC-3**.
5. [x] Build the missing Search pickers and form rows to the Figma frames (Where and From over `airports.ts`, When with month, dates and nights, Budget), replacing the hotel style local state with the store, satisfies **AC-4**, **AC-5**.
6. [x] Build `chip.tsx` and the text line on Search: empty, parsed, partly understood and from a deal states, dashed empty chips, Search enabled rule, replace on submit, satisfies **AC-2**, **AC-4**, **AC-5**, **AC-9**.
7. [x] Add the chips header to `/results` with live editing, and the no results state with verified suggestions, satisfies **AC-7**, **AC-8**.
8. [x] Home: the entry pill clears the old search and opens Search focused in Flights mode, add the three example prompts, change flight deal taps to open Search with the destination, satisfies **AC-1**, **AC-9**.
9. [x] Send the six analytics events, satisfies **AC-12**.
10. [x] Accessibility pass (roles, labels, 44 point targets), then `npm run lint` and a run on the simulator against the Figma frames, satisfies **AC-14** and re checks **AC-1** to **AC-13** end to end.
11. [x] Rebuild Home to Figma frame `34:12`, because task 8 built the older Home (greeting row, filter button, mode switch, three stacked examples). Replace those with the "Where to?" headline, the "Describe your trip" card with the first example as placeholder, two example chips, the "Ask Afar" link and the "Ideas to start from" strip, and remove the floating assistant button. Keep the entry behavior from task 8, satisfies **AC-1**.

## Consequences

**Positive**:
- A real, guest friendly path with no server, key or cost, built to the approved design.
- `parseSearch()` is one pure function behind one signature, so a server parser can replace it later without touching screens.
- Sample data stops making claims it cannot support, which also matches how regulators treat price claims.

**Negative / tradeoffs**:
- A rules parser handles fixed phrases only. "Somewhere warm" and French or Arabic sentences end up as Unrecognized chips, which is honest but less magical than a language model.
- Only flights work. Home hides the Flights, Hotels and Cars switch, so Hotels and Cars cannot be reached from Home until they have a search of their own.
- Removing the discount badges makes Home look plainer until a live price source exists.
- Twelve sample flights still produce many "no results" screens, which is why the suggestions must be verified.

**Neutral**:
- A new `src/components/` folder starts with one component. A new typed route `/results` is picked up when the dev server regenerates route types.
- Deep links and the existing PostHog events (`travel_search_submitted` and the others) stay; the new events sit beside them.

## Follow-up

- [ ] Deferred states: Search · parsing and Search · offline fallback only exist once a server parser does. They stay in Figma, they are not built here.
- [ ] Hotels and Cars search is out of scope. The mode switch is hidden on Home (decided in Figma frame `34:12`). Decide later whether those modes get their own results and a way back into Home.
- [ ] Other Figma frames still show text the parser cannot read ("4 days somewhere warm", "Warm weekend", "Visa free trips in March") and a Tunis to Istanbul route that is not in the sample data. They are in the Search, Passport and Results sections. Align them or label them as future states.
- [ ] "N adults" and "N kids" are not parsed in this slice, so they show as Unrecognized and the user sets travelers on the form row.
- [ ] Figma says `origin` and `maxBudget` are new fields. The store already has `origin` and `maxPrice`. Fix the Search spec card text.
- [ ] Spec 0004 (Supabase) later replaces the local data this slice reads. The hardcoded flights with day offsets become database rows with a daily date job, `searchFlights()` keeps only its pure parts (reason lines and suggestion candidates) while matching moves into database queries, and AC-13's "no network call" then holds only for the path before 0004. Keep this slice's code as it is until 0004 is built.
- [ ] `parseSearch.check.ts` is a plain assert script because the project has no test runner. Revisit when a runner is added.
- [ ] Review note kept from the cross check: slice one sets `allowImportingTsExtensions` in `tsconfig.json` only so the check script can run. If a test runner arrives, drop it.

## Rationale

- **Local parser over a server model** (runner up: a Clerk verified server route). Guests have no Clerk token and `AGENTS.md` requires verifying every caller, so a server route would force sign in for the first search, against the guest decision. The local parser is free, instant and offline, and the `parseSearch()` boundary keeps the upgrade cheap.
- **Entry card that opens Search** (runner up: a real input on Home). The Home card looks like an input but is a tap target. One screen owns the line, chips and parsing, so there is nothing to keep in sync. It costs one tap, which the focused keyboard softens.
- **Day offsets for sample dates** (runner up: hand edited dates). It stays correct forever and keeps results honest, at the price of one small helper.
- **Strict budget filter** (runner up: show over budget results last). It makes the "raise budget" suggestion meaningful and matches the no results spec card.
- **Bare number means EUR, shown in the chip** (runner up: treat as unrecognized). It saves a correction in the common case, and the chip makes the assumption visible and editable.
