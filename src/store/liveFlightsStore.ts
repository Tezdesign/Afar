import { create } from "zustand";

import type { Flight, LiveSearchResponse } from "@/types/travel";

export interface LiveEntry {
  flight: Flight;
  /** ISO time the price was fetched */
  checkedAt: string;
  priceLevel?: Extract<LiveSearchResponse, { status: "live" }>["priceLevel"];
}

interface LiveFlightsState {
  /** Live flights by id, so flight detail can open one (spec 0003, AC-11). */
  byId: Record<string, LiveEntry>;
  add: (response: Extract<LiveSearchResponse, { status: "live" }>) => void;
}

// Memory only, not persisted and not scoped: live prices are only true for a
// moment, so a live flight is gone after an app restart (detail then shows
// its not found state).
export const useLiveFlightsStore = create<LiveFlightsState>()((set) => ({
  byId: {},
  add: ({ flights, checkedAt, priceLevel }) =>
    set((s) => ({
      byId: {
        ...s.byId,
        ...Object.fromEntries(flights.map((flight) => [flight.id, { flight, checkedAt, priceLevel }])),
      },
    })),
}));
