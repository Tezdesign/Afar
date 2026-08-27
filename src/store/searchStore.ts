import { create } from "zustand";

export interface SearchParams {
  origin: string | null;
  destination: string | null;
  /** ISO date */
  departDate: string | null;
  /** ISO date — omit for one-way */
  returnDate: string | null;
  adults: number;
  kids: number;
  directOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
}

const initialParams: SearchParams = {
  origin: null,
  destination: null,
  departDate: null,
  returnDate: null,
  adults: 1,
  kids: 0,
  directOnly: false,
  minPrice: null,
  maxPrice: null,
};

interface SearchState extends SearchParams {
  /** Merges into the current params — the only way to mutate this store. */
  setSearchParams: (params: Partial<SearchParams>) => void;
  reset: () => void;
}

// Not persisted: an in-progress search is session state, not something a
// user expects to reopen the app into.
export const useSearchStore = create<SearchState>()((set) => ({
  ...initialParams,
  setSearchParams: (params) => set(params),
  reset: () => set(initialParams),
}));
