// Turns a Results search into a GET /api/flights query (spec 0003, AC-8).
// Pure: today is passed in, so serpApi.check.ts covers it under plain Node.
import type { SearchParams } from "../store/searchStore.ts";
import { addDays, parseISODate, toISODate } from "./dates.ts";
import { monthWindow } from "./serpApi.ts";

export type LiveHint = "no_origin" | "no_date" | "past";

export type LiveRequest =
  | {
      kind: "request";
      /** Query string for /api/flights, without the leading "?" */
      query: string;
      anywhere: boolean;
      /** Set when the app picked the date for a month only route search,
       *  so the screen can show it as a chip the person can change. */
      chosenDate: string | null;
    }
  | { kind: "hint"; hint: LiveHint };

const hint = (h: LiveHint): LiveRequest => ({ kind: "hint", hint: h });

export function liveRequestFor(p: SearchParams, today: Date): LiveRequest {
  if (!p.origin) return hint("no_origin");
  const todayIso = toISODate(today);
  const anywhere = p.anywhere || !p.destination;
  const q = new URLSearchParams({ from: p.origin });
  let chosenDate: string | null = null;

  if (anywhere) {
    if (p.departDate) {
      if (p.departDate < todayIso) return hint("past");
      q.set("depart", p.departDate);
      if (p.returnDate) q.set("return", p.returnDate);
    } else if (p.month) {
      if (!monthWindow(p.month, today)) return hint("past");
      q.set("month", p.month);
    }
    if (!p.returnDate && p.nights !== null) q.set("nights", String(p.nights));
  } else {
    q.set("to", p.destination!);
    let depart = p.departDate;
    if (!depart && p.month) {
      // The 1st, or tomorrow once the month has started.
      const window = monthWindow(p.month, today);
      if (!window) return hint("past");
      depart = chosenDate = window.split(",")[0];
    }
    if (!depart) return hint("no_date");
    if (depart < todayIso) return hint("past");
    q.set("depart", depart);
    const ret =
      p.returnDate ??
      (p.nights !== null ? toISODate(addDays(parseISODate(depart), p.nights)) : null);
    if (ret) q.set("return", ret);
  }

  if (p.directOnly) q.set("direct", "1");
  if (p.maxPrice !== null) q.set("maxPrice", String(p.maxPrice));
  return { kind: "request", query: q.toString(), anywhere, chosenDate };
}
