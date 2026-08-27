import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CurrencyCode } from "@/types/travel";

interface PreferencesState {
  language: string;
  currency: CurrencyCode;
  setLanguage: (language: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: "en",
      currency: "USD",
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: "preferences-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
