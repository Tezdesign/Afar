// Clerk calls this when an account is deleted, so the person's rows go with
// it. Public (Clerk has no session to send), so the only guard is the Svix
// signature, checked before anything else. Deploy with --no-verify-jwt (also
// set in supabase/config.toml).
//
// Secrets: CLERK_WEBHOOK_SIGNING_SECRET is set by hand
//   supabase secrets set CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
// SUPABASE_URL and the secret key are provided by the runtime. The secret key
// never leaves Supabase: it is not in the app, its .env or its bundle.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { Webhook } from "npm:svix@1.15.0";

import { type ClerkEvent, handleClerkWebhook } from "../_shared/clerk_webhook.ts";

// SUPABASE_SECRET_KEYS is a JSON dictionary of secret keys. Older projects
// may only have the legacy service role key, so fall back to it.
function secretKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, string>;
      return keys.default ?? Object.values(keys)[0];
    } catch {
      // fall through to the legacy key
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

Deno.serve((request) => {
  const signingSecret = Deno.env.get("CLERK_WEBHOOK_SIGNING_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const key = secretKey();
  if (!signingSecret || !url || !key) {
    return Response.json(
      { error: "Webhook is not configured (signing secret or Supabase keys missing)." },
      { status: 500 },
    );
  }

  const webhook = new Webhook(signingSecret);
  const db = createClient(url, key, { auth: { persistSession: false } });

  return handleClerkWebhook(
    request,
    (payload, headers) =>
      webhook.verify(payload, {
        "svix-id": headers.id,
        "svix-timestamp": headers.timestamp,
        "svix-signature": headers.signature,
      }) as ClerkEvent,
    async (userId) => {
      // One database function, one transaction. Running it twice is harmless.
      const { error } = await db.rpc("delete_user_data", { p_user_id: userId });
      if (error) throw error;
    },
  );
});
