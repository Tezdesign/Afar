import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SavedState {
  /** Deal/destination ids the user has hearted. */
  savedIds: Set<string>;
  toggleSaved: (id: string) => void;
  clearSaved: () => void;
}

interface SerializedSet {
  __type: "Set";
  values: string[];
}

const isSerializedSet = (value: unknown): value is SerializedSet =>
  typeof value === "object" &&
  value !== null &&
  (value as { __type?: unknown }).__type === "Set";

// Sets aren't JSON-native, so the persisted copy is converted to/from a
// plain array around AsyncStorage — the in-memory shape stays a real Set
// for O(1) `.has()` lookups, matching how screens already checked it.
const setAwareStorage = createJSONStorage<SavedState>(() => AsyncStorage, {
  replacer: (_key, value) =>
    value instanceof Set ? { __type: "Set", values: Array.from(value) } : value,
  reviver: (_key, value) => (isSerializedSet(value) ? new Set(value.values) : value),
});

export const useSavedStore = create<SavedState>()(
  persist(
    (set) => ({
      savedIds: new Set<string>(),
      toggleSaved: (id) =>
        set((state) => {
          const next = new Set(state.savedIds);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return { savedIds: next };
        }),
      clearSaved: () => set({ savedIds: new Set() }),
    }),
    {
      // "guest" is the default until SessionEffects (src/app/_layout.tsx)
      // points this at the signed-in account's own bucket — see the note
      // there on why storage is scoped per account.
      name: "saved-store:guest",
      storage: setAwareStorage,
    },
  ),
);
