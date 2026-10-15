// Compares the database search with the old on device search (searchFlights),
// run over the same rows, for the same inputs. Needs the network and .env.
// Run: node --env-file=.env src/lib/db/catalog.check.ts
// Once src/lib/searchFlights.ts loses its old searchFlights, freeze these
// expected results as fixtures instead (spec 0004 task 5).
// @ts-expect-error no @types/node in this project, Node resolves it at runtime
import assert from "node:assert/strict";

import { createClient } from "@supabase/supabase-js";

import { addDays, parseISODate, toISODate } from "../dates.ts";
import { searchFlights as onDevice } from "../searchFlights.ts";
import type { SearchParams } from "../../store/searchStore.ts";
import type { Flight } from "../../types/travel.ts";
import { createCatalog } from "./catalog.ts";

const env = process.env;
const db = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL!,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
const catalog = createCatalog(db);

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
  const expected = onDevice(all, params);
  const got = await catalog.searchFlights(params);
  assert.deepEqual(
    got.results.map((r) => [r.flight.id, r.reason]),
    expected.results.map((r) => [r.flight.id, r.reason]),
    `results for ${name}`,
  );
  assert.deepEqual(got.suggestions, expected.suggestions, `suggestions for ${name}`);
}
console.log(`ok: ${inputs.length} inputs match the on device search`);
