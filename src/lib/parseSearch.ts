// Pure: reads no clock and no module state, imports no React, never throws.
// Runs under plain Node for parseSearch.check.ts, so it imports nothing at
// runtime except by relative path with a .ts extension (types are erased).
import type { SearchParams } from "@/store/searchStore";
import type { Airport } from "@/types/travel";
import { addDays, toISODate } from "./dates.ts";

export interface ParsedSearch {
  params: Partial<SearchParams>;
  /** Every phrase the parser could not map. The screen shows 3, then "+N more". */
  unrecognized: string[];
}

interface Tok {
  text: string;
  low: string;
  used: boolean;
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june", "july",
  "august", "september", "october", "november", "december",
];
const monthIndex = (low: string) =>
  low === "sept"
    ? 8
    : low.length >= 3
      ? MONTHS.findIndex((m) => m === low || m.slice(0, 3) === low)
      : -1;

const BUDGET_WORDS = new Set(["under", "below", "max", "budget"]);
const EUR_WORDS = new Set(["eur", "euro", "euros"]);
const OTHER_CURRENCY_WORDS = new Set([
  "usd", "gbp", "tnd", "cad", "aud", "chf", "jpy", "dollar", "dollars",
  "pound", "pounds", "dinar", "dinars", "yen",
]);
const NIGHT_WORDS = new Set(["night", "nights"]);
const DAY_WORDS = new Set(["day", "days"]);
const AMOUNT = /^([€$£])?(\d+(?:[.,]\d+)?)([€$£])?$/;

const FILLER = new Set([
  "a", "an", "the", "in", "for", "on", "and", "or", "i", "want", "fly",
  "flight", "flights", "trip", "me", "from", "to", "please", "with", "at",
  "of", "my", "go", "going", "like", "would", "need", "find", "show", "get",
]);

/** Home and Search examples. No month, weekend or relative date, so they
 *  never go stale, and each reads fully and returns flights on any day. */
export const EXAMPLE_PROMPTS = [
  "Anywhere from Tunis under 300 EUR",
  "Tunis to Paris direct",
  "Rome from Barcelona under 100 EUR",
];

const pad = (n: number) => String(n).padStart(2, "0");

const tokenize = (text: string): Tok[] =>
  text
    .split(/\s+/)
    .map((w) => w.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, ""))
    .filter(Boolean)
    .map((w) => ({ text: w, low: w.toLowerCase(), used: false }));

