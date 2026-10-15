// Plain assert script, no test runner in this project yet.
// Run: node src/lib/parseSearch.check.ts
// @ts-expect-error no @types/node in this project, Node resolves it at runtime
import assert from "node:assert/strict";

import { airports } from "../data/airports.ts";
import { EXAMPLE_PROMPTS, parseSearch } from "./parseSearch.ts";

// Wednesday 14 Oct 2026. Next Saturday is 17 Oct.
const TODAY = new Date(2026, 9, 14);
const parse = (text: string, today = TODAY) => parseSearch(text, today, airports);

const check = (text: string, params: object, unrecognized: string[] = []) => {
  const got = parse(text);
  assert.deepEqual(got.params, params, `params for "${text}"`);
  assert.deepEqual(got.unrecognized, unrecognized, `unrecognized for "${text}"`);
};

// Rule 1: exact date, never in the past, never also a month
check("21 Aug", { departDate: "2027-08-21" });
check("Aug 21", { departDate: "2027-08-21" });
check("2027-08-21", { departDate: "2027-08-21" });
check("2026-08-21", {}, ["2026-08-21"]);
check("31 Feb", {}, ["31 Feb"]);
check("14 Oct", { departDate: "2026-10-14" });

// Rule 2: length
check("5 nights", { nights: 5 });
check("3 days in Rome", { nights: 2, destination: "FCO" });
check("0 nights", {}, ["0 nights"]);
check("40 nights", {}, ["40 nights"]);

// Rule 3: budget
check("under 400", { maxPrice: 400 });
check("below 99 EUR", { maxPrice: 99 });
check("budget 250", { maxPrice: 250 });
check("€300", { maxPrice: 300 });
check("300€", { maxPrice: 300 });
check("300 euros", { maxPrice: 300 });
check("max 5 nights", { nights: 5 }, ["max"]);
check("Paris under 400 TND", { destination: "CDG" }, ["400 TND"]);
check("under $400", {}, ["$400"]);
check("under USD 400", {}, ["USD 400"]);
check("under 0", {}, ["0"]);
check("under 100 under 200", { maxPrice: 100 }, ["200"]);

// Rule 4: direct. Rule 5: anywhere
check("under 400 and direct", { maxPrice: 400, directOnly: true });
check("nonstop", { directOnly: true });
check("Anywhere", { anywhere: true });

// Rule 6: weekend (today is a Wednesday)
check("this weekend", { departDate: "2026-10-17", returnDate: "2026-10-18" });
check("weekend in March", { departDate: "2027-03-06", returnDate: "2027-03-07" });
assert.deepEqual(parse("weekend", new Date(2026, 9, 17)).params, {
  departDate: "2026-10-17",
  returnDate: "2026-10-18",
}); // Saturday means today
assert.deepEqual(parse("weekend", new Date(2026, 9, 18)).params, {
  departDate: "2026-10-24",
  returnDate: "2026-10-25",
}); // Sunday means next Saturday

// Rules 7 and 8: months
check("next month", { month: "2026-11" });
assert.equal(parse("next month", new Date(2026, 11, 31)).params.month, "2027-01");
check("in March", { month: "2027-03" });
check("in October", { month: "2026-10" });
check("in March 2028", { month: "2028-03" });
check("in Sept", { month: "2027-09" });
check("I may go", {}, ["may"]);
check("in May", { month: "2027-05" });
check("May 5", { departDate: "2027-05-05" });

// Rule 9: airports
check("Rome to Paris in March", {
  origin: "FCO",
  destination: "CDG",
  month: "2027-03",
});
check("from Tunis to JFK", { origin: "TUN", destination: "JFK" });
check("Paris from Tunis", { origin: "TUN", destination: "CDG" });
check("flight to New York", { destination: "JFK" });
check("Paris Rome", { destination: "CDG" }, ["Rome"]);

// The spec's critical scenarios
check("Anywhere from Tunis next month under 300", {
  anywhere: true,
  origin: "TUN",
  month: "2026-11",
  maxPrice: 300,
});
check("Rome in March somewhere warm", { destination: "FCO", month: "2027-03" }, [
  "warm",
]);
check("warm sunny beaches", {}, ["warm sunny beaches"]);

// Home examples read fully and set no date, so they return flights any day
check(EXAMPLE_PROMPTS[0], { anywhere: true, origin: "TUN", maxPrice: 300 });
check(EXAMPLE_PROMPTS[1], { origin: "TUN", destination: "CDG", directOnly: true });
check(EXAMPLE_PROMPTS[2], { origin: "BCN", destination: "FCO", maxPrice: 100 });

// Safety: never throws, on any string
const nasty = [
  "",
  "   ",
  "😀✈️",
  "x".repeat(5000),
  "!".repeat(5000),
  "a ".repeat(2500),
  "ParisRomeParis",
  "under under under 5 5 5 nights nights",
  "€ $ £ - -- ---",
  "99999999999999999999999 nights",
  "under " + "9".repeat(400),
  "may may may in in in",
];
for (const text of nasty) {
  const got = parse(text);
  assert.ok(Array.isArray(got.unrecognized), `shape for ${text.slice(0, 20)}`);
}
check("", {});
check("   ", {});
check("ParisRomeParis", {}, ["ParisRomeParis"]);

// Any day of the year: next month is always a real, later month
for (let d = 0; d < 365; d++) {
  const day = new Date(2026, 0, 1 + d);
  const month = parse("next month", day).params.month!;
  assert.match(month, /^\d{4}-\d{2}$/);
  assert.ok(month > `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}`);
}

console.log("parseSearch: all checks passed");
