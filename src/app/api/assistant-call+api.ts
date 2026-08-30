// Starts (POST) or stops (DELETE) the trip-assistant AI agent's session in
// the signed-in user's personal call — the separate Vision Agents Python
// worker in ./agent (see agent/agent.py). This does NOT mint the Stream
// token the human uses to join; that's src/app/api/stream-token+api.ts.
import { getVerifiedClerkUserId } from "@/lib/clerkServerAuth";

const VISION_AGENT_URL = process.env.VISION_AGENT_URL;

/** Matches assistantCallId() in src/lib/stream.ts — one call per user. */
const callIdFor = (userId: string) => `assistant-${userId}`;

export async function POST(request: Request) {
  const auth = await getVerifiedClerkUserId(request);
  if ("error" in auth) return auth.error;

  const callId = callIdFor(auth.userId);

  if (!VISION_AGENT_URL) {
    return Response.json({ agentJoined: false, callId, reason: "not_configured" });
  }

  try {
    const res = await fetch(`${VISION_AGENT_URL}/calls/${callId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call_type: "default" }),
    });

    if (res.status === 429) {
      // Agent already has a session in this call — fine, not an error.
      return Response.json({ agentJoined: true, callId, reason: "already_active" });
    }
    if (!res.ok) {
      return Response.json({ agentJoined: false, callId, reason: "agent_error" });
    }

    const data = (await res.json()) as { session_id: string };
    return Response.json({ agentJoined: true, callId, sessionId: data.session_id });
  } catch {
    return Response.json({ agentJoined: false, callId, reason: "unreachable" });
  }
}

export async function DELETE(request: Request) {
  const auth = await getVerifiedClerkUserId(request);
  if ("error" in auth) return auth.error;

  const callId = callIdFor(auth.userId);
  const body = (await request.json().catch(() => ({}))) as { sessionId?: string };

  if (!VISION_AGENT_URL || !body.sessionId) {
    return Response.json({ closed: false });
  }

  try {
    await fetch(`${VISION_AGENT_URL}/calls/${callId}/sessions/${body.sessionId}`, {
      method: "DELETE",
    });
    return Response.json({ closed: true });
  } catch {
    return Response.json({ closed: false });
  }
}