export function parseSearch(
  text: string,
  today: Date,
  airports: Airport[],
): ParsedSearch {
  const t = tokenize(text);
  const found: Partial<SearchParams> = {};
  const chips: { at: number; text: string }[] = [];

  const y = today.getFullYear();
  const m = today.getMonth();
  const midnight = new Date(y, m, today.getDate());

  const free = (i: number) => i >= 0 && i < t.length && !t[i].used;
  const low = (i: number) => (free(i) ? t[i].low : "");
  const claim = (a: number, b: number) => {
    for (let i = a; i < b; i++) t[i].used = true;
  };
  const reject = (a: number, b: number) => {
    chips.push({ at: a, text: t.slice(a, b).map((x) => x.text).join(" ") });
    claim(a, b);
  };
  // A field is set once. A second mention becomes an Unrecognized chip.
  const put = <K extends keyof SearchParams>(
    key: K,
    value: SearchParams[K],
    a: number,
    b: number,
  ) => {
    if (key in found) reject(a, b);
    else {
      found[key] = value;
      claim(a, b);
    }
  };

  /** Next upcoming occurrence of a day and month (never in the past). */
  const upcoming = (mi: number, day: number) => {
    for (let yr = y; yr <= y + 4; yr++) {
      const dt = new Date(yr, mi, day);
      if (dt.getMonth() === mi && dt >= midnight) return dt;
    }
    return null;
  };

  // 1. Exact date: "21 Aug", "Aug 21", "2026-08-21"
  for (let i = 0; i < t.length; i++) {
    if (!free(i)) continue;
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t[i].low);
    if (iso) {
      const dt = new Date(+iso[1], +iso[2] - 1, +iso[3]);
      const real = dt.getMonth() === +iso[2] - 1 && dt.getDate() === +iso[3];
      if (real && dt >= midnight) put("departDate", toISODate(dt), i, i + 1);
      else reject(i, i + 1);
      continue;
    }
    const dayFirst = /^\d{1,2}$/.test(low(i)) && monthIndex(low(i + 1)) >= 0;
    const monthFirst =
      monthIndex(low(i)) >= 0 &&
      /^\d{1,2}$/.test(low(i + 1)) &&
      !NIGHT_WORDS.has(low(i + 2)) &&
      !DAY_WORDS.has(low(i + 2));
    if (!dayFirst && !monthFirst) continue;
    const day = +(dayFirst ? low(i) : low(i + 1));
    if (day < 1 || day > 31) continue;
    const dt = upcoming(monthIndex(dayFirst ? low(i + 1) : low(i)), day);
    if (dt) put("departDate", toISODate(dt), i, i + 2);
    else reject(i, i + 2);
  }

  // 2. Length: "5 nights", "3 days" (3 days is 2 nights)
  for (let i = 0; i < t.length; i++) {
    if (!/^\d+$/.test(low(i))) continue;
    const unit = low(i + 1);
    const isDays = DAY_WORDS.has(unit);
    if (!isDays && !NIGHT_WORDS.has(unit)) continue;
    const n = Number(low(i));
    const nights = isDays ? Math.max(1, n - 1) : n;
    if (n < 1 || nights > 30) reject(i, i + 2);
    else put("nights", nights, i, i + 2);
  }

  // 3. Budget: "under 400", "€400", "400 EUR". Another currency is not a budget.
  const readAmount = (i: number) => {
    let j = i;
    let eur = false;
    let other = false;
    const word = (k: number) => {
      if (EUR_WORDS.has(low(k))) eur = true;
      else if (OTHER_CURRENCY_WORDS.has(low(k))) other = true;
      else return false;
      return true;
    };
    if (word(j)) j++;
    const amount = AMOUNT.exec(low(j));
    if (!amount) return null;
    for (const symbol of [amount[1], amount[3]]) {
      if (symbol === "€") eur = true;
      else if (symbol) other = true;
    }
    j++;
    if (word(j)) j++;
    return { start: i, end: j, value: Number(amount[2].replace(",", ".")), eur, other };
  };
  for (let i = 0; i < t.length; i++) {
    if (!free(i)) continue;
    const keyword = BUDGET_WORDS.has(t[i].low);
    const r = readAmount(keyword ? i + 1 : i);
    if (!r || (!keyword && !r.eur && !r.other)) continue;
    if (keyword) claim(i, i + 1);
    if (r.other || !(r.value > 0) || !Number.isFinite(r.value))
      reject(r.start, r.end);
    else put("maxPrice", r.value, r.start, r.end);
  }

  // 4. Direct
  for (let i = 0; i < t.length; i++) {
    if (["direct", "nonstop", "non-stop"].includes(low(i))) {
      found.directOnly = true;
      claim(i, i + 1);
    }
  }

  // 5. Anywhere. Applied after the airports: a named city wins over it, so
  // "Rome in March somewhere warm" keeps Rome and only "warm" is unread.
  let anywhere = false;
  for (let i = 0; i < t.length; i++) {
    if (low(i) === "anywhere" || low(i) === "somewhere") {
      anywhere = true;
      claim(i, i + 1);
    }
  }

  // 6. Weekend: "weekend", "this weekend", "weekend in March"
  const saturdayIn = (mi: number) => {
    for (let yr = y; yr <= y + 1; yr++)
      for (let d = 1; d <= 31; d++) {
        const dt = new Date(yr, mi, d);
        if (dt.getMonth() !== mi) break;
        if (dt.getDay() === 6 && dt >= midnight) return dt;
      }
    return null;
  };
  for (let i = 0; i < t.length; i++) {
    if (low(i) !== "weekend") continue;
    const a = low(i - 1) === "this" ? i - 1 : i;
    const inMonth = low(i + 1) === "in" && monthIndex(low(i + 2)) >= 0;
    const b = inMonth ? i + 3 : i + 1;
    const saturday = inMonth
      ? saturdayIn(monthIndex(low(i + 2)))
      : addDays(midnight, (13 - midnight.getDay()) % 7);
    if (!saturday || "departDate" in found) reject(a, b);
    else {
      found.departDate = toISODate(saturday);
      found.returnDate = toISODate(addDays(saturday, 1));
      claim(a, b);
    }
  }

  // 7. Relative month: "next month"
  for (let i = 0; i < t.length; i++) {
    if (low(i) === "next" && low(i + 1) === "month")
      put("month", toISODate(new Date(y, m + 1, 1)).slice(0, 7), i, i + 2);
  }

  // 8. Month name. "may" counts only right after "in" (next to a day number
  // it was already read in rule 1).
  for (let i = 0; i < t.length; i++) {
    const mi = monthIndex(low(i));
    if (mi < 0 || (low(i) === "may" && low(i - 1) !== "in")) continue;
    const typedYear = /^20\d\d$/.test(low(i + 1)) ? Number(low(i + 1)) : null;
    const end = typedYear ? i + 2 : i + 1;
    const year = typedYear ?? (mi >= m ? y : y + 1);
    if (year * 12 + mi < y * 12 + m) reject(i, end);
    else put("month", `${year}-${pad(mi + 1)}`, i, end);
  }

  // 9. Airports: city name or IATA code. "from X" origin, "to X" or a lone
  // city destination, "X to Y" origin then destination.
  const mentions: { a: number; b: number; code: string }[] = [];
  for (let i = 0; i < t.length; i++) {
    for (const airport of airports) {
      const words = airport.city.toLowerCase().split(" ");
      const isCity = words.every((w, k) => low(i + k) === w);
      if (isCity || low(i) === airport.code.toLowerCase()) {
        const b = i + (isCity ? words.length : 1);
        mentions.push({ a: i, b, code: airport.code });
        i = b - 1;
        break;
      }
    }
  }
  mentions.forEach((mention, k) => {
    const before = low(mention.a - 1);
    const isOrigin =
      before === "from" ||
      (before !== "to" &&
        low(mention.b) === "to" &&
        mentions[k + 1]?.a === mention.b + 1);
    put(isOrigin ? "origin" : "destination", mention.code, mention.a, mention.b);
  });
  if (anywhere && !("destination" in found)) found.anywhere = true;

  // Everything left that is not a filler word. Adjacent words share a chip.
  let run: number[] = [];
  const flush = () => {
    if (run.length)
      chips.push({ at: run[0], text: run.map((i) => t[i].text).join(" ") });
    run = [];
  };
  for (let i = 0; i < t.length; i++) {
    if (!t[i].used && !FILLER.has(t[i].low)) run.push(i);
    else flush();
  }
  flush();

  return {
    params: found,
    unrecognized: chips.sort((p, q) => p.at - q.at).map((c) => c.text),
  };
}
