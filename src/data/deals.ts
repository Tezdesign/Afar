import type { Deal } from "@/types/travel";

import { unsplash } from "./photos";

// Featured deals for the home/explore feed — each references the
// underlying Flight/Hotel/CarRental it's built from via refId.
//
// Two deals per type (flight / hotel / car). The one marked `featured`
// shows in the home hero carousel when its mode is active; the rest fall
// through to the "Trending now" list.
export const deals: Deal[] = [
  {
    id: "deal-tunis-paris",
    type: "flight",
    title: "Tunis to Paris",
    subtitle: "Air France · round trip",
    price: 214,
    currency: "EUR",
    refId: "flight-tun-cdg-1",
    imageUrl: unsplash("1436491865332-7a61a109cc05"),
    featured: true,
  },
  {
    id: "deal-barcelona-rome-hop",
    type: "flight",
    title: "Barcelona to Rome",
    subtitle: "Vueling · direct",
    price: 58,
    currency: "EUR",
    refId: "flight-bcn-fco-1",
    imageUrl: unsplash("1512470876302-972faa2aa9a4"),
  },
  {
    id: "deal-tunis-medina-stay",
    type: "hotel",
    title: "Stay in the Medina",
    subtitle: "Riad Dar Zaman, Tunis",
    price: 54,
    currency: "EUR",
    refId: "hotel-riad-dar-zaman",
    imageUrl: unsplash("1539020140153-e479b8c22e70"),
    featured: true,
  },
  {
    id: "deal-rome-artemide-stay",
    type: "hotel",
    title: "Hotel Artemide, Rome",
    subtitle: "4★ · Via Nazionale",
    price: 135,
    currency: "EUR",
    refId: "hotel-artemide",
    imageUrl: unsplash("1566073771259-6a8506099945"),
  },
  {
    id: "deal-rome-weekend-wheels",
    type: "car",
    title: "Weekend wheels in Rome",
    subtitle: "Avis SUV rental",
    price: 44,
    currency: "EUR",
    refId: "car-avis-rome",
    imageUrl: unsplash("1503376780353-7e6692767b70"),
    featured: true,
  },
  {
    id: "deal-barcelona-city-wheels",
    type: "car",
    title: "City wheels in Barcelona",
    subtitle: "Sixt · economy",
    price: 31,
    currency: "EUR",
    refId: "car-sixt-barcelona",
    imageUrl: unsplash("1555881400-74d7acaacd8b"),
  },
];
