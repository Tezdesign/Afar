// The logic of the Clerk webhook, with the signature check and the database
// call passed in. No imports, so it also runs under plain Node for
// src/lib/clerkWebhook.check.ts. supabase/functions/clerk-webhook/index.ts
// supplies the real Svix check and the real database call.

export interface ClerkEvent {
  type: string;
  data: { id?: string };
}

export interface SvixHeaders {
  id: string;
  timestamp: string;
  signature: string;
}

/**
 * Verifies the raw request first, then acts.
 * - bad or missing signature: 400, nothing is deleted
 * - user.deleted: deletes that person's rows; a failure answers 500 so Clerk retries
 * - any other event: 200, nothing happens
 * `verify` throws when the signature is not valid.
 */
export async function handleClerkWebhook(
  request: Request,
  verify: (payload: string, headers: SvixHeaders) => ClerkEvent,
  deleteUserData: (userId: string) => Promise<void>,
): Promise<Response> {
  // The signature is made over the exact bytes sent, so read the raw text.
  const payload = await request.text();

  let event: ClerkEvent;
  try {
    event = verify(payload, {
      id: request.headers.get("svix-id") ?? "",
      timestamp: request.headers.get("svix-timestamp") ?? "",
      signature: request.headers.get("svix-signature") ?? "",
    });
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "user.deleted") return Response.json({ ok: true });

  const userId = event.data?.id;
  if (!userId) return Response.json({ error: "No user id." }, { status: 400 });

  try {
    await deleteUserData(userId);
  } catch {
    return Response.json({ error: "Could not delete user data." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
