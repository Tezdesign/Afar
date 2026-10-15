// Plain assert script, no test runner in this project yet.
// Run: node src/lib/serpApi.check.ts
// Fixtures are trimmed from SerpApi's own example responses (google_flights
// and google_flights_deals docs), keeping only the fields we read.
// @ts-expect-error no @types/node in this project, Node resolves it at runtime
import assert from "node:assert/strict";

import {
  googleFlightsSearchUrl,
  liveQueryKey,
  monthWindow,
  parseLiveQuery,
  serpApiParams,
  toLiveResponse,
  type LiveQuery,
  type SerpBody,
} from "./serpApi.ts";
import { liveRequestFor } from "./liveFlights.ts";

// Wednesday 14 Oct 2026.
const TODAY = new Date(2026, 9, 14);
const parse = (qs: string) => parseLiveQuery(new URLSearchParams(qs), TODAY);
const ok = (qs: string): LiveQuery => {
  const r = parse(qs);
  if (!("query" in r)) throw new Error(`expected ok for "${qs}", got ${r.error}`);
  return r.query;
};
const bad = (qs: string) =>
  assert.ok("error" in parse(qs), `expected 400 for "${qs}"`);

// AC-2: validation, before any SerpApi call
bad("");
bad("from=tun&to=CDG&depart=2026-11-01");
bad("from=TUN&to=TUN&depart=2026-11-01");
bad("from=TUN&to=CDG"); // a route needs a date
bad("from=TUN&to=CDG&depart=2026-10-01"); // past
bad("from=TUN&to=CDG&depart=2026-02-30"); // not a real date
bad("from=TUN&to=CDG&depart=2027-12-01"); // more than 330 days ahead
bad("from=TUN&to=CDG&depart=2026-11-05&return=2026-11-01");
bad("from=TUN&to=CDG&depart=2026-11-01&maxPrice=-5");
bad("from=TUN&to=CDG&depart=2026-11-01&maxPrice=9.5");
bad("from=TUN&to=CDG&depart=2026-11-01&month=2026-11"); // month is Anywhere only
bad("from=TUN&month=2026-09"); // past month
bad("from=TUN&month=2026-13");
bad("from=TUN&nights=0");
ok("from=TUN&to=CDG&depart=2026-10-13"); // one day of time zone slack
ok("from=TUN"); // Anywhere, any date

// AC-1: route search parameters
const oneWay = ok("from=TUN&to=CDG&depart=2026-11-01&direct=1&maxPrice=300");
assert.deepEqual(serpApiParams(oneWay, TODAY), {
  engine: "google_flights",
  departure_id: "TUN",
  arrival_id: "CDG",
  outbound_date: "2026-11-01",
  type: "2",
  currency: "EUR",
  hl: "en",
  stops: "1",
  max_price: "300",
});
const round = ok("from=TUN&to=CDG&depart=2026-11-01&return=2026-11-05");
assert.equal(serpApiParams(round, TODAY).type, "1");
assert.equal(serpApiParams(round, TODAY).return_date, "2026-11-05");

// AC-1 / AC-8: Anywhere uses the deals engine, a month becomes a window
assert.equal(monthWindow("2026-10", TODAY), "2026-10-15,2026-10-31");
assert.equal(monthWindow("2026-11", TODAY), "2026-11-01,2026-11-30");
assert.equal(monthWindow("2026-09", TODAY), null);
const anyMonth = ok("from=TUN&month=2026-11&nights=4");
assert.deepEqual(serpApiParams(anyMonth, TODAY), {
  engine: "google_flights_deals",
  departure_id: "TUN",
  outbound_date: "2026-11-01,2026-11-30",
  trip_length: "4",
  type: "1",
  currency: "EUR",
  hl: "en",
});
const anyDate = serpApiParams(ok("from=TUN"), TODAY);
assert.equal(anyDate.outbound_date, undefined);
assert.equal(anyDate.type, "2");

// AC-4: the key ignores parameter order
assert.equal(
  liveQueryKey(ok("from=TUN&to=CDG&depart=2026-11-01&direct=1")),
  liveQueryKey(ok("direct=1&depart=2026-11-01&to=CDG&from=TUN")),
);

