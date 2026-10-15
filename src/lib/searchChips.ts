// Pure: turns search params into the chips (and form row values) the screens
// show. One chip per field, so the chips, the form rows and the store can
// never disagree.
import { airports } from "@/data/airports";
import { parseISODate } from "@/lib/dates";
import type { SearchParams } from "@/store/searchStore";

/** The four pickers. Chips and form rows open the same ones. */
export type Field = "where" | "when" | "budget" | "from";

export interface ChipSpec {
  key: "from" | "where" | "when" | "nights" | "budget" | "direct";
  /** Spoken name, for example "Origin" */
  name: string;
  /** Picker this chip opens. Null: tapping it just clears it. */
  field: Field | null;
  /** Null when the field has no value */
  label: string | null;
  /** Dashed empty chip text, "" for fields that never show one */
  empty: string;
  clear: Partial<SearchParams>;
}

const airportName = (code: string, compact: boolean) => {
  const airport = airports.find((a) => a.code === code);
  if (!airport) return code;
  return compact ? airport.city : `${airport.city} (${airport.code})`;
};

const monthName = (ym: string) => {
  const [year, month] = ym.split("-").map(Number);
  const name = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
  });
  return year === new Date().getFullYear() ? name : `${name} ${year}`;
};

const shortDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export function buildChips(p: SearchParams, compact: boolean): ChipSpec[] {
  const when = p.departDate
    ? p.returnDate
      ? `${shortDate(p.departDate)} – ${shortDate(p.returnDate)}`
      : shortDate(p.departDate)
    : p.month
      ? monthName(p.month)
      : null;

  return [
    {
      key: "from",
      name: "Origin",
      field: "from",
      label: p.origin ? `From ${airportName(p.origin, compact)}` : null,
      empty: "From",
      clear: { origin: null },
    },
    {
      key: "where",
      name: "Destination",
      field: "where",
      label: p.anywhere
        ? "Anywhere"
        : p.destination
          ? airportName(p.destination, compact)
          : null,
      empty: "Where",
      clear: { destination: null, anywhere: false },
    },
    {
      key: "when",
      name: "Dates",
      field: "when",
      label: when,
      empty: "When",
      clear: { month: null, departDate: null, returnDate: null },
    },
    {
      key: "nights",
      name: "Trip length",
      field: "when",
      label: p.nights ? `${p.nights} night${p.nights > 1 ? "s" : ""}` : null,
      empty: "",
      clear: { nights: null },
    },
    {
      key: "budget",
      name: "Budget",
      field: "budget",
      label: p.maxPrice !== null ? `Under ${p.maxPrice} EUR` : null,
      empty: "Budget",
      clear: { maxPrice: null },
    },
    {
      key: "direct",
      name: "Direct only",
      field: null,
      label: p.directOnly ? "Direct only" : null,
      empty: "",
      clear: { directOnly: false },
    },
  ];
}

/** What a form row shows for a field, or null when it has no value. */
export function fieldValue(p: SearchParams, field: Field): string | null {
  const chips = buildChips(p, false);
  const labels = chips
    .filter((c) => c.field === field && c.label)
    .map((c) => c.label as string);
  return labels.length ? labels.join(" · ") : null;
}

export const FIELD_NAME: Record<Field, string> = {
  where: "Destination",
  from: "Origin",
  when: "Dates",
  budget: "Budget",
};
