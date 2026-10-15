import { create } from "zustand";

import { account, type TripInput } from "@/lib/db";
import { createWriteThrough } from "@/lib/writeThrough";
import type { CurrencyCode, DealType } from "@/types/travel";

export interface Trip {
  id: string;
  type: DealType;
  /** What the trip looked like when it was booked. Always readable. */
  title: string;
  price: number;
  currency: CurrencyCode;
  /** ISO timestamp the trip was recorded */
  bookedAt: string;
}

type Status = "idle" | "loading" | "ready" | "error";

interface TripsState {
  trips: Trip[];
  status: Status;
  load: () => Promise<void>;
  /** Shows the trip at once, then saves it. Resolves false (and removes it
   *  again) when the save fails. Calling it twice with one id makes one trip. */
  addTrip: (input: TripInput) => Promise<boolean>;
  removeTrip: (id: string) => Promise<boolean>;
  clear: () => void;
}

const writes = createWriteThrough();

// Nothing in the app creates a trip yet (Afar does not book), so no screen
// reads this beyond its empty state. The accessors are ready for the slice
// that records one.
export const useTripsStore = create<TripsState>()((set, get) => ({
  trips: [],
  status: "idle",

  load: async () => {
    const epoch = writes.epoch;
    set({ status: "loading" });
    try {
      const rows = await account.listTrips();
      if (epoch !== writes.epoch) return;
      set({
        status: "ready",
        trips: rows.map((r) => ({
          id: r.id,
          type: r.type as DealType,
          title: r.snapshot_title,
          price: Number(r.snapshot_price),
          currency: r.snapshot_currency as CurrencyCode,
          bookedAt: r.booked_at,
        })),
      });
    } catch {
      if (epoch === writes.epoch) set({ status: "error" });
    }
  },

  addTrip: (input) => {
    const trip: Trip = {
      id: input.id,
      type: input.type,
      title: input.title,
      price: input.price,
      currency: input.currency,
      bookedAt: new Date().toISOString(),
    };
    if (!get().trips.some((t) => t.id === trip.id)) {
      set((state) => ({ trips: [...state.trips, trip] }));
    }
    return writes.run(
      `trip:${input.id}`,
      () => account.createTrip(input),
      () => set((state) => ({ trips: state.trips.filter((t) => t.id !== input.id) })),
    );
  },

  removeTrip: (id) => {
    const removed = get().trips.find((t) => t.id === id);
    set((state) => ({ trips: state.trips.filter((t) => t.id !== id) }));
    return writes.run(
      `trip:${id}`,
      () => account.deleteTrip(id),
      () => {
        if (removed) set((state) => ({ trips: [...state.trips, removed] }));
      },
    );
  },

  clear: () => {
    writes.reset();
    set({ trips: [], status: "idle" });
  },
}));
