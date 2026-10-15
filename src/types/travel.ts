// Typed model for Afar's travel search content — hardcoded sample data
// per AGENTS.md's Important Constraints (no database, no live API calls
// yet). This is the catalog search results and the home/explore feed get
// built against.

export type CurrencyCode = "EUR" | "USD" | "GBP";

export interface Airport {
  /** IATA code, e.g. "TUN" */
  code: string;
  city: string;
  /** Display name, derived from countryCode */
  country: string;
  /** ISO 3166-1 alpha-2, e.g. "TN" */
  countryCode: string;
}

export interface Flight {
  id: string;
  /** Airport.code */
  originCode: string;
  /** Airport.code */
  destinationCode: string;
  /** ISO date, e.g. "2026-09-03" */
  departDate: string;
  /** ISO date — omit for one-way */
  returnDate?: string;
  airline: string;
  price: number;
  currency: CurrencyCode;
  durationMinutes: number;
  /** 0 = direct */
  stops: number;
  /** Where the row came from; "sample" for the seeded catalog */
  source?: string;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  /** Short location line, e.g. "Le Marais" */
  neighborhood: string;
  starRating: number;
  reviewScore: number;
  reviewCount: number;
  pricePerNight: number;
  currency: CurrencyCode;
}

export interface CarRental {
  id: string;
  company: string;
  /** e.g. "Economy", "Compact", "SUV" */
  carType: string;
  pickupCity: string;
  pricePerDay: number;
  currency: CurrencyCode;
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  blurb: string;
  /** Cheapest flight to this city. Null when no flight serves it. */
  priceFrom: number | null;
  /** Currency of priceFrom. Null when priceFrom is null. */
  currency: CurrencyCode | null;
  /** Aggregate traveller rating, 0–5, one decimal */
  rating: number;
  /** Remote hero photo (Unsplash CDN) */
  imageUrl: string;
}

export type DealType = "flight" | "hotel" | "car";

export interface Deal {
  id: string;
  type: DealType;
  title: string;
  subtitle: string;
  price: number;
  currency: CurrencyCode;
  /** What the price covers, so a nightly price is never shown as a trip total */
  priceUnit: "trip" | "night" | "day";
  /** id of the referenced Flight, Hotel, or CarRental */
  refId: string;
  /** Destination airport of a flight deal */
  destinationCode?: string;
  /** Remote card photo (Unsplash CDN) */
  imageUrl: string;
  /** True → shown in the home hero carousel for its mode.
   *  False/undefined → only appears in the "Trending now" list. */
  featured?: boolean;
}
