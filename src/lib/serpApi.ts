// Pure SerpApi helpers for GET /api/flights (spec 0003): read the query,
// build the SerpApi parameters, map the answer to Flight. No fetch, no clock
// (today is passed in), no module state, so serpApi.check.ts runs under Node.
// Two engines: google_flights for a route, google_flights_deals for "Anywhere".
import type { Flight, LiveSearchResponse } from "../types/travel.ts";
import { addDays, parseISODate, toISODate } from "./dates.ts";

export interface LiveQuery {
  from: string;
  /** null means "Anywhere": the deals engine */
  to: string | null;
  depart: string | null;
  return: string | null;
  /** "YYYY-MM", Anywhere only */
  month: string | null;
  /** Anywhere only */
  nights: number | null;
  direct: boolean;
  maxPrice: number | null;
}

const MAX_DAYS_AHEAD = 330;
const MAX_RESULTS = 20;

const IATA = /^[A-Z]{3}$/;
const isRealDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && toISODate(parseISODate(s)) === s;

/** The month as a SerpApi date window, never starting before tomorrow.
 *  null when the whole month is already past. */
export const monthWindow = (month: string, today: Date) => {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0); // day 0 of next month
  const tomorrow = addDays(today, 1);
  const first = new Date(y, m - 1, 1);
  const start = first < tomorrow ? tomorrow : first;
  return start > last ? null : `${toISODate(start)},${toISODate(last)}`;
};

/** Validates before any SerpApi call (AC-2). */
export function parseLiveQuery(
  sp: URLSearchParams,
  today: Date,
): { query: LiveQuery } | { error: string } {
  const get = (k: string) => sp.get(k) || null;
  const from = get("from");
  const to = get("to");
  const depart = get("depart");
  const ret = get("return");
  const month = get("month");
  const nightsRaw = get("nights");
  const maxRaw = get("maxPrice");

  if (!from || !IATA.test(from)) return { error: "from must be an airport code" };
  if (to !== null && (!IATA.test(to) || to === from))
    return { error: "to must be another airport code" };
  if (to !== null && !depart) return { error: "depart is required for a route" };
  if (to !== null && (month || nightsRaw))
    return { error: "month and nights are for Anywhere searches only" };
  if (depart && month) return { error: "send depart or month, not both" };

  // One day of slack: the phone and the server may be in different time zones.
  const earliest = toISODate(addDays(today, -1));
  const latest = toISODate(addDays(today, MAX_DAYS_AHEAD));
  if (depart !== null) {
    if (!isRealDate(depart) || depart < earliest || depart > latest)
      return { error: "depart must be a date from today on" };
  }
  if (ret !== null) {
    if (!depart || !isRealDate(ret) || ret < depart || ret > latest)
      return { error: "return must be on or after depart" };
  }
  if (month !== null) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !monthWindow(month, today))
      return { error: "month must be YYYY-MM, not in the past" };
  }

  let nights: number | null = null;
  if (nightsRaw !== null) {
    nights = Number(nightsRaw);
    if (!Number.isInteger(nights) || nights < 1 || nights > 30)
      return { error: "nights must be 1 to 30" };
  }
  let maxPrice: number | null = null;
  if (maxRaw !== null) {
    maxPrice = Number(maxRaw);
    if (!Number.isInteger(maxPrice) || maxPrice <= 0)
      return { error: "maxPrice must be a positive whole number" };
  }

  return {
    query: {
      from,
      to,
      depart,
      return: ret,
      month,
      nights,
      direct: get("direct") === "1",
      maxPrice,
    },
  };
}

/** Same query, same key: the cache and in flight key (AC-4). */
export const liveQueryKey = (q: LiveQuery) =>
  JSON.stringify(Object.entries(q).sort(([a], [b]) => a.localeCompare(b)));

/** SerpApi parameters without api_key (the route adds it). */
export function serpApiParams(q: LiveQuery, today: Date): Record<string, string> {
  const p: Record<string, string> = {
    departure_id: q.from,
    currency: "EUR",
    hl: "en",
  };
  if (q.direct) p.stops = "1";
  if (q.maxPrice !== null) p.max_price = String(q.maxPrice);

  if (q.to !== null) {
    p.engine = "google_flights";
    p.arrival_id = q.to;
    p.outbound_date = q.depart!;
    if (q.return) p.return_date = q.return;
    p.type = q.return ? "1" : "2";
    return p;
  }

  p.engine = "google_flights_deals";
  const window = q.month ? monthWindow(q.month, today) : null;
  if (q.depart) p.outbound_date = q.depart;
  else if (window) p.outbound_date = window;
  if (q.return) p.return_date = q.return;
  else if (q.nights !== null) p.trip_length = String(q.nights);
  p.type = q.return || q.nights !== null ? "1" : "2";
  return p;
}

