import "react-native-url-polyfill/auto";

import { getClerkInstance } from "@clerk/expo";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

if (!url || !publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add both to .env (see .env.example), then restart the dev server.",
  );
}

// No Supabase Auth session: Clerk is the only sign in. Supabase trusts
// Clerk's session token through its third party auth link. The token is
// read from the Clerk instance on every request (not from a React effect),
// so a screen's first query already carries it. Signed out, this returns
// null and the request runs as `anon`. A signed in session that cannot
// produce a token throws, so the caller shows its error state and never
// silently falls back to `anon`.
export const supabase = createClient<Database>(url, publishableKey, {
  accessToken: async () => {
    const clerk = getClerkInstance();
    if (!clerk.session) return null;

    const token = await clerk.session.getToken();
    if (!token) throw new Error("Signed in, but Clerk returned no session token.");
    return token;
  },
});
