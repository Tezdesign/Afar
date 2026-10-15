import { useCallback, useEffect, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: T };

/**
 * Runs `load` on mount, again whenever `key` changes, and again on `retry()`.
 * `key` stands for everything `load` reads (a string, so a new function every
 * render does not refetch). A slower, older request never overwrites a newer one.
 */
export function useAsync<T>(load: () => Promise<T>, key: string) {
  const [attempt, setAttempt] = useState(0);
  // The last answer and the request it belongs to. An answer for any other
  // request reads as "loading", so no setState is needed to start loading.
  const [answer, setAnswer] = useState<{
    id: string;
    value: Exclude<AsyncState<T>, { status: "loading" }>;
  } | null>(null);
  const id = `${key}#${attempt}`;

  useEffect(() => {
    let current = true;
    load().then(
      (data) => current && setAnswer({ id, value: { status: "ready", data } }),
      () => current && setAnswer({ id, value: { status: "error" } }),
    );
    return () => {
      current = false;
    };
    // `id` covers what `load` closes over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const state: AsyncState<T> =
    answer && answer.id === id ? answer.value : { status: "loading" };
  return { state, retry };
}
