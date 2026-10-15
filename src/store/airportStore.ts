import { create } from "zustand";

import { catalog } from "@/lib/db";
import type { Airport } from "@/types/travel";

type Status = "idle" | "loading" | "ready" | "error";

interface AirportState {
  airports: Airport[];
  status: Status;
  /** Loads once at app start. Calling it again after an error retries. */
  load: () => Promise<void>;
}

// Not persisted: the airports always come fresh from the database, and no
// screen renders until they have loaded (see AppGate in src/app/_layout.tsx),
// so a screen never sees an empty list.
export const useAirportStore = create<AirportState>()((set, get) => ({
  airports: [],
  status: "idle",
  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading" });
    try {
      const airports = await catalog.fetchAirports();
      // An empty list would leave every picker and the parser with nothing.
      set(airports.length > 0 ? { airports, status: "ready" } : { status: "error" });
    } catch {
      set({ status: "error" });
    }
  },
}));
