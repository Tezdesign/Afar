# 02 — Define

Status: **draft built on unvalidated hypotheses** from [01-empathize.md](01-empathize.md). Revise after
interviews; the structure should survive, the wording may not.

## Archetypes (assumption-based, not personas)

**A. The constraint-heavy traveler.** Their passport, visa rules or payment options limit where they can
go and how they pay. They check several sources because one wrong assumption can cost the whole trip.
- Needs: to know early what they *can* do, and to trust the number they see.
- Frustrations: finding out about visa or payment blockers late; hidden costs; urgency pressure.

**B. The flexible deal-hunter.** Open destination and dates; wants the best value, not a specific place.
- Needs: to express a loose idea ("warm, under 400, in March") and see why a result is a good deal.
- Frustrations: filters that assume a fixed destination; no way to judge if a price is actually good.

## Core insight

People want AI help planning travel but do not want it deciding for them. The gap is **trust**, not
capability. The product that wins is the one that makes the human/AI split of control visible.

## Problem statement

Travelers who are constrained or flexible spend too much effort and carry too much doubt when finding a
flight: filters don't match how they think, deals aren't explained, hidden costs and blockers appear late,
and assistants either do too little or act without asking. They need a way to search naturally, understand
*why* a result is good or bad, and let an assistant help while keeping the final say.

## Point-of-view statements

- A **constraint-heavy traveler** needs to see what is possible on their passport *before* they fall in love
  with a result, because discovering a visa or payment blocker late wastes their time and trust.
- A **flexible deal-hunter** needs to describe a trip loosely and see how the app interpreted it, because
  rigid filters force them to guess a destination first.
- **Both** need an assistant that proposes and explains but never commits without their explicit
  confirmation, because acting on their behalf is where trust is won or lost.

## How might we...

1. ...let someone describe a trip in their own words and **see and correct** how the app understood it?
2. ...show **why** a result is a good (or bad) deal using only claims the data supports?
3. ...surface **visa and passport** constraints at the start, not the end?
4. ...reveal **total cost and trip pain** (bags, transfers, bad layovers) before the user commits?
5. ...let an assistant **act on the user's behalf** while the user always confirms and can undo?
6. ...express **uncertainty honestly** ("medium confidence", "checked yesterday") without losing the user?
7. ...keep the experience coherent across **languages, currencies and regions**?
8. ...fail **gracefully** when there are no results or the data source is slow?

## Design principles

1. **Show the interpretation.** The AI's reading of the user's request is visible and editable.
2. **Human decides, AI proposes.** Anything with a cost or commitment ends in a tap, never a spoken yes.
3. **Say only what the data supports.** No invented history, no fake urgency.
4. **Honest about uncertainty.** Confidence and data freshness are shown, not hidden.
5. **Passport-aware by default.** Constraints are filters from the first screen, not footnotes.
6. **The card is the record.** Assistant proposals are persistent, undoable cards; voice is an input mode,
   not the source of truth.

## Scope for the first slice

Mapping HMWs to features, chosen for impact over effort:

| Feature | HMW | In first slice? |
|---|---|---|
| Natural-language search with editable chips on the home search card | 1 | Yes |
| Passport / visa-aware filtering | 3 | Yes |
| Deal explanations (data-supported only) | 2, 6 | Yes, limited to what data supports |
| Assistant with Plan → Preview → Confirm, one mode (always confirm) | 5 | Yes, built on the existing voice assistant with cards |
| True-cost view | 4 | Later |
| Taste-swipe onboarding | — | Later |
| Group trips, post-booking assistant, MCP server | — | Parked |

## Success criteria (qualitative, to test)

- A user can state a trip loosely and correct the AI's reading in one tap.
- A user can say *why* a highlighted deal is good in their own words.
- A user never reports being surprised by a visa, payment, or cost issue late in the flow.
- A user understands exactly what the assistant did and can undo it.

## Constraints

- International product; both portfolio and real users.
- Real data via Supabase for Afar's own data; the **price source is undecided**.
- Auth is Clerk; the Supabase link to Clerk identity is an open design decision.

## Assumptions to validate (carried from Empathize)

- Constraint-heavy travelers are underserved by current apps on visa/payment info.
- Users distrust urgency messaging and want explained deals.
- Users accept AI help but not AI autonomy (the 89% / 12% figure comes from a secondary source and is
  unverified; do not cite it without tracing the original).
- Voice is useful for open-ended asks, with confirmation always by tap.
