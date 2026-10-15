# 0002. Passport and visa awareness (slice two)

## Summary

Slice two lets a person say which passport they travel on, then shows what that passport needs to enter each destination. A small badge (`Visa-free`, `Visa needed` or `Check visa`) appears on flight results, flight detail and flight deals on Home. A fuller card on flight detail names the rule and where it came from. It runs on the device only, with no database and no new service. Every rule is labelled "Sample data" until someone checks it against an official source, and a pair with no rule says `Check visa` instead of guessing.

## Requirements

**User stories**:
- As a traveler with visa limits, I want to set my passport once, so that every flight shows what I need before I fall for it.
- As a guest, I want to set my passport without signing in, so that I get the value before I give anything.
- As any traveler, I want to see where a visa rule came from and whether anyone has checked it, so that I know how far to trust it.
- As any traveler, I want an honest "Check visa" when the app has no rule, so that I am never told something it does not know.

**Acceptance criteria** (the contract, each one independently checkable):
- **AC-1**: A new `passportStore` holds `passportCountry` (an ISO 3166 alpha 2 code such as `TN`, or null). It is saved on the device in a bucket named `passport-store:<scope>` and is registered in `applyStorageScope()` in `src/app/_layout.tsx`, so each signed in account and the guest have their own value. Changing it updates every screen that shows a badge or card without a reload.
- **AC-2**: When the scope changes from `guest` to an account and that account has no passport, the guest passport is copied to the account once, after the account bucket has finished loading. It never overwrites an account value, never copies between two accounts, and never copies from an account back to the guest.
- **AC-3**: `getVisaResult(passportCode, destinationCode)` is pure and never throws. It returns `null` when the passport is the destination's own country, `{ status: "unknown" }` when the passport is null or no rule exists for the pair, and `{ status, rule }` when a rule exists. Matching uses ISO codes only.
- **AC-4**: The first rule list has eight sample rules: Tunisia to France, Spain, Italy, the United Kingdom and the United States (all `visa-required`), and France to Spain, Italy and Tunisia (all `visa-free`). Every rule has `verified: false`. An unverified rule shows the "Sample data" label and "Not verified". A verified rule shows "Checked" with its `lastChecked` date and its `source`, and no "Sample data" label (Figma frame `202:676`). The card text comes from the rule's `note` and nothing else.
- **AC-5**: A `VisaBadge` component shows the three states from the Figma frames, with label, icon and tint (`Visa-free` on `go/50`, `Visa needed` on `ember/100`, `Check visa` on `line`). It never relies on colour alone. Its accessibility label names the status and the passport, or says the passport is not set. It renders nothing when the result is `null`.
- **AC-6**: Flight detail shows a visa card in four states, matching Figma: passport not set (a "Set passport" button), `Visa-free`, `Visa needed`, and `Check visa` with a passport set but no rule. A rule state shows the badge, the passport name, one sentence built from `rule.note`, the data label ("Sample data" and "Not verified", or "Checked" with the date and the rule's `source`) and a line pointing to the official source. The `Check visa` state with a passport set makes no claim and shows no "Sample data" label. The card is absent when the result is `null`.
- **AC-7**: A `PassportSheet` bottom sheet shows a "Not set" row first, then the 12 countries in `data/passports.ts`, with a search field. Choosing Not set and tapping Done clears the passport (`passportCountry` becomes null). Tapping a row selects it, Done saves and closes, and tapping the scrim, swiping down (iOS) or the system back action (Android) closes without saving. A search with no match says "No countries found". It opens from Profile, from the flight detail card and from the Results prompt. It is built with React Native `Modal`.
- **AC-8**: On `/results`, each flight card shows a `VisaBadge` on the row with the "Sample data" label. When the passport is unset, the results are visible and the prompt has not been dismissed this session, a prompt shows above the list with "Set passport" and "Not now". "Not now" hides it for the rest of the session. It returns the next time the app opens, never on every search.
- **AC-9**: On Home, every flight deal card shows a `VisaBadge`, on both the hero card and the Trending rows. On the hero card the badge sits top right on the photo, opposite the "Sample data" label. On a Trending row it sits right aligned under the price. Hotel and car deals show none. A deal whose flight cannot be found shows none.
- **AC-10**: Profile shows a Passport row above Language, in the same card, with the current country or "Not set". Tapping it opens the sheet. The row is shown only to signed in users (Profile needs sign in until the guest access slice).
- **AC-11**: Four analytics events go through the existing `posthog` instance (see the table in `## Feature design`). No event carries the passport country or the passport code.
- **AC-12**: Until the saved passport has loaded, badges, the visa card and the Results prompt render nothing, so a returning user never sees a flash of `Check visa`.
- **AC-13**: The path works fully as a guest. No Clerk call, no network call, no new dependency and no new env var is added. The new colour `go/50` is added to `src/global.css` and `src/theme/colors.ts` before any screen uses it.
- **AC-14**: The sheet rows, the Set passport and Not now buttons, and the Profile row are buttons with `accessibilityRole="button"` and a label that names the field and state (for example "Passport, Tunisia, tap to change"). Touch targets are at least 44 points tall.

## Decision

**Chosen option**: build slice two entirely on the device. A small curated and honestly labelled rule list, a persisted `passportStore` scoped per account, a pure `getVisaResult()`, one `VisaBadge` and one `PassportSheet` used in four places.

**Implementation skills**: `expo-tailwind-setup` (`.agents/skills/expo-tailwind-setup/`) · `ui-layout-master` (`.claude/skills/ui-layout-master/`)

**Design source** (chosen by the engineer: from Figma): file `Zu9er04NQhDzoHhZirL7LY` (Afar), page Screens. Build to these frames and their spec cards: Profile · passport `154:63`, Passport · picker sheet `154:126` (with the Not set row), Home · visa badges `194:615`, Home · hero and trending badges `202:740`, Deal detail `157:330` (visa needed), Deal detail · visa free `194:713`, Deal detail · set passport `194:783`, Deal detail · check visa `198:662`, Deal detail · verified `202:676`, Results `157:171` and Results · passport not set `188:571`. Frame Onboarding · passport `154:3` is superseded and is not built. Frame `194:615` draws the badge on an "Ideas" card, and frame `202:740` draws it on the hero card and the Trending rows the code has today. The source text in the verified frame is a placeholder. Tokens come from `src/global.css`.

## Feature design

**Data model sketch** (confirmed by the engineer; all local, nothing sent anywhere):

| Entity | Fields | Rule |
|---|---|---|
| `PassportSetting`, in the new persisted `passportStore` | `passportCountry`: ISO alpha 2 code or null. `ready`: boolean, not persisted, starts false and becomes true only after the first `applyStorageScope()` has finished loading. `promptDismissed`: boolean, not persisted | One passport per account or guest. Stored as `passport-store:<scope>`. Only `passportCountry` is persisted (`partialize`). `ready` is false while a scope is loading |
| `PassportCountry`, new list in `src/data/passports.ts` | `code`, `name` | 12 entries: TN Tunisia, FR France, DE Germany, IT Italy, ES Spain, GB United Kingdom, US United States, MA Morocco, DZ Algeria, EG Egypt, TR Turkey, CA Canada |
| `Airport`, changed | add `countryCode` | TUN is `TN`, CDG is `FR`, BCN is `ES`, FCO is `IT`, LHR is `GB`, JFK is `US`. The existing `country` name stays for display |
| `VisaRule`, new list in `src/data/visaRules.ts` | `passport` code, `destination` code, `status` (`visa-free` or `visa-required`), `note`, `source`, `verified`, optional `lastChecked` (ISO date, set only when `verified`) | Unique per passport and destination pair. `note` is a complete phrase, for example "Schengen short stay visa needed" or "No visa needed under EU free movement". `source` for the sample list is "Afar sample list" |
| `VisaResult`, derived, never stored | `status` (`visa-free`, `visa-required`, `unknown`), optional `rule` | `null` when passport and destination are the same country |

**Relationship**: `Flight.destinationCode` leads to `Airport.countryCode`, which is matched with `VisaRule.destination` for the user's `passportCountry`. A flight whose airport is missing has no result.

**State transitions**:
- Passport: `unset` → (sheet Done) → `set` → (sheet Done with another country) → `set`. Choosing Not set in the sheet and tapping Done moves it back to `unset`.
- Results prompt: `hidden` while the store is not ready or the passport is set, `shown` when unset and visible, `dismissed` after Not now until the app restarts. Setting a passport also hides it.
- Visa card: `not set`, `visa-free`, `visa-required`, `unknown`, or absent (domestic). Changing the passport moves between them at once.

**Card text** (built only from rule data): `visa-free` shows the `note` and a full stop. `visa-required` shows the `note` and a full stop, then "Apply before you book." `unknown` with a passport set shows "We have no rule for this passport and trip yet." All rule states add "Check the official source before you book." No text says how long a visa takes, what it costs, or how long a stay may last.

**Guest to account copy** (AC-2): before `applyStorageScope()` switches, remember the current passport only when the old scope is `guest` and the new scope is an account. Set `ready` to false, await the account bucket's rehydrate, then copy only if the account value is still null. If rehydrate fails, skip the copy and still set `ready` to true.

**API surface**: none. No route handler, no network call, no secret.

**Key invariants**:
- A visa claim exists only as a `VisaRule` row. Screens never write their own visa text.
- A pair with no rule is `unknown`. Nothing guesses, and nothing falls back to a similar country.
- An unverified rule is always labelled "Sample data". Setting `verified: true` without a `lastChecked` date is a data error and `visa.check.ts` fails on it.
- `getVisaResult()` is pure (same input, same output, no clock, no store, no React).
- Badge, card and prompt render only when `ready` is true.
- No analytics event carries the passport country or code.
- The passport is stored on the device only and never leaves it.

**Security model**: no server, so no verification to add. The passport country is personal data (nationality), so it stays in the device store and is never logged, sent to PostHog, or put in a URL. Guests and signed in users use the same code path. The cross child contract rules 1, 2, 5 and 6 apply in full.

**Configuration required**: none. One new token, `--color-go-50: #e5f5ee` in `src/global.css` and `go50: "#E5F5EE"` in `src/theme/colors.ts`.

**Analytics** (existing `posthog` instance; no event carries the country or code):

| Event | Fires when | Properties |
|---|---|---|
| `passport_set` | Done is pressed in the sheet with a changed value, including Not set | `source` (`profile`, `detail` or `results`), `action` (`set` or `cleared`) |
| `passport_prompt_shown` | the Results prompt appears | none |
| `passport_prompt_dismissed` | Not now is pressed | none |
| `visa_badges_viewed` | `/results` or flight detail finishes showing badges, once each time the screen is focused and once more if the passport changes while it is open | `surface` (`results` or `detail`), `visa_free`, `visa_needed`, `unknown` (counts) |

Home sends no event, because it would fire for every card on every scroll.

**Files**:
- New: `src/data/passports.ts`, `src/data/visaRules.ts`, `src/lib/visa.ts`, `src/lib/visa.check.ts`, `src/store/passportStore.ts`, `src/components/visa-badge.tsx`, `src/components/passport-sheet.tsx`.
- Changed: `src/types/travel.ts`, `src/data/airports.ts`, `src/app/_layout.tsx`, `src/app/(tabs)/profile.tsx`, `src/app/flight/[id].tsx`, `src/app/results.tsx`, `src/app/(tabs)/index.tsx`, `src/global.css`, `src/theme/colors.ts`. Several of these have uncommitted edits from slice one, so build on top of them.
- `visa.ts` and the data files import types only with `import type` and relative paths with a `.ts` extension, so `node src/lib/visa.check.ts` runs directly, the same way `parseSearch.check.ts` does.
- `VisaBadge` and `PassportSheet` move to `src/components/` because each is used in three or more places.

**Critical test scenarios** (each maps to an acceptance criterion):
- Lookup table: for every passport in the list against all six airport countries, the result matches the eight rules and is `unknown` otherwise, and `null` for the passport's own country, verifies **AC-3**, **AC-4**.
- Unverified labelling: every rule in the list has `verified: false` and shows "Sample data"; a rule with `verified: true` and no `lastChecked` fails the check, and so does a duplicate passport and destination pair, verifies **AC-4**.
- Never throws: a null passport, an unknown destination code, an empty string and a code in the wrong case all return without throwing, verifies **AC-3**.
- Guest copy: a guest sets `TN`, signs in to an account with none, and the account shows `TN`; an account that already had `FR` keeps `FR`; signing out and into a second account copies nothing, verifies **AC-2**.
- Clearing: with `TN` set, choosing Not set and Done sets `passportCountry` to null, every badge reads `Check visa`, and the event has `action: cleared` and no country, verifies **AC-7**, **AC-11**.
- Scope isolation: account A sets `TN`, account B on the same device sees none, verifies **AC-1**.
- No flash: with a slow load, the first frame shows no badge and no prompt, then the right ones, verifies **AC-12**.
- Results prompt: unset passport shows the prompt; Not now hides it and badges read `Check visa`; reopening the app shows it again; setting a passport hides it and updates every badge without leaving the screen, verifies **AC-8**.
- Detail states: Tunisia to France shows `Visa needed`, France to Spain shows `Visa-free`, France to Morocco shows `Check visa` with no "Sample data" label, no passport shows the Set passport card, and a French passport on a flight to France (the passport's own country) shows no card, verifies **AC-6**.
- Home: a flight deal shows a badge on the hero card and the Trending row; a hotel deal shows none, verifies **AC-9**.
- Analytics: set a passport from the sheet and read the captured payloads, none contains `TN` or "Tunisia", verifies **AC-11**.
- Guest: signed out, the whole path works with no Clerk call and no network call, verifies **AC-13**.

## Build plan

Build approach is **Tracer Bullet** (the umbrella's default, because `AGENTS.md` still records none): a thin working path from a stored passport to one real badge first, then the picker, then each surface.

Every task leaves `npx tsc --noEmit` passing.

1. Add `go/50` to `src/global.css` and `src/theme/colors.ts`. Add the types, `data/passports.ts`, `data/visaRules.ts`, `countryCode` on `airports.ts`, and the pure `lib/visa.ts` with `visa.check.ts`. Run `node src/lib/visa.check.ts`, satisfies **AC-3**, **AC-4**, **AC-13**.
2. Add `passportStore` with `partialize`, the `ready` flag and `promptDismissed`. Register it in `applyStorageScope()` and add the guest to account copy, satisfies **AC-1**, **AC-2**, **AC-12**.
3. Thin path: a basic `passport-sheet.tsx` (list and Done only) opened from the new Profile Passport row, and `visa-badge.tsx` on the flight detail screen, so a passport chosen in Profile shows a real badge end to end, satisfies **AC-5**, **AC-10**.
4. Finish the sheet to the Figma frame: the Not set row, search field, "No countries found", scrim, swipe and back cancel without saving, and labels, satisfies **AC-7**, **AC-14**.
5. Build the full visa card on flight detail in its four states, including the Set passport state that opens the sheet, satisfies **AC-6**.
6. Results: the badge on each card and the passport prompt with Not now, satisfies **AC-8**.
7. Home: the badge on the hero card and the Trending rows for flight deals. Build to Figma frame `202:740`, satisfies **AC-9**.
8. Send the four analytics events, satisfies **AC-11**.
9. Accessibility pass (roles, labels, 44 point targets), then `npm run lint` and a run on the simulator against the Figma frames, satisfies **AC-14** and re checks **AC-1** to **AC-13** end to end.

## Consequences

**Positive**:
- Passport awareness works as a guest, with no server, key or cost, built to the approved design.
- The rule list is honest by construction: an unverified rule says so, and a missing rule says `Check visa`.
- One pure lookup and one store make the later move to Supabase a swap behind the same functions.

**Negative / tradeoffs**:
- Only two passports have rules, so most people see `Check visa` everywhere. That is honest, but the feature looks thin until the list grows.
- The eight rules are samples. Until someone verifies them, the label says "Sample data" even where the rule is probably right.
- A guest's passport lives only on that device. Signing in on a second device starts empty until a later slice syncs it.

**Neutral**:
- The new store adds one more bucket per account to `applyStorageScope()`, and the guest copy adds the first cross scope step in that function.
- `Airport` gains `countryCode`, which later slices can reuse for local currency and language.

## Follow-up

- [ ] Verify the eight sample rules against official sources, then set `verified: true` and `lastChecked` on each. Until then the labels stay. This is required before any release.
- [ ] Update `AGENTS.md` (through `/sync`) to mention `passportStore` in the scoped stores list and `src/components/`.
- [ ] The umbrella cross child contract says a passport step inside `/onboarding`. This slice drops it, so the umbrella text was updated. Check slice three does not assume it.
- [ ] Run the research test "visa badges against none" as an experiment once the list is verified, using the four events above.
- [ ] Hotels and cars have no visa badge, since entry rules depend on the destination country, not the product. Revisit when hotel search exists.
- [ ] Syncing the passport across devices needs the Supabase and Clerk link slice.
- [ ] Review the sample `note` wording with a native speaker before translating it into French and Arabic (slice six).

## Rationale

- **Ask in context, drop the onboarding step** (runner up: an optional first run screen). Search first and sign in on demand mean a person reaches a result before any question, and the moment a visa matters is the moment they see a destination. It also removes a dependency on the sign in slice.
- **Copy the guest passport to the account if empty** (runner up: keep the buckets separate, like saved deals). A person who sets a passport as a guest and then signs in to save would otherwise watch it vanish, which reads as a bug. The rule is small and only runs once.
- **Tunisia and France only** (runner up: Tunisia only). It is small enough for the engineer to verify, and it includes a visa free example so every badge state can be seen.
- **ISO codes, not country names** (runner up: names, which match `Airport.country`). Names break on spelling and translation (slice six adds French and Arabic). Adding `countryCode` to six airports is cheaper than fixing lookups later.
- **Render nothing until the store is ready** (runner up: show `Check visa` first). A flash of a wrong status costs trust and the wait is milliseconds.
- **Status and source only in analytics** (runner up: include the country). Nationality is personal data and the experiment needs only the badge status.
- **`Modal` bottom sheet to the Figma frame** (runner up: an inline dropdown like Language). Figma is the design source, and one sheet serves three entry points.
- **A Not set row in the sheet** (runner up: no way to clear). Without it a wrong pick can only be swapped for another country, and a person who no longer wants badges cannot turn them off.
- **Card text from `rule.note` only.** The Figma copy said how long a visa takes, which no rule can back, so the Figma text was trimmed to match the data.
