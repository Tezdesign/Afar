// Pure: same input, same output, no clock, no module state, no React.
// The matching itself runs in the database (src/lib/db/catalog.ts).
import type { SearchParams } from "@/store/searchStore";
import type { Flight } from "@/types/travel";

export interface Suggestion {
  kind: "budget" | "dates" | "origin" | "stops" | "anywhere";
  label: string;
  /** Applying it means merging this into the search params */
  patch: Partial<SearchParams>;
}

export interface RankedFlight {
  flight: Flight;
  /** "Cheapest of 3, Direct". Empty when no part applies. */
  reason: string;
}

const stopsText = (stops: number) =>
  stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`;

/** Computed from the result set only, never from price history. */
export const withReasons = (sorted: Flight[]): RankedFlight[] => {
  return sorted.map((flight) => {
    // Rank within the same trip type only: one way or round trip.
    const group = sorted.filter((g) => !g.returnDate === !flight.returnDate);
    const cheapest = flight.price === Math.min(...group.map((g) => g.price));
    const parts = [
      cheapest && group.length >= 2 ? `Cheapest of ${group.length}` : "",
      stopsText(flight.stops),
    ].filter(Boolean);
    return { flight, reason: parts.join(", ") };
  });
};

/** Candidates for an empty result, in display order. The caller runs one
 *  query per candidate and keeps only those that return a flight.
 *  `cheapestWithoutBudget` is the cheapest match with maxPrice dropped.
 *  `routeServed` is true when any flight serves origin and destination. */
export const suggestionCandidates = (
  p: SearchParams,
  cheapestWithoutBudget: Flight | undefined,
  routeServed: boolean,
): Suggestion[] => {
  const candidates: Suggestion[] = [];

  if (p.maxPrice !== null && cheapestWithoutBudget) {
    const to = Math.ceil(cheapestWithoutBudget.price / 10) * 10;
    candidates.push({
      kind: "budget",
      label: `Raise budget to ${to} EUR`,
      patch: { maxPrice: to },
    });
  }
  if (p.month || p.departDate || p.returnDate || p.nights !== null)
    candidates.push({
      kind: "dates",
      label: "Any dates",
      patch: { month: null, departDate: null, returnDate: null, nights: null },
    });
  if (p.origin)
    candidates.push({
      kind: "origin",
      label: "Any starting airport",
      patch: { origin: null },
    });
  if (p.directOnly)
    candidates.push({
      kind: "stops",
      label: "Allow stops",
      patch: { directOnly: false },
    });
  if (p.destination && !p.anywhere && !routeServed)
    candidates.push({
      kind: "anywhere",
      label: "Anywhere",
      patch: { destination: null, anywhere: true },
    });

  return candidates;
};
