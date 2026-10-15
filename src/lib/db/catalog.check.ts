// Compares the database search with the on device search it replaced, run
// over the same rows, for the same inputs. The old matching and suggestion
// code lives on below as `reference`, so this works on any day (the sample
// flight dates move every day, which a frozen fixture could not follow).
// Needs the network and .env.
// Run: node --env-file=.env src/lib/db/catalog.check.ts
// @ts-expect-error no @types/node in this project, Node resolves it at runtime
import assert from "node:assert/strict";

import { createClient } from "@supabase/supabase-js";

import { addDays, daysBetween, parseISODate, toISODate } from "../dates.ts";
import { withReasons } from "../searchFlights.ts";
import type { SearchParams } from "../../store/searchStore.ts";
import type { Flight } from "../../types/travel.ts";
import { createCatalog } from "./catalog.ts";

const env = process.env;
const db = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL!,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
const catalog = createCatalog(db);

// --- the old on device search, kept only as the reference ---
const nightsOf = (f: Flight) =>
  f.returnDate ? daysBetween(parseISODate(f.departDate), parseISODate(f.returnDate)) : null;

const matches = (f: Flight, p: SearchParams) => {
  if (p.origin && f.originCode !== p.origin) return false;
  if (!p.anywhere && p.destination && f.destinationCode !== p.destination) return false;
  if (p.departDate) {
    const gap = daysBetween(parseISODate(p.departDate), parseISODate(f.departDate));
    if (Math.abs(gap) > 3) return false;
  } else if (p.month && !f.departDate.startsWith(p.month)) return false;
  if (p.nights !== null) {
    const n = nightsOf(f);
    if (n === null || Math.abs(n - p.nights) > 1) return false;
  }
  if (p.directOnly && f.stops !== 0) return false;
  if (p.maxPrice !== null && f.price > p.maxPrice) return false;
  return true;
};

const filterSorted = (flights: Flight[], p: SearchParams) =>
  flights
    .filter((f) => matches(f, p))
    .sort((a, b) => a.price - b.price || a.durationMinutes - b.durationMinutes);

const referenceSuggestions = (flights: Flight[], p: SearchParams) => {
  const candidates: { kind: string; label: string; patch: Partial<SearchParams> }[] = [];
  if (p.maxPrice !== null) {
    const [cheapest] = filterSorted(flights, { ...p, maxPrice: null });
    if (cheapest) {
      const to = Math.ceil(cheapest.price / 10) * 10;
      candidates.push({ kind: "budget", label: `Raise budget to ${to} EUR`, patch: { maxPrice: to } });
    }
  }
  if (p.month || p.departDate || p.returnDate || p.nights !== null)
    candidates.push({ kind: "dates", label: "Any dates", patch: { month: null, departDate: null, returnDate: null, nights: null } });
  if (p.origin) candidates.push({ kind: "origin", label: "Any starting airport", patch: { origin: null } });
  if (p.directOnly) candidates.push({ kind: "stops", label: "Allow stops", patch: { directOnly: false } });
  if (
    p.destination && !p.anywhere &&
    !flights.some((f) => f.destinationCode === p.destination && (!p.origin || f.originCode === p.origin))
  )
    candidates.push({ kind: "anywhere", label: "Anywhere", patch: { destination: null, anywhere: true } });
  return candidates
    .filter((s) => filterSorted(flights, { ...p, ...s.patch }).length > 0)
    .slice(0, 3);
};

const reference = (flights: Flight[], p: SearchParams) => {
  const sorted = filterSorted(flights, p);
  return {
    results: withReasons(sorted),
    suggestions: sorted.length === 0 ? referenceSuggestions(flights, p) : [],
  };
};

const all = await catalog.queryFlights(base());
function base(over: Partial<SearchParams> = {}): SearchParams {
  return {
    origin: null, destination: null, anywhere: false, month: null,
    nights: null, departDate: null, returnDate: null, adults: 1, kids: 0,
    directOnly: false, minPrice: null, maxPrice: null, unrecognized: [],
    ...over,
  };
}
assert.equal(all.length, 12, "12 sample flights");

const flight = (id: string) => all.find((f: Flight) => f.id === id)!;
const tunCdg = flight("flight-tun-cdg-1");
const monthOf = (f: Flight) => f.departDate.slice(0, 7);
const shift = (iso: string, d: number) => toISODate(addDays(parseISODate(iso), d));

const inputs: [string, Partial<SearchParams>][] = [
  ["everything", {}],
  ["origin TUN", { origin: "TUN" }],
  ["destination CDG", { destination: "CDG" }],
  ["anywhere TUN under 300", { anywhere: true, origin: "TUN", maxPrice: 300 }],
  ["TUN to CDG direct", { origin: "TUN", destination: "CDG", directOnly: true }],
  ["month of tun-cdg-1", { month: monthOf(tunCdg) }],
  ["month of lhr-jfk-1", { month: monthOf(flight("flight-lhr-jfk-1")) }],
  ["month of tun-jfk-1", { month: monthOf(flight("flight-tun-jfk-1")) }],
  ["exact date", { departDate: tunCdg.departDate }],
  ["exact date plus 3", { departDate: shift(tunCdg.departDate, 3) }],
  ["exact date plus 4", { departDate: shift(tunCdg.departDate, 4) }],
  ["exact date minus 3", { departDate: shift(tunCdg.departDate, -3) }],
  ["exact date wins over month", { departDate: tunCdg.departDate, month: "2030-01" }],
  ["nights 3", { nights: 3 }],
  ["nights 5", { nights: 5 }],
  ["nights 30", { nights: 30 }],
  ["under 50 (none)", { maxPrice: 50 }],
  ["FCO under 60", { destination: "FCO", maxPrice: 60 }],
  ["JFK under 100", { destination: "JFK", maxPrice: 100 }],
  ["from JFK (none leave it)", { origin: "JFK" }],
  ["LHR to BCN (route not served)", { origin: "LHR", destination: "BCN" }],
  ["CDG to FCO direct", { origin: "CDG", destination: "FCO", directOnly: true }],
  ["TUN far future month", { origin: "TUN", month: "2030-01" }],
  ["LHR 7 nights under 100", { destination: "LHR", nights: 7, maxPrice: 100 }],
  ["TUN at exactly 76", { origin: "TUN", maxPrice: 76 }],
  ["TUN to CDG under 97", { origin: "TUN", destination: "CDG", maxPrice: 97 }],
  ["TUN to CDG under 96", { origin: "TUN", destination: "CDG", maxPrice: 96 }],
];

for (const [name, over] of inputs) {
  const params = base(over);
  const expected = reference(all, params);
  const got = await catalog.searchFlights(params);
  assert.deepEqual(
    got.results.map((r) => [r.flight.id, r.reason]),
    expected.results.map((r) => [r.flight.id, r.reason]),
    `results for ${name}`,
  );
  assert.deepEqual(got.suggestions, expected.suggestions, `suggestions for ${name}`);
}
console.log(`ok: ${inputs.length} inputs match the reference search`);