// Only the fields we read. Everything is optional: SerpApi can drop any.
interface SerpLeg {
  airline?: string;
  flight_number?: string;
  /** departure_airport.time is local, "YYYY-MM-DD HH:MM" */
  departure_airport?: { time?: string };
}
interface SerpItinerary {
  flights?: SerpLeg[];
  layovers?: unknown[];
  total_duration?: number;
  price?: number;
}
interface SerpDeal {
  price?: number;
  // The live API sends outbound_date/return_date; the docs example shows
  // start_date/end_date. Accept both.
  outbound_date?: string;
  return_date?: string;
  start_date?: string;
  end_date?: string;
  departure_airport_code?: string;
  arrival_airport_code?: string;
  flight_duration?: number;
  stops?: number;
  airline?: string;
  airline_code?: string;
  name?: string;
  flight_link?: string;
  discount_percentage?: number;
}
export interface SerpBody {
  error?: string;
  best_flights?: SerpItinerary[];
  other_flights?: SerpItinerary[];
  price_insights?: {
    price_level?: string;
    typical_price_range?: number[];
  };
  deals?: SerpDeal[];
}

const idPart = (s: string) => s.replace(/[^A-Za-z0-9]/g, "");
const isNum = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

const dedupe = (flights: Flight[]) => {
  const seen = new Set<string>();
  return flights.filter((f) => !seen.has(f.id) && !!seen.add(f.id));
};

/** Itineraries that differ only in a connection the card does not show
 *  (same airline, departure time, length, stops and price) are one card. */
const dedupeLookAlikes = (flights: Flight[]) => {
  const seen = new Set<string>();
  return flights.filter((f) => {
    const key = [f.airline, f.departTime, f.durationMinutes, f.stops, f.price].join("|");
    return !seen.has(key) && !!seen.add(key);
  });
};

const mapRoute = (q: LiveQuery, body: SerpBody): Flight[] =>
  [...(body.best_flights ?? []), ...(body.other_flights ?? [])].flatMap(
    (it): Flight[] => {
      const legs = it.flights ?? [];
      if (!isNum(it.price) || legs.length === 0) return [];
      const numbers = legs.map((l) => idPart(l.flight_number ?? "")).join("-");
      return [
        {
          id: `live-${q.from}-${q.to}-${q.depart}-${numbers}`,
          originCode: q.from,
          destinationCode: q.to!,
          departDate: q.depart!,
          returnDate: q.return ?? undefined,
          airline: legs[0].airline ?? "Airline",
          price: it.price,
          currency: "EUR",
          durationMinutes: isNum(it.total_duration) ? it.total_duration : 0,
          stops: it.layovers?.length ?? 0,
          source: "live",
          ...(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(legs[0].departure_airport?.time ?? "") && {
            departTime: legs[0].departure_airport!.time!.slice(11, 16),
          }),
        },
      ];
    },
  );

const mapDeals = (q: LiveQuery, body: SerpBody, roundTrip: boolean): Flight[] =>
  (body.deals ?? []).flatMap((d): Flight[] => {
    const depart = d.outbound_date ?? d.start_date;
    const ret = d.return_date ?? d.end_date;
    if (!isNum(d.price) || !d.arrival_airport_code || !depart) return [];
    const origin = d.departure_airport_code ?? q.from;
    return [
      {
        id: `live-${origin}-${d.arrival_airport_code}-${depart}-${idPart(d.airline_code ?? d.airline ?? "")}`,
        originCode: origin,
        destinationCode: d.arrival_airport_code,
        departDate: depart,
        returnDate: roundTrip ? ret : undefined,
        airline: d.airline ?? "Airline",
        price: d.price,
        currency: "EUR",
        durationMinutes: isNum(d.flight_duration) ? d.flight_duration : 0,
        stops: isNum(d.stops) ? d.stops : 0,
        source: "live",
        bookingUrl: d.flight_link,
        destinationCity: d.name,
        discountPercent: isNum(d.discount_percentage)
          ? d.discount_percentage
          : undefined,
      },
    ];
  });

const PRICE_LEVELS = ["low", "typical", "high"] as const;

/** SerpApi answer to our response (AC-3, AC-6). Never passes raw JSON on. */
export function toLiveResponse(
  q: LiveQuery,
  params: Record<string, string>,
  body: SerpBody,
  checkedAt: string,
): LiveSearchResponse {
  if (body.error) return { status: "fallback", reason: "error" };

  if (params.engine === "google_flights_deals") {
    const flights = dedupe(mapDeals(q, body, params.type === "1"))
      .sort((a, b) => a.price - b.price)
      .slice(0, MAX_RESULTS);
    return { status: "live", flights, checkedAt, cached: false };
  }

  const flights = dedupeLookAlikes(dedupe(mapRoute(q, body))).slice(0, MAX_RESULTS);
  const level = body.price_insights?.price_level;
  const range = body.price_insights?.typical_price_range;
  return {
    status: "live",
    flights,
    checkedAt,
    cached: false,
    ...(PRICE_LEVELS.includes(level as never) && {
      priceLevel: level as (typeof PRICE_LEVELS)[number],
    }),
    ...(range?.length === 2 &&
      range.every(isNum) && { typicalRange: [range[0], range[1]] as [number, number] }),
  };
}

/** A Google Flights search for a route, when a flight has no own link (AC-12). */
export const googleFlightsSearchUrl = (f: Flight) =>
  `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `Flights from ${f.originCode} to ${f.destinationCode} on ${f.departDate}` +
      (f.returnDate ? ` through ${f.returnDate}` : " one way"),
  )}&curr=EUR&hl=en`;
