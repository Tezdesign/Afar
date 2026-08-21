import type { CarRental } from "@/types/travel";

export const cars: CarRental[] = [
  {
    id: "car-hertz-tunis",
    company: "Hertz",
    carType: "Economy",
    pickupCity: "Tunis",
    pricePerDay: 28,
    currency: "EUR",
  },
  {
    id: "car-europcar-paris",
    company: "Europcar",
    carType: "Compact",
    pickupCity: "Paris",
    pricePerDay: 35,
    currency: "EUR",
  },
  {
    id: "car-avis-rome",
    company: "Avis",
    carType: "SUV",
    pickupCity: "Rome",
    pricePerDay: 52,
    currency: "EUR",
  },
  {
    id: "car-sixt-barcelona",
    company: "Sixt",
    carType: "Economy",
    pickupCity: "Barcelona",
    pricePerDay: 31,
    currency: "EUR",
  },
];
