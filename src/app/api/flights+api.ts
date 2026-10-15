// Live flight prices from SerpApi (spec 0003). Public on purpose: guests
// get live prices too, so this route has no Clerk check. It spends a paid
// quota instead, which is guarded here: input validation, a 6 hour cache,
// shared in flight calls, and caps per device, per IP, per minute and per
// month. Every limit or failure answers 200 with a fallback, so the app keeps
// its sample results and shows why.
import {
  liveQueryKey,
  parseLiveQuery,
  serpApiParams,
  toLiveResponse,
  type SerpBody,
} from "@/lib/serpApi";
import type { LiveSearchResponse } from "@/types/travel";

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const intEnv = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};
const MONTHLY_CAP = intEnv(process.env.SERPAPI_MONTHLY_CAP, 200);
const DAILY_CAP = intEnv(process.env.SERPAPI_DEVICE_DAILY_CAP, 10);
const PER_MINUTE = intEnv(process.env.SERPAPI_GLOBAL_PER_MINUTE, 5);

const CACHE_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 10_000;
const DEVICE_ID = /^[A-Za-z0-9-]{16,64}$/;

// ponytail: in memory counters and cache. They reset on restart and are not
// shared across serverless instances, so on a real host only SerpApi's own
// plan limit holds. Move them to Supabase (or a KV store) before deploying.
// Kept on globalThis because the dev server evaluates this module again on
// every request, which would otherwise reset every cap and the cache.
interface LiveState {
  month: { key: string; count: number };
  dailyCounts: Map<string, number>; // "device:<id>:<day>" / "ip:<ip>:<day>"
  recentCalls: number[];
  cache: Map<string, { at: number; body: LiveSearchResponse }>;
  inFlight: Map<string, Promise<LiveSearchResponse>>;
}
const g = globalThis as typeof globalThis & { __afarLiveFlights?: LiveState };
const live = (g.__afarLiveFlights ??= {
  month: { key: "", count: 0 },
  dailyCounts: new Map(),
  recentCalls: [],
  cache: new Map(),
  inFlight: new Map(),
});
const { dailyCounts, cache, inFlight } = live;

const fallback = (reason: Extract<LiveSearchResponse, { status: "fallback" }>["reason"]) =>
  Response.json({ status: "fallback", reason } satisfies LiveSearchResponse);

/** Checks every cap and, only if all pass, counts the call. Synchronous on
 *  purpose: no await between check and increment, so parallel requests
 *  cannot overshoot (AC-5). */
function takeQuota(deviceId: string, ip: string, now: number) {
  const iso = new Date(now).toISOString();
  const monthKey = iso.slice(0, 7);
  const day = iso.slice(0, 10);
  if (live.month.key !== monthKey) live.month = { key: monthKey, count: 0 };
  for (const k of dailyCounts.keys()) if (!k.endsWith(day)) dailyCounts.delete(k);
  live.recentCalls = live.recentCalls.filter((t) => now - t < 60_000);

  if (live.month.count >= MONTHLY_CAP) return "quota" as const;
  const deviceKey = `device:${deviceId}:${day}`;
  const ipKey = `ip:${ip}:${day}`;
  if (
    (dailyCounts.get(deviceKey) ?? 0) >= DAILY_CAP ||
    (dailyCounts.get(ipKey) ?? 0) >= DAILY_CAP ||
    live.recentCalls.length >= PER_MINUTE
  )
    return "rate_limit" as const;

  live.month.count += 1;
  dailyCounts.set(deviceKey, (dailyCounts.get(deviceKey) ?? 0) + 1);
  dailyCounts.set(ipKey, (dailyCounts.get(ipKey) ?? 0) + 1);
  live.recentCalls.push(now);
  return null;
}

async function callSerpApi(params: Record<string, string>, apiKey: string) {
  const url = `https://serpapi.com/search.json?${new URLSearchParams({
    ...params,
    api_key: apiKey,
  })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  // SerpApi answers errors with a JSON body that has an `error` field.
  return (await res.json()) as SerpBody;
}

export async function GET(request: Request) {
  const now = Date.now();
  const today = new Date(now);

  const parsed = parseLiveQuery(new URL(request.url).searchParams, today);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  const deviceId = request.headers.get("x-device-id") ?? "";
  if (!DEVICE_ID.test(deviceId))
    return Response.json({ error: "x-device-id header is missing or invalid" }, { status: 400 });

  if (!SERPAPI_API_KEY) return fallback("not_configured");

  const { query } = parsed;
  const key = liveQueryKey(query);

  for (const [k, v] of cache) if (now - v.at >= CACHE_MS) cache.delete(k);
  const hit = cache.get(key);
  if (hit && hit.body.status === "live")
    return Response.json({ ...hit.body, cached: true } satisfies LiveSearchResponse);

  const shared = inFlight.get(key);
  if (shared) return Response.json(await shared);

  // No socket address is exposed to Expo API routes, so a request without a
  // proxy header shares one "local" bucket (fine on Metro in dev).
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const limited = takeQuota(deviceId, ip, now);
  if (limited) return fallback(limited);

  const params = serpApiParams(query, today);
  const call = callSerpApi(params, SERPAPI_API_KEY)
    .then((body) => toLiveResponse(query, params, body, new Date().toISOString()))
    .catch((): LiveSearchResponse => ({ status: "fallback", reason: "error" }))
    .then((body) => {
      if (body.status === "live") cache.set(key, { at: Date.now(), body });
      return body;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, call);

  return Response.json(await call);
}
