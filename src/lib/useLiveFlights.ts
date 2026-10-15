import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { getDeviceId } from "@/lib/deviceId";
import { liveRequestFor, type LiveHint } from "@/lib/liveFlights";
import type { SearchParams } from "@/store/searchStore";
import { useLiveFlightsStore } from "@/store/liveFlightsStore";
import type { LiveSearchResponse } from "@/types/travel";

const DEBOUNCE_MS = 800;

export type LiveState =
  | { status: "hint"; hint: LiveHint }
  | { status: "loading" }
  | { status: "done"; response: LiveSearchResponse };

/**
 * Live prices for the current search (spec 0003, AC-7). Waits 800 ms after
 * the last change to `key`, and a newer search aborts the older request, so
 * quick chip edits spend at most one SerpApi search. Any network failure is
 * an "error" fallback: the screen keeps its sample results.
 */
export function useLiveFlights(params: SearchParams, key: string) {
  const add = useLiveFlightsStore((s) => s.add);
  const [answer, setAnswer] = useState<{ key: string; state: LiveState } | null>(
    null,
  );
  const request = liveRequestFor(params, new Date());

  useEffect(() => {
    if (request.kind === "hint") return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      let response: LiveSearchResponse;
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/flights?${request.query}`, {
          headers: { "x-device-id": await getDeviceId() },
          signal: controller.signal,
        });
        response = res.ok
          ? ((await res.json()) as LiveSearchResponse)
          : { status: "fallback", reason: "error" };
      } catch {
        if (controller.signal.aborted) return;
        response = { status: "fallback", reason: "error" };
      }
      if (controller.signal.aborted) return;
      if (response.status === "live") add(response);
      setAnswer({ key, state: { status: "done", response } });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `key` stands for everything the request reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const state: LiveState =
    request.kind === "hint"
      ? { status: "hint", hint: request.hint }
      : answer?.key === key
        ? answer.state
        : { status: "loading" };
  return {
    state,
    anywhere: request.kind === "request" && request.anywhere,
    chosenDate: request.kind === "request" ? request.chosenDate : null,
  };
}
