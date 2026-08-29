import type { Destination } from "@/types/travel";

import { unsplash } from "./photos";

export const destinations: Destination[] = [
  {
    id: "destination-paris",
    city: "Paris",
    country: "France",
    blurb: "Cafés, the Seine, and world-class museums.",
    priceFrom: 89,
    currency: "EUR",
    rating: 4.8,
    imageUrl: unsplash("1502602898657-3e91760cbb34"),
  },
  {
    id: "destination-barcelona",
    city: "Barcelona",
    country: "Spain",
    blurb: "Gaudí architecture, tapas, and beach afternoons.",
    priceFrom: 58,
    currency: "EUR",
    rating: 4.7,
    imageUrl: unsplash("1583422409516-2895a77efded"),
  },
  {
    id: "destination-rome",
    city: "Rome",
    country: "Italy",
    blurb: "Ancient ruins, pasta, and golden-hour piazzas.",
    priceFrom: 89,
    currency: "EUR",
    rating: 4.9,
    imageUrl: unsplash("1552832230-c0197dd311b5"),
  },
  {
    id: "destination-london",
    city: "London",
    country: "United Kingdom",
    blurb: "Markets, theatre, and a river full of history.",
    priceFrom: 99,
    currency: "GBP",
    rating: 4.6,
    imageUrl: unsplash("1513635269975-59663e0ac1ad"),
  },
];
