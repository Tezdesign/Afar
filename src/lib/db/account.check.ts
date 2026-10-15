// Checks the pure parts of account.ts. The database rules behind it (alert
// constraints, append only log, unique token per account) are proven by
// supabase/tests/isolation.sql. Run: node src/lib/db/account.check.ts
// @ts-expect-error no @types/node in this project, Node resolves it at runtime
import assert from "node:assert/strict";

import type { SearchParams } from "../../store/searchStore.ts";
import { createAccount, staleIds, toRecentSearchRow } from "./account.ts";

const params: SearchParams = {
  origin: "TUN", destination: "CDG", anywhere: false, month: "2026-11",
  nights: 3, departDate: null, returnDate: null, adults: 2, kids: 1,
  directOnly: true, minPrice: 10, maxPrice: 300, unrecognized: ["cheap", "soon"],
};

// Parsed fields only: no typed text, unrecognized words or passengers.
const row = toRecentSearchRow(params);
assert.deepEqual(Object.keys(row).sort(), [
  "anywhere", "depart_date", "destination", "direct_only", "max_price",
  "month", "nights", "origin", "return_date",
]);
assert.equal(JSON.stringify(row).includes("cheap"), false);
assert.equal(row.max_price, 300);

// Newest 10 kept.
const ids = Array.from({ length: 13 }, (_, i) => `id${i}`);
assert.deepEqual(staleIds(ids), ["id10", "id11", "id12"]);
assert.deepEqual(staleIds(ids.slice(0, 10)), []);
assert.deepEqual(staleIds([]), []);

// A destination with "anywhere" is refused before any request is made.
const neverCalled = new Proxy({}, { get: () => { throw new Error("db was used"); } });
const account = createAccount(neverCalled as never);
await assert.rejects(
  () => account.createAlert({ destination: "CDG", anywhere: true }),
  /not both/,
);

console.log("ok: account accessors");
