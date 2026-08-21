import type { Deal } from "@/types/travel";

// Featured deals for the home/explore feed — each references the
// underlying Flight/Hotel/CarRental it's built from via refId.
export const deals: Deal[] = [
  {
    id: "deal-paris-fare-drop",
    type: "flight",
    title: "Paris fare drop",
    subtitle: "Round trip from Tunis",
    discountPercent: 18,
    price: 214,
    currency: "EUR",
    refId: "flight-tun-cdg-1",
  },
  {
    id: "deal-tunis-medina-stay",
    type: "hotel",
    title: "Stay in the Medina",
    subtitle: "Riad Dar Zaman, Tunis",
    price: 54,
    currency: "EUR",
    refId: "hotel-riad-dar-zaman",
  },
  {
    id: "deal-rome-weekend-wheels",
    type: "car",
    title: "Weekend wheels in Rome",
    subtitle: "Avis SUV rental",
    discountPercent: 15,
    price: 44,
    currency: "EUR",
    refId: "car-avis-rome",
  },
];
