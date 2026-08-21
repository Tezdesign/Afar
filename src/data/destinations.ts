import type { Destination } from "@/types/travel";

export const destinations: Destination[] = [
  {
    id: "destination-paris",
    city: "Paris",
    country: "France",
    blurb: "Cafés, the Seine, and world-class museums.",
    priceFrom: 89,
    currency: "EUR",
  },
  {
    id: "destination-barcelona",
    city: "Barcelona",
    country: "Spain",
    blurb: "Gaudí architecture, tapas, and beach afternoons.",
    priceFrom: 58,
    currency: "EUR",
  },
  {
    id: "destination-rome",
    city: "Rome",
    country: "Italy",
    blurb: "Ancient ruins, pasta, and golden-hour piazzas.",
    priceFrom: 89,
    currency: "EUR",
  },
  {
    id: "destination-london",
    city: "London",
    country: "United Kingdom",
    blurb: "Markets, theatre, and a river full of history.",
    priceFrom: 99,
    currency: "GBP",
  },
];
