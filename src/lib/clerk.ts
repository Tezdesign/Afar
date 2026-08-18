// Clerk's `{ error }` return value wraps field-level validation failures in
// an `errors[]` array (e.g. `form_identifier_not_found`) under a generic
// top-level `code` like "api_response_error" — the specific code/message
// live on `errors[0]`, not on the error object itself.
type ClerkFieldError = { code?: string; message?: string; longMessage?: string };
type ClerkErrorLike = {
  code?: string;
  message?: string;
  longMessage?: string;
  errors?: ClerkFieldError[];
};

export function clerkErrorCode(error: unknown): string | undefined {
  const err = error as ClerkErrorLike | undefined;
  return err?.errors?.[0]?.code ?? err?.code;
}

export function clerkErrorMessage(error: unknown): string {
  const err = error as ClerkErrorLike | undefined;
  return (
    err?.errors?.[0]?.longMessage ??
    err?.errors?.[0]?.message ??
    err?.longMessage ??
    err?.message ??
    "Something went wrong. Please try again."
  );
}
