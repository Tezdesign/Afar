// Client-side Stream Video wiring. Session/token comes from our own backend
// (src/app/api/stream-token+api.ts) — the Stream API secret never reaches
// the app. See AGENTS.md > AI / Stream / Vision Agent Rules.
import { useAuth } from "@clerk/expo";
import { useEffect, useRef, useState } from "react";
import {
  StreamVideoClient,
  type TokenProvider,
  type User,
} from "@stream-io/video-react-native-sdk";

import { getApiBaseUrl } from "@/lib/apiBaseUrl";

interface StreamSession {
  apiKey: string;
  userId: string;
  token: string;
}

async function fetchStreamSession(
  getToken: () => Promise<string | null>,
): Promise<StreamSession> {
  const clerkToken = await getToken();
  const res = await fetch(`${getApiBaseUrl()}/api/stream-token`, {
    headers: clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {},
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Stream session failed: ${res.status} ${body}`);
  }
  return res.json();
}

/** One personal audio room per signed-in user — matches callIdFor() in
 * src/app/api/assistant-call+api.ts. */
export const assistantCallId = (userId: string) => `assistant-${userId}`;
export const ASSISTANT_CALL_TYPE = "default";

/**
 * Creates (or reuses) a StreamVideoClient for the signed-in user. Returns
 * undefined while connecting or when signed out — only mount <StreamVideo>
 * once this resolves.
 */
export function useStreamVideoClient() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [client, setClient] = useState<StreamVideoClient>();

  // Clerk hands back a new `getToken` function on most renders. Reading it
  // through a ref (instead of putting it in the effect's deps) means the
  // effect below only re-runs on an actual sign-in/sign-out transition,
  // not on every unrelated re-render — always calling the latest version.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  });

  useEffect(() => {
    // No setClient(undefined) here: `client` already starts undefined, and
    // this branch is only reached again after a prior signed-in run's own
    // cleanup below has already reset it.
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;
    let current: StreamVideoClient | undefined;
    const getLatestToken = () => getTokenRef.current();

    (async () => {
      const session = await fetchStreamSession(getLatestToken);
      if (cancelled) return;

      const user: User = { id: session.userId };
      const tokenProvider: TokenProvider = async () =>
        (await fetchStreamSession(getLatestToken)).token;

      current = StreamVideoClient.getOrCreateInstance({
        apiKey: session.apiKey,
        user,
        token: session.token,
        tokenProvider,
      });
      setClient(current);
    })().catch((err) => console.error("Stream video auth failed", err));

    return () => {
      cancelled = true;
      current?.disconnectUser().catch((err) => console.error(err));
      setClient(undefined);
    };
  }, [isLoaded, isSignedIn]);

  return client;
}
