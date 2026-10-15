// Catalog reads (airports, flights). Takes the client so it also runs under
// plain Node for catalog.check.ts; the app uses the bound copy in ./index.ts.
// Relative .ts imports and type only aliases, for the same reason.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SearchParams } from "../../store/searchStore.ts";
import type { Database } from "../../types/database.ts";
import type {
  Airport,
  CurrencyCode,
  Deal,
  DealType,
  Destination,
  Flight,
} from "../../types/travel.ts";
import { addDays, parseISODate, toISODate } from "../dates.ts";
import {
  suggestionCandidates,
  withReasons,
  type RankedFlight,
  type Suggestion,
} from "../searchFlights.ts";

type Db = SupabaseClient<Database>;
type FlightRow = Database["public"]["Tables"]["flights"]["Row"];
type AirportRow = Database["public"]["Tables"]["airports"]["Row"];
type DealRow = Database["public"]["Views"]["deals_with_price"]["Row"];
type DestinationRow = Database["public"]["Views"]["destinations_with_price"]["Row"];

/** Called on every failed read, with the table and operation only. Never row data. */
export type ReportError = (table: string, operation: string) => void;

const ROW_CAP = 100;

const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code; // runtime without Intl.DisplayNames: show the code
  }
};

const toAirport = (r: AirportRow): Airport => ({
  code: r.code,
  city: r.city,
  country: countryName(r.country_code),
  countryCode: r.country_code,
});

const toFlight = (r: FlightRow): Flight => ({
  id: r.id,
  originCode: r.origin_code,
  destinationCode: r.destination_code,
  departDate: r.depart_date,
  returnDate: r.return_date ?? undefined,
  airline: r.airline,
  price: Number(r.price),
  currency: r.currency as CurrencyCode,
  durationMinutes: r.duration_minutes,
  stops: r.stops,
  source: r.source,
});

// Views type every column as nullable. These are never null in practice
// (the deal check constraint and the joins guarantee them), so they are cast.
const toDeal = (r: DealRow): Deal => ({
  id: r.id!,
  type: r.type as DealType,
  title: r.title!,
  subtitle: r.subtitle!,
  price: Number(r.price),
  currency: r.currency as CurrencyCode,
  priceUnit: r.price_unit as Deal["priceUnit"],
  refId: (r.flight_id ?? r.hotel_id ?? r.car_id)!,
  destinationCode: r.destination_code ?? undefined,
  imageUrl: r.image_url!,
  featured: r.featured ?? false,
});

const toDestination = (r: DestinationRow): Destination => ({
  id: r.id!,
  city: r.city!,
  country: r.country!,
  blurb: r.blurb!,
  priceFrom: r.price_from === null ? null : Number(r.price_from),
  currency: r.price_from === null ? null : (r.currency as CurrencyCode),
  rating: Number(r.rating),
  imageUrl: r.image_url!,
});

const monthStart = (month: string) => `${month}-01`;
const nextMonthStart = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return toISODate(new Date(y, m, 1));
};

export function createCatalog(db: Db, report: ReportError = () => {}) {
  const fail = (table: string, operation: string): never => {
    report(table, operation);
    throw new Error(`Could not load ${table}.`);
  };

  /** The matching rules of spec 0001, as database filters.
   *  Cheapest first, then shorter, then id; capped at 100 rows. */
  async function queryFlights(p: SearchParams, limit = ROW_CAP): Promise<Flight[]> {
    let q = db.from("flights").select("*");
    if (p.origin) q = q.eq("origin_code", p.origin);
    if (!p.anywhere && p.destination) q = q.eq("destination_code", p.destination);
    if (p.departDate) {
      const day = parseISODate(p.departDate);
      q = q
        .gte("depart_date", toISODate(addDays(day, -3)))
        .lte("depart_date", toISODate(addDays(day, 3)));
    } else if (p.month) {
      q = q
        .gte("depart_date", monthStart(p.month))
        .lt("depart_date", nextMonthStart(p.month));
    }
    // One way rows have null nights, so they drop out of a nights search.
    if (p.nights !== null) q = q.gte("nights", p.nights - 1).lte("nights", p.nights + 1);
    if (p.directOnly) q = q.eq("stops", 0);
    if (p.maxPrice !== null) q = q.lte("price", p.maxPrice);

    const { data, error } = await q
      .order("price")
      .order("duration_minutes")
      .order("id")
      .limit(limit);
    if (error) fail("flights", "select");
    return (data ?? []).map(toFlight);
  }

  return {
    async fetchAirports(): Promise<Airport[]> {
      const { data, error } = await db.from("airports").select("*").order("city");
      if (error) fail("airports", "select");
      return (data ?? []).map(toAirport);
    },

    queryFlights,

    /** Null when there is no such flight. A failed read throws. */
    async fetchFlight(id: string): Promise<Flight | null> {
      const { data, error } = await db.from("flights").select("*").eq("id", id).maybeSingle();
      if (error) fail("flights", "select");
      return data ? toFlight(data) : null;
    },

    /** Deals of one type, with prices worked out by the database view. */
    async fetchDeals(type: DealType): Promise<Deal[]> {
      const { data, error } = await db
        .from("deals_with_price")
        .select("*")
        .eq("type", type)
        .order("featured", { ascending: false })
        .order("id");
      if (error) fail("deals", "select");
      return (data ?? []).map(toDeal);
    },

    /** Best rated first. A city with no flight has no priceFrom. */
    async fetchDestinations(): Promise<Destination[]> {
      const { data, error } = await db
        .from("destinations_with_price")
        .select("*")
        .order("rating", { ascending: false });
      if (error) fail("destinations", "select");
      return (data ?? []).map(toDestination);
    },

    /** Results with reason lines, or, when empty, verified suggestions. */
    async searchFlights(
      p: SearchParams,
    ): Promise<{ results: RankedFlight[]; suggestions: Suggestion[] }> {
      const flights = await queryFlights(p);
      if (flights.length > 0) return { results: withReasons(flights), suggestions: [] };

      const [[cheapest], routeFlights] = await Promise.all([
        p.maxPrice !== null ? queryFlights({ ...p, maxPrice: null }, 1) : [],
        p.destination && !p.anywhere
          ? queryFlights(
              {
                ...p,
                month: null, departDate: null, returnDate: null, nights: null,
                directOnly: false, maxPrice: null,
              },
              1,
            )
          : [],
      ]);

      const candidates = suggestionCandidates(p, cheapest, routeFlights.length > 0);
      // Verified: a suggestion is shown only if its own query returns a flight.
      const verified = await Promise.all(
        candidates.map(async (s) =>
          (await queryFlights({ ...p, ...s.patch }, 1)).length > 0 ? s : null,
        ),
      );
      return {
        results: [],
        suggestions: verified.filter((s): s is Suggestion => s !== null).slice(0, 3),
      };
    },
  };
}
