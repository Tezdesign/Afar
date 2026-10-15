// Local calendar dates only. Never go through toISOString(): it converts to
// UTC, so a late evening user would get tomorrow's date.
// No imports, so parseSearch.check.ts can run under plain Node.

const pad = (n: number) => String(n).padStart(2, "0");

/** Local "YYYY-MM-DD" */
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "YYYY-MM-DD" to a Date at local midnight (new Date(iso) would be UTC) */
export const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

/** Whole days from a to b, local calendar days */
export const daysBetween = (a: Date, b: Date) =>
  Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
      86_400_000,
  );