// AC-3: route mapping
const routeBody: SerpBody = {
  best_flights: [
    {
      flights: [
        { airline: "ANA", flight_number: "NH 962" },
        { airline: "ANA", flight_number: "NH 126" },
      ],
      layovers: [{}, {}],
      total_duration: 1309,
      price: 2512,
    },
  ],
  other_flights: [
    // Same flights again: dropped as a duplicate
    {
      flights: [
        { airline: "ANA", flight_number: "NH 962" },
        { airline: "ANA", flight_number: "NH 126" },
      ],
      layovers: [{}, {}],
      total_duration: 1309,
      price: 2512,
    },
    { flights: [{ airline: "Air France", flight_number: "AF 1" }], price: undefined },
    {
      flights: [{ airline: "Air France", flight_number: "AF 2" }],
      total_duration: 135,
      price: 180,
    },
  ],
  price_insights: { price_level: "high", typical_price_range: [1500, 1900] },
};
const live = toLiveResponse(round, serpApiParams(round, TODAY), routeBody, "T");
assert.equal(live.status, "live");
if (live.status === "live") {
  assert.equal(live.flights.length, 2, "duplicate and priceless dropped");
  assert.deepEqual(live.flights[0], {
    id: "live-TUN-CDG-2026-11-01-NH962-NH126",
    originCode: "TUN",
    destinationCode: "CDG",
    departDate: "2026-11-01",
    returnDate: "2026-11-05",
    airline: "ANA",
    price: 2512,
    currency: "EUR",
    durationMinutes: 1309,
    stops: 2,
    source: "live",
  });
  assert.equal(live.flights[1].stops, 0);
  assert.equal(live.priceLevel, "high");
  assert.deepEqual(live.typicalRange, [1500, 1900]);
  assert.equal(live.cached, false);
}

// Look-alikes (same airline, time, length, stops, price; only a hidden
// connection differs) collapse to one card, and the departure time is kept
const lookAlikes = toLiveResponse(oneWay, serpApiParams(oneWay, TODAY), {
  best_flights: ["AZ 2092", "AZ 2058"].map((mid) => ({
    flights: [
      { airline: "ITA", flight_number: "AZ 863", departure_airport: { time: "2026-11-01 11:25" } },
      { airline: "ITA", flight_number: mid },
    ],
    layovers: [{}, {}],
    total_duration: 1275,
    price: 229,
  })),
}, "T");
assert.equal(lookAlikes.status === "live" && lookAlikes.flights.length, 1);
assert.equal(lookAlikes.status === "live" && lookAlikes.flights[0].departTime, "11:25");

// At most 20
const many: SerpBody = {
  best_flights: Array.from({ length: 30 }, (_, i) => ({
    flights: [{ airline: "X", flight_number: `X ${i}` }],
    price: 100 + i,
  })),
};
const capped = toLiveResponse(oneWay, serpApiParams(oneWay, TODAY), many, "T");
assert.equal(capped.status === "live" && capped.flights.length, 20);

// AC-6: an error body is a fallback; empty arrays are a real empty result
assert.deepEqual(
  toLiveResponse(oneWay, serpApiParams(oneWay, TODAY), { error: "Invalid key" }, "T"),
  { status: "fallback", reason: "error" },
);
assert.deepEqual(
  toLiveResponse(
    oneWay,
    serpApiParams(oneWay, TODAY),
    { best_flights: [], other_flights: [] },
    "T",
  ),
  { status: "live", flights: [], checkedAt: "T", cached: false },
);

