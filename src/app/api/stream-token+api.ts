// Mints a short-lived Stream Video user token for the signed-in Clerk user.
// GET-only and side-effect-free, so it's safe to call both on first connect
// and again on every token refresh (see the tokenProvider in src/lib/stream.ts).
import { StreamClient } from "@stream-io/node-sdk";

import { getVerifiedClerkUserId } from "@/lib/clerkServerAuth";

const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

export async function GET(request: Request) {
  const auth = await getVerifiedClerkUserId(request);
  if ("error" in auth) return auth.error;

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    return Response.json(
      { error: "Server is missing STREAM_API_KEY/STREAM_API_SECRET." },
      { status: 500 },
    );
  }

  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
  const token = streamClient.generateUserToken({
    user_id: auth.userId,
    validity_in_seconds: 60 * 60 * 4, // ~4h — client re-hits this route to refresh
  });

  return Response.json({
    apiKey: STREAM_API_KEY,
    userId: auth.userId,
    token,
  });
}
