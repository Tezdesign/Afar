import { addDays, toISODate } from "@/lib/dates";
import type { Flight } from "@/types/travel";

// Dates are stored as day offsets from today and resolved once at load, in
// local calendar dates, so sample results are never in the past.
type FlightSeed = Omit<Flight, "departDate" | "returnDate"> & {
  departInDays: number;
  returnInDays?: number;
};

const seeds: FlightSeed[] = [
  {
    id: "flight-tun-bcn-1",
    originCode: "TUN",
    destinationCode: "BCN",
    departInDays: 25,
    airline: "Tunisair",
    price: 76,
    currency: "EUR",
    durationMinutes: 115,
    stops: 0,
  },
  {
    id: "flight-tun-cdg-1",
    originCode: "TUN",
    destinationCode: "CDG",
    departInDays: 20,
    returnInDays: 23,
    airline: "Air France",
    price: 214,
    currency: "EUR",
    durationMinutes: 135,
    stops: 0,
  },
  {
    id: "flight-cdg-fco-1",
    originCode: "CDG",
    destinationCode: "FCO",
    departInDays: 34,
    airline: "ITA Airways",
    price: 89,
    currency: "EUR",
    durationMinutes: 130,
    stops: 1,
  },
  {
    id: "flight-lhr-jfk-1",
    originCode: "LHR",
    destinationCode: "JFK",
    departInDays: 45,
    returnInDays: 52,
    airline: "British Airways",
    price: 480,
    currency: "EUR",
    durationMinutes: 470,
    stops: 0,
  },
  {
    id: "flight-bcn-fco-1",
    originCode: "BCN",
    destinationCode: "FCO",
    departInDays: 39,
    airline: "Vueling",
    price: 58,
    currency: "EUR",
    durationMinutes: 105,
    stops: 0,
  },
  {
    id: "flight-tun-fco-1",
    originCode: "TUN",
    destinationCode: "FCO",
    departInDays: 28,
    returnInDays: 32,
    airline: "Nouvelair",
    price: 142,
    currency: "EUR",
    durationMinutes: 100,
    stops: 0,
  },
  {
    id: "flight-tun-cdg-2",
    originCode: "TUN",
    destinationCode: "CDG",
    departInDays: 41,
    airline: "Transavia",
    price: 97,
    currency: "EUR",
    durationMinutes: 140,
    stops: 0,
  },
  {
    id: "flight-tun-lhr-1",
    originCode: "TUN",
    destinationCode: "LHR",
    departInDays: 30,
    returnInDays: 37,
    airline: "Tunisair",
    price: 289,
    currency: "EUR",
    durationMinutes: 215,
    stops: 0,
  },
  {
    id: "flight-tun-jfk-1",
    originCode: "TUN",
    destinationCode: "JFK",
    departInDays: 55,
    airline: "Turkish Airlines",
    price: 536,
    currency: "EUR",
    durationMinutes: 780,
    stops: 1,
  },
  {
    id: "flight-cdg-bcn-1",
    originCode: "CDG",
    destinationCode: "BCN",
    departInDays: 24,
    returnInDays: 27,
    airline: "Vueling",
    price: 119,
    currency: "EUR",
    durationMinutes: 125,
    stops: 0,
  },
  {
    id: "flight-lhr-cdg-1",
    originCode: "LHR",
    destinationCode: "CDG",
    departInDays: 36,
    airline: "easyJet",
    price: 64,
    currency: "EUR",
    durationMinutes: 80,
    stops: 0,
  },
  {
    id: "flight-fco-tun-1",
    originCode: "FCO",
    destinationCode: "TUN",
    departInDays: 50,
    airline: "ITA Airways",
    price: 92,
    currency: "EUR",
    durationMinutes: 105,
    stops: 0,
  },
];

const today = new Date();

export const flights: Flight[] = seeds.map(
  ({ departInDays, returnInDays, ...flight }) => ({
    ...flight,
    departDate: toISODate(addDays(today, departInDays)),
    returnDate:
      returnInDays === undefined
        ? undefined
        : toISODate(addDays(today, returnInDays)),
  }),
);