// AC-3: deals mapping, sorted by price
const dealsBody: SerpBody = {
  deals: [
    {
      name: "São Vicente",
      price: 468,
      discount_percentage: 77,
      flight_link: "https://www.google.com/travel/flights?tfs=abc",
      start_date: "2026-11-21",
      end_date: "2026-11-25",
      departure_airport_code: "TUN",
      arrival_airport_code: "VXE",
      flight_duration: 350,
      stops: 0,
      airline: "Cabo Verde Airlines",
      airline_code: "VR",
    },
    {
      name: "Marrakesh",
      price: 120,
      start_date: "2026-11-04",
      end_date: "2026-11-08",
      departure_airport_code: "TUN",
      arrival_airport_code: "RAK",
      flight_duration: 175,
      stops: 1,
      airline: "Royal Air Maroc",
      airline_code: "AT",
    },
    { name: "No price", start_date: "2026-11-04", arrival_airport_code: "X" },
  ],
};
const deals = toLiveResponse(anyMonth, serpApiParams(anyMonth, TODAY), dealsBody, "T");
assert.equal(deals.status, "live");
if (deals.status === "live") {
  assert.deepEqual(
    deals.flights.map((f) => f.destinationCode),
    ["RAK", "VXE"],
  );
  assert.deepEqual(deals.flights[1], {
    id: "live-TUN-VXE-2026-11-21-VR",
    originCode: "TUN",
    destinationCode: "VXE",
    departDate: "2026-11-21",
    returnDate: "2026-11-25",
    airline: "Cabo Verde Airlines",
    price: 468,
    currency: "EUR",
    durationMinutes: 350,
    stops: 0,
    source: "live",
    bookingUrl: "https://www.google.com/travel/flights?tfs=abc",
    destinationCity: "São Vicente",
    discountPercent: 77,
  });
  assert.equal(deals.priceLevel, undefined);
}
// The live API's field names (outbound_date / return_date), seen on a real
// TUN deals answer on 2026-10-15
const realDeal = toLiveResponse(anyMonth, serpApiParams(anyMonth, TODAY), {
  deals: [
    {
      name: "Strasbourg",
      price: 141,
      discount_percentage: 62,
      outbound_date: "2026-11-23",
      return_date: "2026-11-27",
      departure_airport_code: "TUN",
      arrival_airport_code: "SXB",
      flight_duration: 135,
      stops: 0,
      airline: "Nouvelair Tunisie",
      airline_code: "BJ",
    },
  ],
}, "T");
assert.equal(realDeal.status === "live" && realDeal.flights[0].id, "live-TUN-SXB-2026-11-23-BJ");
assert.equal(realDeal.status === "live" && realDeal.flights[0].returnDate, "2026-11-27");

// One way deals carry no return date
const oneWayDeals = ok("from=TUN");
const ow = toLiveResponse(oneWayDeals, serpApiParams(oneWayDeals, TODAY), dealsBody, "T");
assert.equal(ow.status === "live" && ow.flights[0].returnDate, undefined);

// AC-12: a search link when a flight has none of its own
assert.equal(
  googleFlightsSearchUrl({
    id: "x",
    originCode: "TUN",
    destinationCode: "CDG",
    departDate: "2026-11-01",
    airline: "Tunisair",
    price: 1,
    currency: "EUR",
    durationMinutes: 1,
    stops: 0,
  }),
  "https://www.google.com/travel/flights?q=Flights%20from%20TUN%20to%20CDG%20on%202026-11-01%20one%20way&curr=EUR&hl=en",
);

// AC-8: a Results search becomes a /api/flights query the route accepts
const search = {
  origin: "TUN",
  destination: "CDG",
  anywhere: false,
  month: null,
  nights: null,
  departDate: null,
  returnDate: null,
  adults: 1,
  kids: 0,
  directOnly: false,
  minPrice: null,
  maxPrice: null,
  unrecognized: [],
};
const reqFor = (patch: object) => liveRequestFor({ ...search, ...patch }, TODAY);
assert.deepEqual(reqFor({ origin: null }), { kind: "hint", hint: "no_origin" });
assert.deepEqual(reqFor({}), { kind: "hint", hint: "no_date" });
assert.deepEqual(reqFor({ departDate: "2026-10-01" }), { kind: "hint", hint: "past" });
assert.deepEqual(reqFor({ month: "2026-09" }), { kind: "hint", hint: "past" });
assert.deepEqual(reqFor({ month: "2026-11", nights: 4, directOnly: true, maxPrice: 300 }), {
  kind: "request",
  query: "from=TUN&to=CDG&depart=2026-11-01&return=2026-11-05&direct=1&maxPrice=300",
  anywhere: false,
  chosenDate: "2026-11-01",
});
// Month already started: tomorrow
const started = reqFor({ month: "2026-10" });
assert.equal(started.kind === "request" && started.chosenDate, "2026-10-15");
// Anywhere: no date needed, month and nights pass through
assert.deepEqual(reqFor({ destination: null, anywhere: true }), {
  kind: "request",
  query: "from=TUN",
  anywhere: true,
  chosenDate: null,
});
const anyReq = reqFor({ destination: null, anywhere: true, month: "2026-11", nights: 3 });
assert.equal(anyReq.kind === "request" && anyReq.query, "from=TUN&month=2026-11&nights=3");
// Every request the app builds passes the route's validation
for (const r of [
  reqFor({ departDate: "2026-11-01", returnDate: "2026-11-08" }),
  reqFor({ month: "2026-12", nights: 30 }),
  anyReq,
  reqFor({ destination: null, departDate: "2026-11-01", nights: 5 }),
])
  if (r.kind === "request") ok(r.query);

console.log("serpApi.check: all passed");
