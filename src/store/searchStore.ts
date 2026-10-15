import { create } from "zustand";

export interface SearchParams {
  origin: string | null;
  destination: string | null;
  /** True means "any destination". Never set together with `destination`. */
  anywhere: boolean;
  /** "YYYY-MM" */
  month: string | null;
  /** Trip length, 1 to 30 */
  nights: number | null;
  /** ISO date */
  departDate: string | null;
  /** ISO date — omit for one-way */
  returnDate: string | null;
  adults: number;
  kids: number;
  directOnly: boolean;
  minPrice: number | null;
  /** Budget in EUR */
  maxPrice: number | null;
  /** Words the parser could not read. Display only, never filters. */
  unrecognized: string[];
}

const initialParams: SearchParams = {
  origin: null,
  destination: null,
  anywhere: false,
  month: null,
  nights: null,
  departDate: null,
  returnDate: null,
  adults: 1,
  kids: 0,
  directOnly: false,
  minPrice: null,
  maxPrice: null,
  unrecognized: [],
};

interface SearchState extends SearchParams {
  /** Merges into the current params — the only way to mutate this store.
   *  Keeps `anywhere` and `destination` from both being set. */
  setSearchParams: (params: Partial<SearchParams>) => void;
  reset: () => void;
}

// Not persisted: an in-progress search is session state, not something a
// user expects to reopen the app into.
export const useSearchStore = create<SearchState>()((set) => ({
  ...initialParams,
  setSearchParams: (params) =>
    set(
      params.anywhere
        ? { ...params, destination: null }
        : params.destination
          ? { ...params, anywhere: false }
          : params,
    ),
  reset: () => set(initialParams),
}));
