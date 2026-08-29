import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  /**
   * NOT for Clerk's real session token. Clerk's own token cache
   * (@clerk/expo/token-cache) already persists that securely — putting it
   * here too would duplicate it into unencrypted AsyncStorage. Keep this
   * for a lightweight, non-sensitive token only (e.g. a backend API token),
   * if the app ever needs one.
   */
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      reset: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      // "guest" is the default until SessionEffects (src/app/_layout.tsx)
      // points this at the signed-in account's own bucket — see the note
      // there on why storage is scoped per account.
      name: "auth-store:guest",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
