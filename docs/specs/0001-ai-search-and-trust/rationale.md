# 0001. AI search and trust: rationale

The decision record for [index.md](index.md). `/develop` does not read this file.

## Context

> ⚠️ Premise note: the prototype spec cards describe a server side parser, `POST /api/parse-search`, verified with the Clerk token, while also saying "nothing asks the user to sign in". A guest has no Clerk token, so those two statements cannot both hold. The slice one spec resolves it with a local parser (see the child's Rationale). Also, the cards call `origin` and `maxBudget` new fields, but `searchStore` already has `origin` and `maxPrice`. And the research behind most decisions is moderate to weak, so some decisions are bets to test, not facts.

Afar is an Expo and React Native travel app on Clerk, Zustand and hardcoded sample data. Today a person can browse Home, fill a hotel style "Where to?" form, and that is all: the Search button only records an analytics event, there is no results screen, and the Home deal cards advertise discounts the sample data cannot support.

A long UX session reframed the product. The finding is that people want AI help but not AI deciding for them, so the gap is trust, not capability. Two behavior based segments were chosen (travelers limited by visa, passport or payment, and flexible deal hunters), the product is international, and the audience is both a portfolio case study and real users, which means no claim may be invented. Six ideas were picked for the first prototype (natural language chips, passport and visa, deal reasons with a source label, assistant action cards with undo, helpful no results, deal tap prefill), a prototype of 19 screens was built in Figma with a spec card each, and a research pass tested whether opening on search, signing in late and showing visa badges are defensible.

Constraints that shape the build: sample data only, no price source chosen, no database installed, Clerk is the only auth, guests can already reach Home and Search but not Saved, Trips or Profile, `AGENTS.md` forbids a new major dependency without sign off, and nothing in the prototype has been built in code. Not deciding means the Figma file and the app keep drifting apart, and the next screens get built from ten disconnected spec cards.

## Options considered

### Option 1: One big spec for the whole prototype

Write a single spec covering all 19 screens: passport, search, results, assistant cards, activity, Supabase.

**Pros**:
- One place to read, no cross references.

**Cons**:
- It mixes independent decisions (a parser, a visa dataset, a database link, an agent tool). The build plan would be long, wrong in its later half, and blocked on a price source and a database that are not decided.

### Option 2: Umbrella with slices, natural language search first

An umbrella holds the shared rules and the order. Each slice is a child spec built end to end. Slice one is natural language search and results.

**Pros**:
- Slice one needs no database and no price data, so it can ship alone.
- Shared trust rules are written once.

**Cons**:
- The most distinctive ideas (passport, assistant that acts) land later.
- Several documents to keep in step.

### Option 3: Foundation first, then features

Build Supabase, the Clerk link and the price source first, then every feature on real persistence.

**Pros**:
- Everything after it is real, with no simulated alerts.

**Cons**:
- Weeks of plumbing before a user sees any change, and the price source is still an open question that plumbing cannot answer.

## Rationale

Option 2. The forces in Context point one way: two of the biggest dependencies (a database and a price source) are undecided, while the core UX idea, showing the app's reading as editable chips and explaining results honestly, needs neither. Option 1 would put decisions that depend on the unknowns into a spec that has to be right on day one. Option 3 delays all visible value and still leaves the price source open.

Starting with search also exercises the whole path (input, parsing, state, results, detail) in the smallest form, which is what a Tracer Bullet needs. It makes the cheapest test of the riskiest assumption: that chips are a better way to express a trip than a form, an assumption with no precedent found in the research. It leaves the passport slice, which is the strongest differentiator on the evidence, as the immediate next step, and it can stay on the device.

The engineer chose the first slice, the Supabase timing, guest access, and the build approach from the options offered. Each matched the recommendation.

A cross check by a different model, read only, found 16 issues. All were checked against the code and applied on the main thread: a token consuming rule for the parser, an `unrecognized` field in the store, replace not merge on submit, a build task for the missing Search pickers, removing every discount reader in task 1 so the app keeps type checking, passing today and airports into the parser, ranking "Cheapest" within one trip type, dropping the "within budget" line, a grep limited to `src/`, example prompts with no date phrases, the weekend and month rules, filler word gaps, a fifth suggestion, the `.ts` import setting, and two stale claims.

## Evidence inventory

What the UX work produced, and where it lives:

| Artifact | Where | State |
|---|---|---|
| Empathize and Define notes | `docs/afar-ux/01-empathize.md`, `02-define.md`, README decisions log | Hypotheses. README is stale: says Ideate and Prototype not started |
| FigJam: ideation, empathize, define, research and decisions | Board `kijFqtSdmit2Bi9fgrox8j` | Complete. The ideation table sorts ideas into Now, Later, Parked |
| Research report | `reports/Core action first UX psychology.md` | Complete, mostly secondary sources, gaps stated in it |
| Prototype screens and spec cards | Figma `Zu9er04NQhDzoHhZirL7LY`, page Screens | 19 new screens, all marked Proposed. The plugin API cannot set Ready for dev |
| Brand kit and rebuilt original screens | Figma Brand Guidelines page and the Screens page | Originals rebuilt as editable layers, screenshots archived |

The Now, Later and Parked sort:
- **Now**: natural language chips, passport and visa, deal reason with source label, assistant cards with activity log, no results next steps, deal tap prefill.
- **Later**: total trip cost and "cheap but painful" tag, French and Arabic with right to left and local currency, saved destination alerts, stale data handling.
- **Parked**: book now or wait signal (needs real price history), progressive one question search, start anywhere from a photo, group boards, trip aware bundling.

Research decisions already applied in Figma, with their strength as recorded on the board: open on search with no tour and no sign in (moderate to weak), sign in at save, alert or book (moderate to weak), chips as the source of truth (moderate to weak, no precedent), example prompts (weak), form behind a link (weak), passport asked in context (weak), visa badge with source and date (weak), no discount or urgency claims on sample data (strong for price honesty, inference for sample data), assistant proposes, previews and confirms (moderate, from surveys), voice optional and text first (weak, no Tunisian dialect data).

Mismatches found between the design record and the code, all handled in the specs:
- Spec cards say a Clerk verified parse route and also no sign in. Resolved with a local parser.
- Cards call `origin` and `maxBudget` new. The store has `origin` and `maxPrice`; no screen uses the store yet.
- Flight detail and the Home deal lists still show discounts and "fare drop" titles. Four deals carry a `discountPercent` (two flights, two cars). Removed in slice one.
- Sample flights are dated August to October 2026, mostly past. Moved to day offsets.
- Sample set has 5 flights, 2 currencies. Widened to about 12, all EUR.
- Search's close button sends a signed out user to `/onboarding`, against guest access. Fixed in slice one.
- `AGENTS.md` says no database and the UX session assumed Supabase. Recorded as approved in principle, added only when a slice needs it.

Open and unresolved: where live fares come from, where verified visa data comes from, how Supabase learns the Clerk user, and whether any real user can be recruited for the interviews the Empathize phase planned.
