// Server-only helper for Expo API routes (src/app/api/*+api.ts). Verifies
// the Clerk session token the client sends and derives the authenticated
// user id from it. Never trust a client-supplied user id — this is the one
// place a request is allowed to say who it's from, per the Stream RN
// skill's auth rule: "the backend must derive the Stream user_id from its
// own authenticated session, not from a client-supplied parameter."
import { verifyToken } from "@clerk/backend";

// The installed @clerk/backend version's verifyToken() returns the decoded
// JWT payload directly at runtime — not the {data, errors} wrapper its own
// .d.ts declares (confirmed by logging the raw result). Handle both shapes
// so this keeps working if the package is upgraded to match its types.
function extractSub(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const payload =
    "data" in result && result.data && typeof result.data === "object"
      ? result.data
      : result;
  const sub = (payload as { sub?: unknown }).sub;
  return typeof sub === "string" ? sub : null;
}

export async function getVerifiedClerkUserId(
  request: Request,
): Promise<{ userId: string } | { error: Response }> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return {
      error: Response.json(
        { error: "Server is missing CLERK_SECRET_KEY." },
        { status: 500 },
      ),
    };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return {
      error: Response.json(
        { error: "Missing Authorization header." },
        { status: 401 },
      ),
    };
  }

  try {
    const result = await verifyToken(token, { secretKey });
    const userId = extractSub(result);
    if (!userId) {
      return {
        error: Response.json(
          { error: "Invalid or expired session." },
          { status: 401 },
        ),
      };
    }
    return { userId };
  } catch {
    return {
      error: Response.json(
        { error: "Invalid or expired session." },
        { status: 401 },
      ),
    };
  }
}
