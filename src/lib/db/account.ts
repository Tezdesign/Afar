// Account data accessors: alerts, activity log, recent searches, push tokens.
// No screens use these yet. Every call needs a signed in session: a guest
// runs as `anon`, which the database refuses, so the caller gates on sign in.
// Takes the client so it also runs under plain Node for account.check.ts.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SearchParams } from "../../store/searchStore.ts";
import type { Database, Json } from "../../types/database.ts";
import type { ReportError } from "./catalog.ts";

type Db = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];
export type Alert = Tables["alerts"]["Row"];
export type ActivityEntry = Tables["activity_log"]["Row"];
export type RecentSearch = Tables["recent_searches"]["Row"];

export type AlertStatus = "active" | "paused" | "undone";

export interface AlertInput {
  origin?: string | null;
  destination?: string | null;
  anywhere?: boolean;
  month?: string | null;
  nights?: number | null;
  maxPrice?: number | null;
  directOnly?: boolean;
}

export interface ActivityInput {
  actor: "assistant" | "user";
  action: string;
  summary: string;
  payload?: Json;
}

const RECENT_LIMIT = 10;

/** Statuses an alert may move from: active and paused swap, either can be undone. */
const ALERT_FROM: Record<AlertStatus, AlertStatus[]> = {
  active: ["paused"],
  paused: ["active"],
  undone: ["active", "paused"],
};

/** Parsed fields only. The typed text, the unrecognized words and the
 *  passenger counts are never stored. */
export const toRecentSearchRow = (p: SearchParams) => ({
  origin: p.origin,
  destination: p.destination,
  anywhere: p.anywhere,
  month: p.month,
  nights: p.nights,
  depart_date: p.departDate,
  return_date: p.returnDate,
  max_price: p.maxPrice,
  direct_only: p.directOnly,
});

/** Ids come newest first. Everything after the newest 10 is stale. */
export const staleIds = (idsNewestFirst: string[]) =>
  idsNewestFirst.slice(RECENT_LIMIT);

export function createAccount(db: Db, report: ReportError = () => {}) {
  const fail = (table: string, operation: string): never => {
    report(table, operation);
    throw new Error(`Could not use ${table}.`);
  };

  return {
    // --- alerts -----------------------------------------------------------

    /** Always a demo: there is no live price source yet (the database
     *  enforces it too). A destination and "anywhere" never go together. */
    async createAlert(input: AlertInput): Promise<Alert> {
      if (input.destination && input.anywhere) {
        throw new Error("An alert has a destination or anywhere, not both.");
      }
      const { data, error } = await db
        .from("alerts")
        .insert({
          origin: input.origin ?? null,
          destination: input.destination ?? null,
          anywhere: input.anywhere ?? false,
          month: input.month ?? null,
          nights: input.nights ?? null,
          max_price: input.maxPrice ?? null,
          direct_only: input.directOnly ?? false,
          is_demo: true,
        })
        .select()
        .single();
      if (error) fail("alerts", "insert");
      return data!;
    },

    async listAlerts(): Promise<Alert[]> {
      const { data, error } = await db
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) fail("alerts", "select");
      return data ?? [];
    },

    /** Returns the updated alert, or null when it was not in a state that
     *  may move to `status` (already there, or wrong id). */
    async setAlertStatus(id: string, status: AlertStatus): Promise<Alert | null> {
      const { data, error } = await db
        .from("alerts")
        .update({ status })
        .eq("id", id)
        .in("status", ALERT_FROM[status])
        .select()
        .maybeSingle();
      if (error) fail("alerts", "update");
      return data;
    },

    // --- activity log -----------------------------------------------------

    async logActivity(entry: ActivityInput): Promise<ActivityEntry> {
      const { data, error } = await db
        .from("activity_log")
        .insert({
          actor: entry.actor,
          action: entry.action,
          summary: entry.summary,
          payload: entry.payload ?? {},
        })
        .select()
        .single();
      if (error) fail("activity_log", "insert");
      return data!;
    },

    async listActivity(limit = 50): Promise<ActivityEntry[]> {
      const { data, error } = await db
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) fail("activity_log", "select");
      return data ?? [];
    },

    /** The only change the database allows on a log row. Null if already undone. */
    async markUndone(id: string): Promise<ActivityEntry | null> {
      const { data, error } = await db
        .from("activity_log")
        .update({ undone_at: new Date().toISOString() })
        .eq("id", id)
        .is("undone_at", null)
        .select()
        .maybeSingle();
      if (error) fail("activity_log", "update");
      return data;
    },

    // --- recent searches --------------------------------------------------

    /** Stores the parsed search, then drops everything past the newest 10. */
    async recordSearch(params: SearchParams): Promise<void> {
      const row = toRecentSearchRow(params);
      const empty = Object.values(row).every((v) => v === null || v === false);
      if (empty) return;

      const { error } = await db.from("recent_searches").insert(row);
      if (error) fail("recent_searches", "insert");

      const { data, error: listError } = await db
        .from("recent_searches")
        .select("id")
        .order("created_at", { ascending: false });
      if (listError) fail("recent_searches", "select");

      const stale = staleIds((data ?? []).map((r) => r.id));
      if (stale.length === 0) return;
      const { error: deleteError } = await db
        .from("recent_searches")
        .delete()
        .in("id", stale);
      if (deleteError) fail("recent_searches", "delete");
    },

    async listRecentSearches(): Promise<RecentSearch[]> {
      const { data, error } = await db
        .from("recent_searches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT);
      if (error) fail("recent_searches", "select");
      return data ?? [];
    },

    // --- push tokens ------------------------------------------------------

    /** One row per account and token; saving it again only refreshes last_seen_at. */
    async registerPushToken(token: string, platform: "ios" | "android"): Promise<void> {
      const { error } = await db
        .from("push_tokens")
        .upsert(
          { token, platform, last_seen_at: new Date().toISOString() },
          { onConflict: "user_id,token" },
        );
      if (error) fail("push_tokens", "upsert");
    },

    /** Call this BEFORE signOut(): afterwards the session token no longer
     *  works and the row would be left behind. */
    async removePushToken(token: string): Promise<void> {
      const { error } = await db.from("push_tokens").delete().eq("token", token);
      if (error) fail("push_tokens", "delete");
    },
  };
}
