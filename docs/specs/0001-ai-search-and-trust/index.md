# 0001. AI search and trust (umbrella)

**Date**: 2026-10-14
**Status**: Proposed

## Summary

This umbrella turns the UX work (empathize, define, ideate, prototype, and a research pass) into a build plan for Afar. The idea: people want AI help planning travel but not AI deciding for them, so Afar searches the way people talk, shows how it understood them, says only what its data supports, and never commits anything without a tap. The work is too big for one spec, so it is split into slices. Slice one, natural language search and results, is fully specified and is the first thing to build. The later slices are listed here so their order and shared rules are fixed now.

## Structure

- [0001-natural-language-search.md](0001-natural-language-search.md): a typed trip becomes editable chips, then honest flight results. Local only, no database. Supports outcomes O-1 and O-2.

Planned children, not written yet (each gets its own `/architect` session when its turn comes):

| Order | Slice | Supports | Needs first |
|---|---|---|---|
| 2 | Passport and visa awareness: `passportCountry`, picker, curated visa list with source and last checked date, badges, the in context passport prompt on Results | O-3 | Slice one (Results exists). Stays on the device at first. A verified visa source before shipping |
| 3 | Guest access and sign in on demand: Saved and Trips stop redirecting, a sign in prompt appears at save, alert or book | O-1 | Slice one. Rework of the onboarding screen into that prompt |
| 4 | Supabase and Clerk link: how Supabase learns the Clerk user, profile, alerts and the activity log tables | O-4 | Your sign off for the dependency (granted in principle, see Cross child contract) |
| 5 | Assistant action cards and activity log: Plan, Preview, Confirm cards on the voice call, `create_alert` tool, undo, the Activity screen | O-4 | Slice 4. A price source decision for alerts to be more than a demo |
| 6 | Later: total trip cost, French and Arabic with right to left, local currency, stale data handling | O-2 | A live price source and layover and fee data |

Recommended order is the table order. Slice 2 comes before 3 because the passport is the most distinctive idea and can stay local. Slice 3 comes before 4 because it changes behavior people see, while 4 is plumbing. Reorder freely, the contract below does not depend on the order.

## Requirements

Slice level criteria (`AC-N`) live in each child. These are the umbrella outcomes the children add up to. They come from the Define success criteria and are qualitative, to be tested with real people.

- **O-1**: A person can state a trip loosely, correct the app's reading in one tap, and reach results as a guest.
- **O-2**: A person can say why a highlighted result is good, in their own words, and never meets a claim the data does not support.
- **O-3**: A person is never surprised late by a visa, payment or cost issue.
- **O-4**: A person understands exactly what the assistant did and can undo it.

## Decision

**Chosen option**: deliver the UX work as a series of thin, independently shippable slices under one umbrella, starting with natural language search and results, with one shared set of rules that every slice must obey.

**Implementation skills**: `expo-tailwind-setup` (`.agents/skills/expo-tailwind-setup/`) · `ui-layout-master` (`.claude/skills/ui-layout-master/`) · `stream-react-native` (`.agents/skills/stream-react-native/`, slice 5 only) · `clerk-expo` (`.agents/skills/clerk-expo/`, slices 3 and 4)

**Design source** (chosen by the engineer: from Figma): file `Zu9er04NQhDzoHhZirL7LY` (Afar), page Screens. Sections: Passport `154:2`, Search natural language `155:62`, Results and detail `157:170`, Assistant actions `160:262`, Activity `160:527`, and the handoff overview `162:361` (four cards: flow, components and tokens, data and API, open decisions). Every screen has a spec card beneath it. The first slice reads only the Home, Search and Results frames. Original screenshots are archived in sections named "Archive" and are not a build source.

## Cross child contract

Rules every slice must follow:

1. **Say only what the data supports.** No invented history, discount, previous price or urgency. A line such as "Cheapest of 6" is allowed because it is computed from the result set.
2. **Label the source.** Every price carries "Sample data" until a live price source exists.
3. **Show the interpretation.** Anything the app inferred from the user (chips, a passport based badge) is visible and editable.
4. **Human decides, AI proposes.** Anything with a cost or a commitment ends in a tap, never a spoken yes. Voice is an input mode, the card is the record.
5. **Unknown is a valid state.** A visa rule with no source shows "Check visa", never a guess.
6. **Guests first.** Browsing, searching and results never require an account. Sign in is asked at save, alert or book.
7. **Verify every caller.** Any server route follows the existing shape: `getVerifiedClerkUserId()` first, then the privileged call. Never trust a client supplied user id.

Shared decisions:

- **Database**: Supabase is approved in principle for Afar's own data (profile, alerts, activity log). It is added only by the slice that needs it, and the Clerk link gets its own spec first. Until then, state stays in Zustand and AsyncStorage, scoped per account as `AGENTS.md` describes.
- **Price source**: undecided. Until it is, prices are sample data and alerts are simulated and labelled demo.
- **Data shapes in `searchStore`**: `origin`, `destination`, `anywhere`, `month`, `nights`, `departDate`, `returnDate`, `maxPrice`, `directOnly`. Later slices add fields, they do not rename these.
- **New routes across the umbrella**: `/results` (slice 1), `/activity` (slice 5), a passport step inside `/onboarding` and a passport row in Profile (slice 2). The assistant stays the global floating button plus the entry inside the search line.
- **Analytics**: product questions are answered with the existing PostHog instance. The research test list (deals strip, chips against a plain answer, visa badges, sign in timing, voice against text) is run as experiments, not assumed.

## Build plan

Build approach is **Tracer Bullet**, taken from the engineer's answer (no approach was recorded in `AGENTS.md`, whose Build approach line is still unset). Each child is itself a thin end to end slice.

1. Build child 0001, natural language search and results, satisfies **O-1**, **O-2**.
2. Write and build the passport and visa child, satisfies **O-3**.
3. Write and build the guest access and sign in on demand child, satisfies **O-1**.
4. Write the Supabase and Clerk link child, then build it, satisfies **O-4**.
5. Write and build the assistant action cards and activity log child, satisfies **O-4**.
6. Revisit the Later slice once a price source is chosen, satisfies **O-2**.

## Consequences

**Positive**:
- Each slice is shippable alone, so progress is visible early and wrong guesses are cheap.
- The shared rules are written once, so no slice has to rediscover the trust decisions.

**Negative / tradeoffs**:
- The research behind several decisions is moderate to weak, and chip style interpretation has no competitor precedent. Some decisions may be reversed by the tests.
- The strongest idea (the assistant that acts) is last, because it depends on a database and a price source that do not exist yet.

**Neutral**:
- `AGENTS.md` still says no database unless asked. When slice 4 is written, update that line.
- This spec supersedes nothing. `docs/afar-ux/` stays as the design thinking record.

## Follow-up

- [ ] Run `/scope` to give this umbrella a scope row, since `docs/scope/` does not exist yet and `AGENTS.md` says Build approach is unset.
- [ ] `docs/afar-ux/README.md` says Ideate and Prototype have not started. Update it, since both are done in Figma and FigJam.
- [ ] Add the Figma file link and the umbrella spec to `AGENTS.md` (the `/sync` skill owns that file).
- [ ] The visa values in the prototype are illustrative. A verified source is required before slice 2 ships.
- [ ] The 89% and 12% survey figures come from a secondary source and the original PDF was not read. Do not quote them in any public material.
- [ ] `main` is one commit ahead of this branch. Pull before building.

## Rationale

Reasoning, options and the evidence inventory: see [rationale.md](rationale.md).
