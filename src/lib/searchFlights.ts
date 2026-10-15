// Pure: same input, same output, no clock, no module state, no React.
import { daysBetween, parseISODate } from "./dates.ts";
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

const nightsOf = (f: Flight) =>
  f.returnDate
    ? daysBetween(parseISODate(f.departDate), parseISODate(f.returnDate))
    : null;

const matches = (f: Flight, p: SearchParams) => {
  if (p.origin && f.originCode !== p.origin) return false;
  if (!p.anywhere && p.destination && f.destinationCode !== p.destination)
    return false;
  if (p.departDate) {
    const gap = daysBetween(
      parseISODate(p.departDate),
      parseISODate(f.departDate),
    );
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

const suggestionsFor = (flights: Flight[], p: SearchParams): Suggestion[] => {
  const candidates: Suggestion[] = [];

  // 1. Raise budget to the smallest value (next 10) that returns a flight.
  if (p.maxPrice !== null) {
    const [cheapest] = filterSorted(flights, { ...p, maxPrice: null });
    if (cheapest) {
      const to = Math.ceil(cheapest.price / 10) * 10;
      candidates.push({
        kind: "budget",
        label: `Raise budget to ${to} EUR`,
        patch: { maxPrice: to },
      });
    }
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
  // Only for a route no flight serves at all.
  if (
    p.destination &&
    !p.anywhere &&
    !flights.some(
      (f) =>
        f.destinationCode === p.destination &&
        (!p.origin || f.originCode === p.origin),
    )
  )
    candidates.push({
      kind: "anywhere",
      label: "Anywhere",
      patch: { destination: null, anywhere: true },
    });

  // Verified: a suggestion is shown only if applying it returns a flight.
  return candidates
    .filter((s) => filterSorted(flights, { ...p, ...s.patch }).length > 0)
    .slice(0, 3);
};

export function searchFlights(flights: Flight[], params: SearchParams) {
  const sorted = filterSorted(flights, params);
  return {
    results: withReasons(sorted),
    suggestions: sorted.length === 0 ? suggestionsFor(flights, params) : [],
  };
}

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
