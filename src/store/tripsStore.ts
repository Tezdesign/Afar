import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { DealType } from "@/types/travel";

export interface Trip {
  id: string;
  type: DealType;
  /** id of the referenced Flight, Hotel, or CarRental */
  refId: string;
  /** ISO date the trip was booked */
  bookedAt: string;
}

interface TripsState {
  trips: Trip[];
  addTrip: (trip: Trip) => void;
  removeTrip: (id: string) => void;
  clearTrips: () => void;
}

export const useTripsStore = create<TripsState>()(
  persist(
    (set) => ({
      trips: [],
      addTrip: (trip) => set((state) => ({ trips: [...state.trips, trip] })),
      removeTrip: (id) =>
        set((state) => ({ trips: state.trips.filter((trip) => trip.id !== id) })),
      clearTrips: () => set({ trips: [] }),
    }),
    {
      name: "trips-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
