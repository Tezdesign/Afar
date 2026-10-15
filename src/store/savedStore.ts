import { create } from "zustand";

import { account } from "@/lib/db";
import { createWriteThrough } from "@/lib/writeThrough";

type Status = "idle" | "loading" | "ready" | "error";

interface SavedState {
  /** Destination ids the signed in person has hearted. */
  savedIds: Set<string>;
  status: Status;
  /** Loads the account's saved list. Call on sign in, and to retry. */
  load: () => Promise<void>;
  /** Changes the heart at once, then saves it. Resolves false (and puts the
   *  heart back) when the save fails. */
  toggleSaved: (id: string) => Promise<boolean>;
  /** Empties the list from memory. Call on sign out. */
  clear: () => void;
}

const writes = createWriteThrough();

// Not persisted: the saved list lives in Supabase and is loaded after sign
// in, so another phone shows the same hearts and a guest never has any.
export const useSavedStore = create<SavedState>()((set, get) => ({
  savedIds: new Set<string>(),
  status: "idle",

  load: async () => {
    const epoch = writes.epoch;
    set({ status: "loading" });
    try {
      const ids = await account.fetchSavedIds();
      if (epoch === writes.epoch) set({ savedIds: new Set(ids), status: "ready" });
    } catch {
      if (epoch === writes.epoch) set({ status: "error" });
    }
  },

  toggleSaved: (id) => {
    const wanted = !get().savedIds.has(id);
    const apply = (saved: boolean) =>
      set((state) => {
        const next = new Set(state.savedIds);
        if (saved) next.add(id);
        else next.delete(id);
        return { savedIds: next };
      });

    apply(wanted);
    return writes.run(
      `saved:${id}`,
      () => (wanted ? account.saveDestination(id) : account.unsaveDestination(id)),
      () => apply(!wanted),
    );
  },

  clear: () => {
    writes.reset();
    set({ savedIds: new Set(), status: "idle" });
  },
}));
