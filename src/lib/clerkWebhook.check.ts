// Checks the webhook's logic (supabase/functions/_shared/clerk_webhook.ts).
// The real function checks signatures with Svix, which this project does not
// install, so a stand in with the same Standard Webhooks rules (HMAC SHA256
// over "id.timestamp.body", base64, "v1," prefix) plays that part here. What
// is proven: each outcome, and that nothing is deleted unless the check passes.
// The database function itself is proven by supabase/tests/isolation.sql, and
// the real Svix call by a "Send test event" from the Clerk dashboard.
// Run: node src/lib/clerkWebhook.check.ts
// @ts-expect-error no @types/node in this project, Node resolves it at runtime
import assert from "node:assert/strict";
// @ts-expect-error same
import { createHmac, timingSafeEqual } from "node:crypto";

import {
  handleClerkWebhook,
  type ClerkEvent,
  type SvixHeaders,
} from "../../supabase/functions/_shared/clerk_webhook.ts";

const bytes = (text: string) => new TextEncoder().encode(text);
const key = bytes("a-test-signing-key-of-some-length");

const mac = (k: Uint8Array, headers: Pick<SvixHeaders, "id" | "timestamp">, payload: string) =>
  createHmac("sha256", k).update(`${headers.id}.${headers.timestamp}.${payload}`).digest("base64");

const verify = (payload: string, headers: SvixHeaders): ClerkEvent => {
  const expected = bytes(mac(key, headers, payload));
  const got = bytes(headers.signature.replace(/^v1,/, ""));
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) throw new Error("bad signature");
  return JSON.parse(payload);
};

const signed = (body: object, secretKey: Uint8Array = key) => {
  const raw = JSON.stringify(body);
  const headers = { id: "msg_test1", timestamp: String(Math.floor(Date.now() / 1000)) };
  return new Request("https://example.test/functions/v1/clerk-webhook", {
    method: "POST",
    body: raw,
    headers: {
      "svix-id": headers.id,
      "svix-timestamp": headers.timestamp,
      "svix-signature": `v1,${mac(secretKey, headers, raw)}`,
    },
  });
};

const userDeleted = { type: "user.deleted", data: { id: "user_abc", deleted: true, object: "user" } };
const calls: string[] = [];
const ok = async (id: string) => { calls.push(id); };

// valid user.deleted: deletes that user, answers 200
let res = await handleClerkWebhook(signed(userDeleted), verify, ok);
assert.equal(res.status, 200);
assert.deepEqual(calls, ["user_abc"]);

// a replay of the same event is harmless (the database function is idempotent)
res = await handleClerkWebhook(signed(userDeleted), verify, ok);
assert.equal(res.status, 200);
assert.deepEqual(calls, ["user_abc", "user_abc"]);

// another event type: 200, nothing deleted
res = await handleClerkWebhook(signed({ type: "user.created", data: { id: "user_new" } }), verify, ok);
assert.equal(res.status, 200);
assert.equal(calls.length, 2);

// a failed delete answers 500 so Clerk retries
res = await handleClerkWebhook(signed(userDeleted), verify, async () => { throw new Error("db down"); });
assert.equal(res.status, 500);

// forged signature: 400, nothing deleted
res = await handleClerkWebhook(signed(userDeleted, bytes("not-the-secret")), verify, ok);
assert.equal(res.status, 400);
assert.equal(calls.length, 2);

// no signature headers at all: 400
res = await handleClerkWebhook(new Request("https://example.test/x", { method: "POST", body: JSON.stringify(userDeleted) }), verify, ok);
assert.equal(res.status, 400);

// tampered body with a signature made for another body: 400
const good = signed({ type: "user.created", data: { id: "x" } });
const tampered = new Request("https://example.test/x", { method: "POST", body: JSON.stringify(userDeleted), headers: good.headers });
res = await handleClerkWebhook(tampered, verify, ok);
assert.equal(res.status, 400);
assert.equal(calls.length, 2);

// a user.deleted with no id is refused, nothing deleted
res = await handleClerkWebhook(signed({ type: "user.deleted", data: {} }), verify, ok);
assert.equal(res.status, 400);
assert.equal(calls.length, 2);

console.log("ok: clerk webhook handler");
