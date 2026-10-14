# 01 — Empathize

Status: **hypotheses, not yet validated.** Nothing here comes from user research yet. Every claim below is
an assumption to test through interviews, review mining and competitor walkthroughs.

## Goal

Understand how people actually find and book travel, and where they lose confidence, before deciding what
Afar does. Market research (see the "Afar — Idées de fonctionnalités IA et UX" brainstorm PDF) says what companies are building, not
what users feel.

## Scope decisions

- **International product.** Segments are defined by behavior and need, not nationality. Tunisia can be the
  first market tested, but the design must generalize.
- **Real data.** Supabase stores Afar's own data (alerts, profile, saved, trips, activity log). It is a
  database, not a price source: where live fares come from is **still undecided** (see Open questions).
- **Both portfolio case study and real users.** Rule that follows: an AI line may only state what the data
  actually supports (e.g. "cheapest of the 6 results" is fine on sample data; "28% below the 90-day
  average" is not, unless the price history is real).

## Segments to understand

1. **Constraint-heavy travelers (primary).** Visa, passport or payment limits shape their search. Most
   distinctive for Afar (passport-aware search).
2. **Flexible deal-hunters (contrast).** Open destination and dates; natural fit for natural-language
   search and deal explanations.
3. *Parked:* fixed-trip planners, group organizers.

## What to find out

- How they search today: which apps, in what order, how many tabs.
- What makes them stop or give up: hidden fees, confusing layovers, prices that change.
- How they decide a price is fair: which signals they use now.
- Attitude to AI help: what they would let an assistant do (search, compare, alert, book) and what never.
- Visa and payment friction: where it actually blocks them.
- Localization pain: currency, formats, language, RTL.
- Payment trust with an unfamiliar app, which varies by region.

## Methods (solo-feasible)

- 5 to 8 short interviews across 2 or 3 markets. Ask about the *last* booking and walk through it; ask
  about past behavior, not wishes.
- Review mining: 1-star and 3-star reviews of Skyscanner, Kayak, Google Flights.
- Competitor walkthrough: book a flight on 2 or 3 apps yourself, note every hesitation.
- Optional: screen-recording of one real search.

## Draft empathy map — constraint-heavy traveler (hypotheses)

| | |
|---|---|
| **Says** | "Is this really the cheapest?" "Do I need a visa for this?" |
| **Thinks** | Prices might jump if I wait. Is there a catch? Can I even pay with my card? |
| **Does** | Compares several sites, rechecks daily, screenshots fares |
| **Feels** | Anxious at the booking moment, wary of hidden costs, distrustful of urgency messages |

## Journey pain points (hypotheses)

1. **Dream / discover:** too many options, no sense of what is a good deal.
2. **Search:** filters don't match how people think ("somewhere warm, under X").
3. **Compare:** hidden costs and painful layovers surface late.
4. **Decide:** unsure whether to book now or wait.
5. **Book:** payment and visa uncertainty.
6. **After booking:** no help when things change.

## Outputs of this phase (to produce)

- Validated insights, each tied to a quote or observation.
- One or two personas based on real interviews.
- Journey map with emotional low points.
- Interview guide (not written yet).

## Open questions

- Can 5 to 8 people be recruited? If not, rely on review mining and walkthroughs and label personas as
  assumption-based.
- Where do flight prices come from? Decides which AI claims are allowed and what the failure states are.
